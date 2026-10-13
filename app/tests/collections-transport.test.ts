import type { V1Secret } from '@kubernetes/client-node';
import { describe, expect, it } from 'vitest';
import { TEST_APP_URL } from './helpers/environment';
import { mockKubernetes } from './helpers/kubernetes';
import { headerValues, loopbackKubernetes, SERVICE_TOKEN } from './helpers/kubernetes-transport';
import { boundSnapshot, historyHash } from './helpers/history';
import { dataUser, nativeSecret, rawData } from './helpers/secret-data';
import { consumerWorkload } from './helpers/consumers';

const namespace = 'unit-test';
const user = {
  ...dataUser,
  groups: ['writers', 'literal,comma', ...Array.from({ length: 34 }, (_, i) => `team-${i}`)],
};

describe.each([true, false])('live SDK pagination (managedOnly=%s)', (managedOnly) => {
  it('excludes history server-side, keeps annotation-based semantics/ACLs and own-key codecs on every page', async () => {
    Object.assign(process.env, {
      KRYPTON_SCOPE: 'cluster',
      KRYPTON_NAMESPACES: namespace,
      KRYPTON_IMPERSONATION: 'true',
      KRYPTON_MANAGED_ONLY: String(managedOnly),
      KRYPTON_ANNOTATION_PREFIX: 'synthetic.example',
    });
    const mock = await mockKubernetes();
    const make = (
      name: string,
      annotations: Record<string, string> = {},
      labels: Record<string, string> = {},
    ): V1Secret => ({
      metadata: { namespace, name, uid: `uid-${name}`, resourceVersion: '17', annotations, labels },
      data: rawData,
    });
    const managed = { 'synthetic.example/managed-by': 'krypton' };
    const objects = [
      make('annotation-only', managed),
      make('label-only', {}, { 'synthetic.example/managed-by': 'krypton' }),
      make('explicit-allowed', { ...managed, 'synthetic.example/allowed-users': user.email }),
      make('explicit-denied', { ...managed, 'synthetic.example/allowed-users': 'other@example.test' }),
      make('unmanaged'),
      make('history', managed, { 'synthetic.example/kind': 'history' }),
    ];
    const server = await loopbackKubernetes((request) => {
      const url = new URL(request.url, 'http://loopback.test');
      if (url.pathname.includes('/configmaps/'))
        return { body: { data: { 'access.json': JSON.stringify({ [namespace]: { groups: ['writers'] } }) } } };
      const selected = objects.filter((secret) => secret.metadata?.labels?.['synthetic.example/kind'] !== 'history');
      const start = url.searchParams.has('continue')
        ? Number(url.searchParams.get('continue')!.slice('page-'.length))
        : 0;
      const end = start + 2;
      return {
        body: {
          apiVersion: 'v1',
          kind: 'SecretList',
          metadata: { continue: end < selected.length ? `page-${end}` : '', resourceVersion: 'stable' },
          items: selected.slice(start, end),
        },
      };
    });
    mock.getCoreApi.mockReturnValue(server.core);
    const auth = await import('@/lib/auth');
    await auth.setSessionCookie(await auth.createSessionToken(user));
    const { GET } = await import('@/app/api/namespaces/[namespace]/secrets/route');
    const response = await GET(new Request(`${TEST_APP_URL}/api/namespaces/${namespace}/secrets`), {
      params: Promise.resolve({ namespace }),
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const result = await response.json();
    expect(result.canCreate).toBe(true);
    expect(result.secrets.map((secret: { name: string }) => secret.name)).toEqual(
      managedOnly
        ? ['annotation-only', 'explicit-allowed']
        : ['annotation-only', 'label-only', 'explicit-allowed', 'unmanaged'],
    );
    for (const secret of result.secrets) {
      expect(secret.keys).toContain('__proto__');
      expect(secret.keys).toContain('constructor');
      expect(secret).not.toHaveProperty('data');
      expect(secret).not.toHaveProperty('binaryData');
    }
    const lists = server.requests.filter((request) =>
      new URL(request.url, 'http://loopback.test').pathname.endsWith('/secrets'),
    );
    expect(lists).toHaveLength(3);
    for (const request of lists) {
      const url = new URL(request.url, 'http://loopback.test');
      expect(url.searchParams.get('labelSelector')).toBe('synthetic.example/kind!=history');
      expect(url.searchParams.get('limit')).toBe('100');
      expect(headerValues(request, 'Impersonate-User')).toEqual([user.email]);
      expect(headerValues(request, 'Impersonate-Group')).toEqual(user.groups);
      expect(headerValues(request, 'Authorization')).toEqual([`Bearer ${SERVICE_TOKEN}`]);
    }
    expect(lists.map((request) => new URL(request.url, 'http://loopback.test').searchParams.get('continue'))).toEqual([
      null,
      'page-2',
      'page-4',
    ]);
    const policyReads = server.requests.filter((request) => request.url.includes('/configmaps/'));
    expect(policyReads).toHaveLength(1);
    expect(headerValues(policyReads[0], 'Impersonate-User')).toEqual([]);
    expect(
      server.requests.some((request) => new URL(request.url, 'http://loopback.test').pathname === '/api/v1/namespaces'),
    ).toBe(false);
  });
});

it('preserves two identities, native history maps and JSON-patch preconditions across real SDK pages/failures', async () => {
  process.env.KRYPTON_IMPERSONATION = 'true';
  const mock = await mockKubernetes();
  const live = nativeSecret();
  const snapshots = [boundSnapshot(live, 1), boundSnapshot(live, 2)];
  const other = { ...user, sub: 'other', email: 'other@example.test', groups: ['other-team', 'other,comma'] };
  const server = await loopbackKubernetes((request) => {
    const url = new URL(request.url, 'http://loopback.test');
    const second = url.searchParams.get('continue') === 'next+/=';
    if (url.pathname.endsWith('/secrets'))
      return { body: { items: [snapshots[second ? 1 : 0]], metadata: { continue: second ? '' : 'next+/=' } } };
    if (request.method === 'PATCH') return { body: {} };
    if (
      url.pathname.endsWith('/statefulsets') &&
      second &&
      headerValues(request, 'Impersonate-User')[0] === other.email
    ) {
      return {
        status: 403,
        body: { message: 'synthetic-private-list-value' },
        headers: { 'x-private': 'synthetic-private-header' },
      };
    }
    const workload = consumerWorkload(second ? 'second' : 'first');
    return {
      body: {
        items: [{ ...workload, spec: { ...workload.spec, serviceName: 'synthetic' } }],
        metadata: { continue: second ? '' : 'next+/=' },
      },
    };
  });
  mock.getCoreApi.mockReturnValue(server.core);
  mock.getAppsApi.mockReturnValue(server.apps);
  const { readSnapshotVersion } = await import('@/lib/snapshot-store');
  const target = await readSnapshotVersion(namespace, live, 2, user);
  expect(target.secret.data).toEqual(rawData);
  expect(Object.hasOwn(target.secret.data!, '__proto__')).toBe(true);
  const { restartConsumers } = await import('@/lib/consumers');
  const [first, second] = await Promise.all([
    restartConsumers(namespace, 'credentials', user),
    restartConsumers(namespace, 'credentials', other),
  ]);
  expect(first).toMatchObject({ status: 'requested', matched: 6, discoveryFailures: [] });
  expect(second).toMatchObject({
    status: 'partial',
    matched: 4,
    discoveryFailures: [{ kind: 'StatefulSet', code: 'forbidden', httpStatus: 403 }],
  });
  expect(JSON.stringify(second)).not.toContain('synthetic-private');
  const historyLists = server.requests.filter((request) => request.url.startsWith('/api/v1/'));
  expect(historyLists).toHaveLength(2);
  for (const request of historyLists)
    expect(new URL(request.url, 'http://loopback.test').searchParams.get('labelSelector')).toBe(
      `krypton.io/source-uid=${historyHash(live.metadata!.uid!)},krypton.io/kind=history`,
    );
  for (const request of server.requests) {
    const identity = headerValues(request, 'Impersonate-User')[0] === user.email ? user : other;
    expect(headerValues(request, 'Impersonate-Group')).toEqual(identity.groups);
    expect(headerValues(request, 'Authorization')).toEqual([`Bearer ${SERVICE_TOKEN}`]);
    if (request.method === 'PATCH') {
      expect(headerValues(request, 'Content-Type')).toEqual(['application/json-patch+json']);
      const name = request.url.split('/').pop()!;
      expect(JSON.parse(request.body)).toEqual([
        { op: 'test', path: '/metadata/uid', value: `synthetic-uid-${name}` },
        { op: 'test', path: '/metadata/resourceVersion', value: '1001' },
        {
          op: 'add',
          path: '/spec/template/metadata',
          value: {
            annotations: {
              'krypton.io/restarted-at': expect.any(String),
            },
          },
        },
      ]);
    } else expect(new URL(request.url, 'http://loopback.test').searchParams.get('limit')).toBe('100');
  }
  expect(server.requests.filter((request) => request.method === 'PATCH')).toHaveLength(10);
});
