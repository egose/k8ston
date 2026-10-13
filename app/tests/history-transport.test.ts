import { beforeEach, expect, it, vi } from 'vitest';
import { TEST_APP_URL } from './helpers/environment';
import { boundSnapshot, historyHash, historyName, mockHistoryStore } from './helpers/history';
import { headerValues, loopbackKubernetes, SERVICE_TOKEN } from './helpers/kubernetes-transport';
import { dataUser, nativeSecret, rawData, textData } from './helpers/secret-data';

const namespace = 'unit-test';
const uid = 'synthetic-live-uid';
const human = { ...dataUser, groups: [...dataUser.groups, ...Array.from({ length: 35 }, (_, i) => `team-${i}`)] };
async function signIn() {
  const auth = await import('@/lib/auth');
  await auth.setSessionCookie(await auth.createSessionToken(human));
}

beforeEach(() => {
  process.env.KRYPTON_IMPERSONATION = 'true';
  process.env.KRYPTON_HISTORY_LIMIT = '1';
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

it.each([64, 253])(
  'carries raw immutable history, exact retries, and conditional cleanup over the SDK for %i-character names',
  async (length) => {
    const live = nativeSecret({ type: 'kubernetes.io/tls', data: { ...rawData, 'tls.crt': '', 'tls.key': '' } });
    live.metadata!.name = 'a'.repeat(length);
    live.metadata!.annotations!['example.test/controller'] = 'retained-on-live-only';
    const previous = structuredClone(live);
    previous.metadata!.resourceVersion = '11';
    const old = boundSnapshot(previous, 1);
    const store = await mockHistoryStore([live, old]);
    const server = await loopbackKubernetes(store.reply);
    store.getCoreApi.mockReturnValue(server.core);
    await signIn();
    const { createSnapshot, deleteSnapshots } = await import('@/lib/snapshot-store');
    await createSnapshot(namespace, live, human);
    const archived = store.get(namespace, historyName(uid, 2));
    await createSnapshot(namespace, live, human);
    expect(store.get(namespace, historyName(uid, 2))).toEqual(archived);

    const name = live.metadata!.name!;
    const url = `${TEST_APP_URL}/api/namespaces/${namespace}/secrets/${name}`;
    const ctx = { params: Promise.resolve({ namespace, name }) };
    const { GET } = await import('@/app/api/namespaces/[namespace]/secrets/[name]/versions/route');
    const history = await (await GET(new Request(`${url}/versions`), ctx)).json();
    expect(history.versions[0].data).toEqual({ ...textData, 'tls.crt': '', 'tls.key': '' });
    expect(history.versions[0].binaryData).toEqual({ 'archive.bin': rawData['archive.bin'], control: rawData.control });
    const { PUT } = await import('@/app/api/namespaces/[namespace]/secrets/[name]/route');
    const updated = await PUT(
      new Request(url, {
        method: 'PUT',
        body: JSON.stringify({ resourceVersion: '17', description: 'updated metadata' }),
      }),
      ctx,
    );
    expect(updated.status).toBe(200);
    const { POST } = await import('@/app/api/namespaces/[namespace]/secrets/[name]/restore/route');
    const restored = await POST(
      new Request(`${url}/restore`, {
        method: 'POST',
        body: JSON.stringify({ version: 2, resourceVersion: (await updated.json()).secret.resourceVersion }),
      }),
      ctx,
    );
    expect(restored.status).toBe(200);
    expect((await restored.json()).secret).toMatchObject({
      version: 4,
      binaryData: { 'archive.bin': rawData['archive.bin'] },
    });
    const current = store.get(namespace, name);
    expect(current.data).toEqual(live.data);
    expect(current.metadata).toMatchObject({
      uid,
      ownerReferences: live.metadata!.ownerReferences,
      finalizers: live.metadata!.finalizers,
      annotations: { 'example.test/controller': 'retained-on-live-only', 'krypton.io/description': 'updated metadata' },
    });
    expect(current.type).toBe('kubernetes.io/tls');
    expect(current.immutable).toBe(false);
    await deleteSnapshots(namespace, current, human);
    expect(store.objects.size).toBe(1);

    const creates = server.requests.filter((r) => r.method === 'POST');
    expect(creates).toHaveLength(4); // Initial save, two verified retries, pre-restore save.
    for (const request of creates) {
      const body = JSON.parse(request.body);
      expect(body).toMatchObject({ type: 'Opaque', immutable: true, data: live.data });
      expect(Object.hasOwn(body.data, '__proto__')).toBe(true);
      expect(body.metadata.name.length).toBeLessThanOrEqual(63);
      expect(body.metadata.annotations).toMatchObject({
        'krypton.io/source-uid': uid,
        'krypton.io/history-of': name,
        'krypton.io/source-type': 'kubernetes.io/tls',
      });
      expect(body.metadata).not.toHaveProperty('ownerReferences');
      expect(body.metadata).not.toHaveProperty('finalizers');
      expect(body.metadata.annotations).not.toHaveProperty('example.test/controller');
      for (const value of Object.values<string>(body.metadata.labels)) expect(value.length).toBeLessThanOrEqual(63);
    }
    const deletes = server.requests.filter((r) => r.method === 'DELETE');
    expect(deletes).toHaveLength(3);
    for (const request of deletes) {
      expect(JSON.parse(request.body)).toMatchObject({
        preconditions: { uid: expect.any(String), resourceVersion: expect.any(String) },
      });
      expect(server.requests.some((r) => r.method === 'GET' && r.url === request.url)).toBe(true);
    }
    for (const request of server.requests) {
      expect(headerValues(request, 'Impersonate-User')).toEqual([human.email]);
      expect(headerValues(request, 'Impersonate-Group')).toEqual(human.groups);
      expect(headerValues(request, 'Authorization')).toEqual([`Bearer ${SERVICE_TOKEN}`]);
      const selector = new URL(request.url, 'http://loopback.test').searchParams.get('labelSelector');
      if (selector) expect(selector).toBe(`krypton.io/source-uid=${historyHash(uid)},krypton.io/kind=history`);
    }
  },
);

it.each(['missing own key', 'different source revision', 'mutable'])(
  'rejects SDK collision verification with %s and never sends a live replacement',
  async (corruption) => {
    const live = nativeSecret();
    const occupied = boundSnapshot(live, 2);
    if (corruption === 'missing own key') delete occupied.data!.__proto__;
    if (corruption === 'different source revision') {
      occupied.metadata!.annotations!['krypton.io/source-resource-version'] = 'different-rv';
      occupied.metadata!.labels!['krypton.io/source-resource-version'] = historyHash('different-rv');
    }
    if (corruption === 'mutable') occupied.immutable = false;
    const store = await mockHistoryStore([live, occupied]);
    const server = await loopbackKubernetes(store.reply);
    store.getCoreApi.mockReturnValue(server.core);
    await signIn();
    const { PUT } = await import('@/app/api/namespaces/[namespace]/secrets/[name]/route');
    const response = await PUT(
      new Request(`${TEST_APP_URL}/api/namespaces/${namespace}/secrets/credentials`, {
        method: 'PUT',
        body: JSON.stringify({ resourceVersion: '17', description: 'attempted metadata edit' }),
      }),
      { params: Promise.resolve({ namespace, name: 'credentials' }) },
    );
    expect(response.status).toBe(409);
    expect(server.requests.some((r) => r.method === 'PUT' || r.method === 'DELETE')).toBe(false);
    expect(server.requests.some((r) => r.method === 'GET' && r.url.endsWith(historyName(uid, 2)))).toBe(true);
    expect(store.get(namespace, 'credentials')).toEqual(live);
  },
);

it('detects terminating snapshots behind a successful SDK DELETE Status and reports pruning failure', async () => {
  const live = nativeSecret();
  const old = boundSnapshot(live, 1);
  old.metadata!.finalizers = ['example.test/hold'];
  const store = await mockHistoryStore([live, old]);
  const server = await loopbackKubernetes(store.reply);
  store.getCoreApi.mockReturnValue(server.core);
  await signIn();
  const { PUT } = await import('@/app/api/namespaces/[namespace]/secrets/[name]/route');
  const response = await PUT(
    new Request(`${TEST_APP_URL}/api/namespaces/${namespace}/secrets/credentials`, {
      method: 'PUT',
      body: JSON.stringify({ resourceVersion: '17', description: 'attempted metadata edit' }),
    }),
    { params: Promise.resolve({ namespace, name: 'credentials' }) },
  );
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({
    error:
      'History pruning incomplete: 0/1 confirmed absent, 1 still present, 0 failed. Live write was not attempted; retry after resolving cleanup.',
  });
  expect(server.requests.some((r) => r.method === 'PUT')).toBe(false);
  const removal = server.requests.find((r) => r.method === 'DELETE')!;
  expect(JSON.parse(removal.body).preconditions).toEqual({
    uid: old.metadata!.uid,
    resourceVersion: old.metadata!.resourceVersion,
  });
  expect(store.get(namespace, old.metadata!.name!).metadata!.deletionTimestamp).toBeDefined();
  expect(store.get(namespace, 'credentials')).toEqual(live);
});
