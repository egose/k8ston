import type { V1Secret } from '@kubernetes/client-node';
import { expect, it } from 'vitest';
import { TEST_APP_URL } from './helpers/environment';
import { boundSnapshot } from './helpers/history';
import { mockKubernetes } from './helpers/kubernetes';
import { loopbackKubernetes } from './helpers/kubernetes-transport';
import { dataUser, nativeSecret } from './helpers/secret-data';

/** Deterministic byte/request comparison, deliberately no timing/speed assertion. */
it('measures transferred synthetic JSON for the original full list versus history-excluding pages', async () => {
  Object.assign(process.env, { K8STON_SCOPE: 'cluster', K8STON_NAMESPACES: 'unit-test' });
  const mock = await mockKubernetes();
  const objects: V1Secret[] = [];
  const payload = Buffer.from('synthetic-configuration-line=fixture-only\n'.repeat(220)).subarray(0, 8192);
  expect(payload.byteLength).toBe(8192);
  for (let i = 0; i < 120; i++) {
    const live = nativeSecret({
      data: Object.fromEntries([
        ['__proto__', payload.subarray(0, 128).toString('base64')],
        ['settings.conf', payload.subarray(128).toString('base64')],
      ]),
    });
    live.metadata!.name = `application-${String(i).padStart(3, '0')}-credentials`;
    live.metadata!.uid = `synthetic-source-${i}`;
    live.metadata!.resourceVersion = `revision-${i}-21`;
    live.metadata!.annotations!['k8ston.io/version'] = '21';
    objects.push(live);
    for (let version = 1; version <= 20; version++) {
      const source = { ...live, metadata: { ...live.metadata, resourceVersion: `revision-${i}-${version}` } };
      objects.push(boundSnapshot(source, version));
    }
  }
  const transferred: Array<{ bytes: number; objects: number }> = [];
  const server = await loopbackKubernetes((request) => {
    const url = new URL(request.url, 'http://loopback.test');
    // No access policy ConfigMap in this fixture: the teams lookup 404s (open),
    // like a cluster without namespace restrictions. Not a secrets page.
    if (url.pathname.includes('/configmaps/')) {
      return { status: 404, body: { kind: 'Status', code: 404, message: 'configmaps "k8ston-access" not found' } };
    }
    const selected = url.searchParams.has('labelSelector')
      ? objects.filter((secret) => secret.metadata?.labels?.['k8ston.io/kind'] !== 'history')
      : objects;
    const start = Number(url.searchParams.get('continue') ?? '0');
    const end = start + Number(url.searchParams.get('limit') ?? selected.length);
    const body = {
      apiVersion: 'v1',
      kind: 'SecretList',
      metadata: {
        resourceVersion: 'synthetic-collection-revision',
        continue: end < selected.length ? String(end) : '',
      },
      items: selected.slice(start, end),
    };
    transferred.push({ bytes: Buffer.byteLength(JSON.stringify(body)), objects: body.items.length });
    return { body };
  });
  mock.getCoreApi.mockReturnValue(server.core);
  const auth = await import('@/lib/auth');
  await auth.setSessionCookie(await auth.createSessionToken(dataUser));
  const { filterVisibleSecrets } = await import('@/lib/authz');
  const { toSummary } = await import('@/lib/secrets');
  // Reproduce the original one-call list/filter/summary path over the real SDK.
  const original = await server.core.listNamespacedSecret({ namespace: 'unit-test' });
  const oldPublicBody = JSON.stringify({
    namespace: 'unit-test',
    secrets: (await filterVisibleSecrets(dataUser, 'unit-test', original.items)).map((secret) =>
      toSummary('unit-test', secret),
    ),
    canCreate: true,
    teams: [],
    creatableTeams: [],
  });
  const before = { requests: server.requests.length, objects: transferred[0].objects, bytes: transferred[0].bytes };
  const { GET } = await import('@/app/api/namespaces/[namespace]/secrets/route');
  const response = await GET(new Request(`${TEST_APP_URL}/api/namespaces/unit-test/secrets`), {
    params: Promise.resolve({ namespace: 'unit-test' }),
  });
  expect(response.status).toBe(200);
  const newPublicBody = await response.text();
  expect(newPublicBody === oldPublicBody).toBe(true);
  const after = {
    requests: server.requests.length - before.requests,
    objects: transferred.slice(1).reduce((sum, page) => sum + page.objects, 0),
    bytes: transferred.slice(1).reduce((sum, page) => sum + page.bytes, 0),
  };
  expect(before.requests).toBe(1);
  expect(before.objects).toBe(2520);
  // Two history-excluding secrets pages + one teams policy lookup (404 = open).
  expect(after.requests).toBe(3);
  expect(after.objects).toBe(120);
  expect(after.bytes).toBeLessThan(before.bytes / 20);
  expect(mock.core.listNamespace).not.toHaveBeenCalled();
  // Values, headers, object names and response payloads never enter evidence.
  console.info(
    'KRY-08 collection measurement',
    JSON.stringify({
      fixture: { live: 120, history: 2400, decodedDataBytesPerObject: 8192 },
      before,
      after,
      publicSummaryBytes: Buffer.byteLength(newPublicBody),
      namespaceListRequests: 0,
    }),
  );
});
