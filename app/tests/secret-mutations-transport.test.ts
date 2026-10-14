import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TEST_APP_URL } from './helpers/environment';
import { boundSnapshot, mockHistoryStore } from './helpers/history';
import { headerValues, loopbackKubernetes, SERVICE_TOKEN } from './helpers/kubernetes-transport';
import { dataUser, nativeSecret, rawData } from './helpers/secret-data';

const namespace = 'unit-test';
const name = 'credentials';
const revision = 'opaque/17:revision?x=1';
const human = { ...dataUser, groups: [...dataUser.groups, ...Array.from({ length: 35 }, (_, i) => `team-${i}`)] };
const path = `/api/v1/namespaces/${namespace}/secrets/${name}`;
const url = `${TEST_APP_URL}/api/namespaces/${namespace}/secrets/${name}`;
const context = () => ({ params: Promise.resolve({ namespace, name }) });

async function setup(finalizers: string[] = []) {
  const live = nativeSecret();
  Object.assign(live.metadata!, { resourceVersion: revision, finalizers });
  const snapshot = boundSnapshot(live, 1, { prior: 'cHJpb3I=' });
  const store = await mockHistoryStore([live, snapshot]);
  const auth = await import('@/lib/auth');
  await auth.setSessionCookie(await auth.createSessionToken(human));
  return { ...store, live, snapshot };
}

async function remove(keepHistory = false) {
  const { DELETE } = await import('@/app/api/namespaces/[namespace]/secrets/[name]/route');
  return DELETE(
    new Request(`${url}?${new URLSearchParams({ resourceVersion: revision, keepHistory: String(keepHistory) })}`, {
      method: 'DELETE',
    }),
    context(),
  );
}

beforeEach(() => {
  process.env.K8STON_IMPERSONATION = 'true';
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('real SDK destructive-operation wire contract', () => {
  it.each([false, true])(
    'carries exact delete preconditions and complete identity with keepHistory=%s',
    async (keepHistory) => {
      const store = await setup();
      const server = await loopbackKubernetes(store.reply);
      store.getCoreApi.mockReturnValue(server.core);
      const response = await remove(keepHistory);
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ status: 'deleted', history: keepHistory ? 'retained' : 'cleaned' });
      const deletes = server.requests.filter((r) => r.method === 'DELETE');
      expect(deletes.map((r) => r.url)).toEqual(
        keepHistory ? [path] : [path.replace(name, store.snapshot.metadata!.name!), path],
      );
      for (const request of deletes) {
        const original = request.url === path ? store.live : store.snapshot;
        expect(JSON.parse(request.body)).toEqual({
          preconditions: { uid: original.metadata!.uid, resourceVersion: original.metadata!.resourceVersion },
        });
      }
      for (const request of server.requests) {
        expect(headerValues(request, 'Impersonate-User')).toEqual([human.email]);
        expect(headerValues(request, 'Impersonate-Group')).toEqual(human.groups);
        expect(headerValues(request, 'Authorization')).toEqual([`Bearer ${SERVICE_TOKEN}`]);
      }
      expect(server.requests.at(-1)).toMatchObject({ method: 'GET', url: path });
      if (keepHistory) expect(store.get(namespace, store.snapshot.metadata!.name!)).toEqual(store.snapshot);
    },
  );

  it.each(['uid', 'resourceVersion'] as const)('protects a live %s race at the actual SDK DELETE', async (field) => {
    const store = await setup();
    const erase = store.core.deleteNamespacedSecret.getMockImplementation()!;
    const replacement = structuredClone(store.live);
    replacement.metadata![field] = 'in-flight-native-change';
    store.core.deleteNamespacedSecret.mockImplementation(async (args) => {
      if (args.name === name) store.seed(replacement);
      return erase(args);
    });
    const server = await loopbackKubernetes(store.reply);
    store.getCoreApi.mockReturnValue(server.core);
    expect((await remove()).status).toBe(409);
    expect(store.get(namespace, name)).toEqual(replacement);
    const request = server.requests.find((r) => r.method === 'DELETE' && r.url === path)!;
    expect(JSON.parse(request.body).preconditions).toEqual({
      uid: store.live.metadata!.uid,
      resourceVersion: revision,
    });
  });

  it.each(['uid', 'resourceVersion'] as const)(
    'protects a snapshot %s race at the actual SDK DELETE and retains live authorization',
    async (field) => {
      const store = await setup();
      const erase = store.core.deleteNamespacedSecret.getMockImplementation()!;
      const replacement = structuredClone(store.snapshot);
      replacement.metadata![field] = 'in-flight-snapshot-change';
      store.core.deleteNamespacedSecret.mockImplementationOnce(async (args) => {
        store.seed(replacement);
        return erase(args);
      });
      const server = await loopbackKubernetes(store.reply);
      store.getCoreApi.mockReturnValue(server.core);
      expect((await remove()).status).toBe(409);
      expect(store.get(namespace, name)).toEqual(store.live);
      expect(store.get(namespace, store.snapshot.metadata!.name!)).toEqual(replacement);
      expect(server.requests.some((r) => r.method === 'DELETE' && r.url === path)).toBe(false);
    },
  );

  it.each(['Status', 'Secret'] as const)(
    'confirms pending finalizers over HTTP when DELETE returns %s',
    async (shape) => {
      const store = await setup(['example.test/hold']);
      const server = await loopbackKubernetes(async (request) => {
        const response = await store.reply(request);
        if (shape === 'Secret' && request.method === 'DELETE' && request.url === path)
          return { body: store.get(namespace, name) };
        return response;
      });
      store.getCoreApi.mockReturnValue(server.core);
      const response = await remove();
      expect(response.status).toBe(202);
      const body = await response.json();
      expect(body).toMatchObject({
        status: 'pending',
        resourceVersion: store.get(namespace, name).metadata!.resourceVersion,
        deletionTimestamp: '2026-01-02T00:00:00.000Z',
      });
      expect(body).not.toHaveProperty('deleted');
      expect(server.requests.at(-1)).toMatchObject({ method: 'GET', url: path });
    },
  );

  it('rejects a stale restore before writes, then sends the valid expected live UID/RV and native bytes', async () => {
    const store = await setup();
    const server = await loopbackKubernetes(store.reply);
    store.getCoreApi.mockReturnValue(server.core);
    const { POST } = await import('@/app/api/namespaces/[namespace]/secrets/[name]/restore/route');
    const request = (resourceVersion: string) =>
      new Request(`${url}/restore`, { method: 'POST', body: JSON.stringify({ version: 1, resourceVersion }) });
    expect((await POST(request('stale-browser-revision'), context())).status).toBe(409);
    expect(server.requests.every((r) => r.method === 'GET' && r.url === path)).toBe(true);
    expect((await POST(request(revision), context())).status).toBe(200);
    const write = JSON.parse(server.requests.find((r) => r.method === 'PUT')!.body);
    expect(write).toMatchObject({
      metadata: { uid: store.live.metadata!.uid, resourceVersion: revision },
      data: store.snapshot.data,
    });
    const archive = JSON.parse(server.requests.find((r) => r.method === 'POST')!.body);
    expect(archive.data).toEqual(rawData);
  });
});
