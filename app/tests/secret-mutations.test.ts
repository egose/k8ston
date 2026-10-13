import type { V1Secret } from '@kubernetes/client-node';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TEST_APP_URL } from './helpers/environment';
import { apiError, boundSnapshot, historyName, mockHistoryStore } from './helpers/history';
import { dataUser, nativeSecret, rawData } from './helpers/secret-data';

const namespace = 'unit-test';
const name = 'credentials';
const uid = 'synthetic-live-uid';
const revision = 'opaque/revision:17?source=live';
const user = { ...dataUser, groups: ['writers'] };
const url = `${TEST_APP_URL}/api/namespaces/${namespace}/secrets/${name}`;
const context = () => ({ params: Promise.resolve({ namespace, name }) });

function currentSecret() {
  const live = nativeSecret({ data: { current: 'Y3VycmVudA==' } });
  live.metadata!.resourceVersion = revision;
  live.metadata!.finalizers = [];
  Object.assign(live.metadata!.annotations!, { 'krypton.io/version': '3', 'krypton.io/allowed-users': user.email });
  return live;
}

async function setup(live = currentSecret(), snapshots = [boundSnapshot(live, 2, rawData), boundSnapshot(live, 1)]) {
  const store = await mockHistoryStore([live, ...snapshots]);
  const auth = await import('@/lib/auth');
  await auth.setSessionCookie(await auth.createSessionToken(user));
  return { ...store, live, snapshots };
}

async function remove(resourceVersion: string | undefined = revision, keepHistory = false, extraQuery = '') {
  const { DELETE } = await import('@/app/api/namespaces/[namespace]/secrets/[name]/route');
  const query = new URLSearchParams();
  if (resourceVersion !== undefined) query.set('resourceVersion', resourceVersion);
  if (keepHistory) query.set('keepHistory', 'true');
  return DELETE(new Request(`${url}?${query}${extraQuery}`, { method: 'DELETE' }), context());
}

async function restore(resourceVersion: unknown = revision) {
  const { POST } = await import('@/app/api/namespaces/[namespace]/secrets/[name]/restore/route');
  return POST(
    new Request(`${url}/restore`, { method: 'POST', body: JSON.stringify({ version: 2, resourceVersion }) }),
    context(),
  );
}

function noWrites(store: Awaited<ReturnType<typeof setup>>) {
  expect(store.core.createNamespacedSecret).not.toHaveBeenCalled();
  expect(store.core.replaceNamespacedSecret).not.toHaveBeenCalled();
  expect(store.core.deleteNamespacedSecret).not.toHaveBeenCalled();
}

function changed(live: V1Secret, change: 'data' | 'ACL' | 'UID' | 'UID only') {
  const next = structuredClone(live);
  if (change !== 'UID only') next.metadata!.resourceVersion = 'concurrent-revision';
  if (change === 'data') next.data = { external: 'ZXh0ZXJuYWw=' };
  if (change === 'ACL') next.metadata!.annotations!['krypton.io/allowed-users'] = 'other-owner@example.test';
  if (change === 'UID' || change === 'UID only') next.metadata!.uid = 'replacement-uid';
  return next;
}

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('required expected revisions and rejection before side effects', () => {
  it.each(['', ' ', '\t'])('rejects blank DELETE revision %j before history or live access', async (value) => {
    const store = await setup();
    expect((await remove(value)).status).toBe(400);
    expect(store.core.readNamespacedSecret).not.toHaveBeenCalled();
    expect(store.core.listNamespacedSecret).not.toHaveBeenCalled();
    noWrites(store);
  });

  it('rejects a missing DELETE revision (including keepHistory requests)', async () => {
    const store = await setup();
    const { DELETE } = await import('@/app/api/namespaces/[namespace]/secrets/[name]/route');
    for (const suffix of ['', '?keepHistory=true']) {
      expect((await DELETE(new Request(`${url}${suffix}`, { method: 'DELETE' }), context())).status).toBe(400);
    }
    expect(store.core.listNamespacedSecret).not.toHaveBeenCalled();
    noWrites(store);
  });

  it.each(['&resourceVersion=other', '&keepHistory=yes', '&keepHistory=true&keepHistory=false'])(
    'rejects ambiguous destructive query %s',
    async (query) => {
      const store = await setup();
      expect((await remove(revision, false, query)).status).toBe(400);
      noWrites(store);
    },
  );

  it.each([null, '', ' ', 17, false, ['17']])(
    'rejects invalid restore revision %j before history access',
    async (value) => {
      const store = await setup();
      expect((await restore(value)).status).toBe(400);
      expect(store.core.readNamespacedSecret).not.toHaveBeenCalled();
      expect(store.core.listNamespacedSecret).not.toHaveBeenCalled();
      noWrites(store);
    },
  );

  it('rejects a restore with only an app version', async () => {
    const store = await setup();
    const { POST } = await import('@/app/api/namespaces/[namespace]/secrets/[name]/restore/route');
    expect(
      (await POST(new Request(`${url}/restore`, { method: 'POST', body: '{"version":2}' }), context())).status,
    ).toBe(400);
    noWrites(store);
  });

  it.each(['delete', 'restore', 'keepHistory'] as const)(
    'rejects stale %s with no snapshot, cleanup, or live mutation',
    async (action) => {
      const store = await setup();
      const response =
        action === 'restore'
          ? await restore('old-browser-revision')
          : await remove('old-browser-revision', action === 'keepHistory');
      expect(response.status).toBe(409);
      expect(await response.json()).toEqual({ error: expect.stringContaining('resourceVersion mismatch') });
      expect(store.core.listNamespacedSecret).not.toHaveBeenCalled();
      noWrites(store);
      expect(store.get(namespace, name)).toEqual(store.live);
      expect(store.objects.size).toBe(3);
    },
  );

  it.each(['uid', 'resourceVersion'] as const)(
    'refuses incomplete live %s before either destructive operation',
    async (field) => {
      const live = currentSecret();
      delete live.metadata![field];
      const store = await setup(live, []);
      expect((await remove()).status).toBe(409);
      expect((await restore()).status).toBe(409);
      noWrites(store);
    },
  );

  it('refuses restore of a terminating live Secret without saving or pruning history', async () => {
    const live = currentSecret();
    live.metadata!.deletionTimestamp = new Date('2026-01-02T00:00:00Z');
    const store = await setup(live);
    const response = await restore();
    expect(response.status).toBe(409);
    expect(await response.text()).toContain('being deleted');
    expect(store.core.listNamespacedSecret).not.toHaveBeenCalled();
    noWrites(store);
  });
});

describe('restore native CAS and raw-data integrity', () => {
  it('accepts an opaque expected revision and retains live UID/RV/lifecycle in the replacement', async () => {
    const store = await setup();
    const response = await restore();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.secret).toMatchObject({ version: 4, binaryData: { 'archive.bin': rawData['archive.bin'] } });
    expect(body.secret.resourceVersion).not.toBe(revision);
    expect(store.core.replaceNamespacedSecret.mock.calls[0][0].body).toMatchObject({
      data: rawData,
      metadata: {
        uid,
        resourceVersion: revision,
        ownerReferences: store.live.metadata!.ownerReferences,
        finalizers: [],
      },
    });
    expect(store.get(namespace, historyName(uid, 3)).data).toEqual(store.live.data);
  });

  it.each(['data', 'ACL', 'UID', 'UID only'] as const)(
    'protects an in-flight %s change using native replace CAS',
    async (change) => {
      const store = await setup();
      const next = changed(store.live, change);
      const replace = store.core.replaceNamespacedSecret.getMockImplementation()!;
      store.core.replaceNamespacedSecret.mockImplementationOnce(async (args) => {
        store.seed(next);
        return replace(args);
      });
      const response = await restore();
      expect(response.status).toBe(409);
      expect(await response.text()).toContain('Reload and retry');
      expect(store.get(namespace, name)).toEqual(next);
      expect(store.get(namespace, historyName(uid, 3)).data).toEqual(store.live.data);
      expect(store.core.replaceNamespacedSecret.mock.calls[0][0].body.metadata).toMatchObject({
        uid,
        resourceVersion: revision,
      });
    },
  );

  it('turns disappearance during replace into a reloadable conflict', async () => {
    const store = await setup();
    store.core.replaceNamespacedSecret.mockImplementationOnce(async () => {
      store.objects.delete(`${namespace}/${name}`);
      throw apiError(404);
    });
    expect((await restore()).status).toBe(409);
    expect(store.get(namespace, historyName(uid, 3))).toBeDefined();
  });
});

describe.each(['delete', 'restore'] as const)(
  '%s rechecks the authorization object after inventory reads',
  (action) => {
    it.each(['data', 'ACL', 'UID', 'UID only'] as const)(
      'stops before any writes when %s changed while listing history',
      async (change) => {
        const store = await setup();
        const list = store.core.listNamespacedSecret.getMockImplementation()!;
        const next = changed(store.live, change);
        store.core.listNamespacedSecret.mockImplementationOnce(async (args) => {
          const result = await list(args);
          store.seed(next);
          return result;
        });
        expect((await (action === 'delete' ? remove() : restore())).status).toBe(409);
        noWrites(store);
        expect(store.get(namespace, name)).toEqual(next);
        expect(store.objects.size).toBe(3);
      },
    );

    it.each([403, 404, 500])('stops when the recheck returns %i', async (status) => {
      const store = await setup();
      store.core.readNamespacedSecret.mockResolvedValueOnce(store.live).mockRejectedValueOnce(apiError(status));
      const response = await (action === 'delete' ? remove() : restore());
      expect(response.status).toBe(status === 404 ? 409 : 503);
      expect(await response.text()).not.toContain('synthetic-private');
      noWrites(store);
    });
  },
);

describe('retryable deletion ordering and snapshot preconditions', () => {
  it('confirms UID-bound history absence before deleting live with exact UID/RV preconditions', async () => {
    const store = await setup();
    const response = await remove();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'deleted', name, deleted: name, uid, history: 'cleaned' });
    const calls = store.core.deleteNamespacedSecret.mock.calls.map(([args]) => args);
    expect(calls.map((args) => args.name)).toEqual([historyName(uid, 2), historyName(uid, 1), name]);
    for (const args of calls) {
      const original = [store.live, ...store.snapshots].find((s) => s.metadata!.name === args.name)!;
      expect(args.body?.preconditions).toEqual({
        uid: original.metadata!.uid,
        resourceVersion: original.metadata!.resourceVersion,
      });
    }
    const finalInventory = store.core.listNamespacedSecret.mock.invocationCallOrder.at(-1)!;
    expect(finalInventory).toBeLessThan(store.core.deleteNamespacedSecret.mock.invocationCallOrder.at(-1)!);
    expect(store.objects.size).toBe(0);
  });

  it.each(['initial inventory', 'final inventory', 'partial delete', 'absence confirmation'] as const)(
    'keeps live authorization available after %s failure, and retries remaining cleanup',
    async (failure) => {
      const store = await setup();
      const list = store.core.listNamespacedSecret.getMockImplementation()!;
      const erase = store.core.deleteNamespacedSecret.getMockImplementation()!;
      const read = store.core.readNamespacedSecret.getMockImplementation()!;
      if (failure === 'initial inventory') store.core.listNamespacedSecret.mockRejectedValueOnce(apiError(403));
      if (failure === 'final inventory')
        store.core.listNamespacedSecret.mockImplementationOnce(list).mockRejectedValueOnce(apiError(500));
      if (failure === 'partial delete')
        store.core.deleteNamespacedSecret.mockImplementationOnce(erase).mockRejectedValueOnce(apiError(403));
      if (failure === 'absence confirmation')
        store.core.readNamespacedSecret.mockImplementation(async (args) => {
          if (args.name === historyName(uid, 2)) throw apiError(403);
          return read(args);
        });
      const response = await remove();
      expect(response.status).toBe(503);
      const body = await response.text();
      expect(body).toContain('History cleanup');
      expect(body).toContain('Live deletion was not attempted');
      expect(body).not.toContain('synthetic-private');
      expect(store.get(namespace, name)).toEqual(store.live);
      expect(store.core.deleteNamespacedSecret.mock.calls.some(([args]) => args.name === name)).toBe(false);
      if (failure === 'partial delete') {
        expect(() => store.get(namespace, historyName(uid, 2))).toThrow();
        expect(store.get(namespace, historyName(uid, 1))).toBeDefined();
        expect(body).toContain('1/2 confirmed absent');
      }
      store.core.readNamespacedSecret.mockImplementation(read);
      expect((await remove()).status).toBe(200);
      expect(store.objects.size).toBe(0);
    },
  );

  it('retains live when snapshot finalizers block cleanup, then retries using the repaired snapshot revision', async () => {
    const live = currentSecret();
    const snapshot = boundSnapshot(live, 2);
    snapshot.metadata!.finalizers = ['example.test/hold'];
    const store = await setup(live, [snapshot]);
    expect((await remove()).status).toBe(503);
    expect(store.get(namespace, name)).toEqual(live);
    const repaired = store.get(namespace, snapshot.metadata!.name!);
    expect(repaired.metadata!.deletionTimestamp).toBeDefined();
    repaired.metadata!.finalizers = [];
    repaired.metadata!.resourceVersion = 'repaired-snapshot-rv';
    store.seed(repaired);
    expect((await remove()).status).toBe(200);
    expect(store.core.deleteNamespacedSecret.mock.calls[1][0].body?.preconditions).toEqual({
      uid: snapshot.metadata!.uid,
      resourceVersion: 'repaired-snapshot-rv',
    });
    expect(store.objects.size).toBe(0);
  });

  it.each(['uid', 'resourceVersion'] as const)(
    'does not delete a snapshot whose %s raced the inventory',
    async (field) => {
      const live = currentSecret();
      const snapshot = boundSnapshot(live, 2);
      const store = await setup(live, [snapshot]);
      const erase = store.core.deleteNamespacedSecret.getMockImplementation()!;
      const next = structuredClone(snapshot);
      next.metadata![field] = 'concurrent-snapshot';
      store.core.deleteNamespacedSecret.mockImplementationOnce(async (args) => {
        store.seed(next);
        return erase(args);
      });
      expect((await remove()).status).toBe(409);
      expect(store.get(namespace, snapshot.metadata!.name!)).toEqual(next);
      expect(store.get(namespace, name)).toEqual(live);
      expect(store.core.deleteNamespacedSecret).toHaveBeenCalledTimes(1);
    },
  );

  it.each(['data', 'ACL', 'UID'] as const)(
    'stops remaining cleanup if live %s changes after one snapshot was removed',
    async (change) => {
      const store = await setup();
      const erase = store.core.deleteNamespacedSecret.getMockImplementation()!;
      const next = changed(store.live, change);
      store.core.deleteNamespacedSecret.mockImplementationOnce(async (args) => {
        const result = await erase(args);
        store.seed(next);
        return result;
      });
      expect((await remove()).status).toBe(409);
      expect(store.core.deleteNamespacedSecret).toHaveBeenCalledTimes(1);
      expect(store.get(namespace, name)).toEqual(next);
      expect(store.get(namespace, historyName(uid, 1))).toBeDefined();
      expect(() => store.get(namespace, historyName(uid, 2))).toThrow();
    },
  );

  it('detects newly added history in the final inventory and leaves a retryable live object', async () => {
    const store = await setup();
    const late = boundSnapshot(store.live, 3);
    const erase = store.core.deleteNamespacedSecret.getMockImplementation()!;
    store.core.deleteNamespacedSecret.mockImplementationOnce(async (args) => {
      const result = await erase(args);
      store.seed(late);
      return result;
    });
    expect((await remove()).status).toBe(503);
    expect(store.get(namespace, name)).toEqual(store.live);
    expect(store.get(namespace, late.metadata!.name!)).toEqual(late);
    expect((await remove()).status).toBe(200);
    expect(store.objects.size).toBe(0);
  });

  it('does not delete a replacement snapshot observed by the absence check', async () => {
    const live = currentSecret();
    const snapshot = boundSnapshot(live, 2);
    const store = await setup(live, [snapshot]);
    const erase = store.core.deleteNamespacedSecret.getMockImplementation()!;
    const replacement = structuredClone(snapshot);
    replacement.metadata!.uid = 'replacement-snapshot-uid';
    replacement.metadata!.resourceVersion = 'replacement-snapshot-rv';
    store.core.deleteNamespacedSecret.mockImplementationOnce(async (args) => {
      const result = await erase(args);
      store.seed(replacement);
      return result;
    });
    expect((await remove()).status).toBe(503);
    expect(store.get(namespace, name)).toEqual(live);
    expect(store.get(namespace, snapshot.metadata!.name!)).toEqual(replacement);
    expect(store.core.deleteNamespacedSecret).toHaveBeenCalledTimes(1);
  });
});

describe('live delete races, retained lifetimes, and nontransactional results', () => {
  it('reports failed live deletion after cleanup and retries without claiming the earlier cleanup was rolled back', async () => {
    const store = await setup();
    const erase = store.core.deleteNamespacedSecret.getMockImplementation()!;
    store.core.deleteNamespacedSecret.mockImplementation(async (args) => {
      if (args.name === name) throw apiError(403);
      return erase(args);
    });
    const response = await remove();
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: expect.stringContaining('cleanup is not rolled back') });
    expect(store.get(namespace, name)).toEqual(store.live);
    expect(store.objects.size).toBe(1);
    store.core.deleteNamespacedSecret.mockImplementation(erase);
    expect((await remove()).status).toBe(200);
  });

  it.each(['data', 'ACL', 'UID', 'UID only'] as const)(
    'native DELETE CAS protects an in-flight live %s change after history cleanup',
    async (change) => {
      const store = await setup();
      const next = changed(store.live, change);
      const erase = store.core.deleteNamespacedSecret.getMockImplementation()!;
      store.core.deleteNamespacedSecret.mockImplementation(async (args) => {
        if (args.name === name) store.seed(next);
        return erase(args);
      });
      const response = await remove();
      expect(response.status).toBe(409);
      expect(store.get(namespace, name)).toEqual(next);
      expect(store.core.deleteNamespacedSecret.mock.calls.at(-1)![0].body?.preconditions).toEqual({
        uid,
        resourceVersion: revision,
      });
      expect(store.objects.size).toBe(1); // Earlier history cleanup is not rolled back.
    },
  );

  it.each([false, true])(
    'preserves a replacement created after the accepted live delete (keepHistory=%s)',
    async (keepHistory) => {
      const store = await setup();
      const next = changed(store.live, 'UID');
      const ownHistory = boundSnapshot(next, 2);
      const erase = store.core.deleteNamespacedSecret.getMockImplementation()!;
      store.core.deleteNamespacedSecret.mockImplementation(async (args) => {
        const result = await erase(args);
        if (args.name === name) {
          store.seed(next);
          store.seed(ownHistory);
        }
        return result;
      });
      expect((await remove(revision, keepHistory)).status).toBe(409);
      expect(store.get(namespace, name)).toEqual(next);
      expect(store.get(namespace, ownHistory.metadata!.name!)).toEqual(ownHistory);
      if (keepHistory) {
        expect(store.core.listNamespacedSecret).not.toHaveBeenCalled();
        expect(store.get(namespace, historyName(uid, 2))).toEqual(store.snapshots[0]);
      }
    },
  );

  it('keeps history intentionally, then isolates it from a later same-name live UID', async () => {
    const store = await setup();
    const response = await remove(revision, true);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: 'deleted', history: 'retained', uid });
    expect(store.core.listNamespacedSecret).not.toHaveBeenCalled();
    expect([...store.objects.values()]).toEqual(store.snapshots);
    const next = changed(store.live, 'UID');
    store.seed(next);
    const { GET } = await import('@/app/api/namespaces/[namespace]/secrets/[name]/versions/route');
    expect((await (await GET(new Request(`${url}/versions`), context())).json()).versions).toEqual([]);
    expect((await restore(next.metadata!.resourceVersion)).status).toBe(404);
    expect((await remove(next.metadata!.resourceVersion)).status).toBe(200);
    expect([...store.objects.values()]).toEqual(store.snapshots);
  });

  it.each(['Status', 'Secret'] as const)(
    'returns 202 for finalizer-blocked live deletion even if DELETE returns %s',
    async (responseShape) => {
      const live = currentSecret();
      live.metadata!.finalizers = ['example.test/hold'];
      const store = await setup(live);
      const erase = store.core.deleteNamespacedSecret.getMockImplementation()!;
      if (responseShape === 'Secret')
        store.core.deleteNamespacedSecret.mockImplementation(async (args) => {
          const result = await erase(args);
          return args.name === name ? store.get(namespace, name) : result;
        });
      const response = await remove();
      expect(response.status).toBe(202);
      const body = await response.json();
      expect(body).toEqual({
        status: 'pending',
        name,
        uid,
        history: 'cleaned',
        resourceVersion: expect.any(String),
        deletionTimestamp: '2026-01-02T00:00:00.000Z',
      });
      expect(body).not.toHaveProperty('deleted');
      expect(body.resourceVersion).not.toBe(revision);
      const { GET } = await import('@/app/api/namespaces/[namespace]/secrets/[name]/route');
      expect((await (await GET(new Request(url), context())).json()).secret.deletionTimestamp).toBe(
        body.deletionTimestamp,
      );
      const writes = store.core.deleteNamespacedSecret.mock.calls.length;
      expect((await remove()).status).toBe(409); // Termination itself changed RV.
      expect(store.core.deleteNamespacedSecret).toHaveBeenCalledTimes(writes);
      expect((await remove(body.resourceVersion)).status).toBe(202);
      const audits = vi.mocked(console.log).mock.calls.map(([event]) => JSON.parse(event));
      expect(
        audits
          .filter((event) => event.action === 'secret.delete')
          .every((event) => event.detail.startsWith('pending;')),
      ).toBe(true);
    },
  );

  it('keeps history while pending and uses the latest live revision on a later confirmed deletion', async () => {
    const live = currentSecret();
    live.metadata!.finalizers = ['example.test/hold'];
    const store = await setup(live);
    const pending = await remove(revision, true);
    expect(pending.status).toBe(202);
    expect((await pending.json()).history).toBe('retained');
    const repaired = store.get(namespace, name);
    repaired.metadata!.finalizers = [];
    repaired.metadata!.resourceVersion = 'finalizer-repaired-rv';
    store.seed(repaired);
    expect((await remove('finalizer-repaired-rv', true)).status).toBe(200);
    expect(store.core.deleteNamespacedSecret.mock.calls.at(-1)![0].body?.preconditions).toEqual({
      uid,
      resourceVersion: 'finalizer-repaired-rv',
    });
    expect([...store.objects.values()]).toEqual(store.snapshots);
  });

  it.each([403, 500])('does not claim deletion when the live absence confirmation returns %i', async (status) => {
    const store = await setup();
    const read = store.core.readNamespacedSecret.getMockImplementation()!;
    store.core.readNamespacedSecret.mockImplementation(async (args) => {
      if (args.name === name && !store.objects.has(`${namespace}/${name}`)) throw apiError(status);
      return read(args);
    });
    const response = await remove();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: expect.stringContaining('absence could not be confirmed') });
    expect(vi.mocked(console.log).mock.calls).toEqual([]);
    expect(store.objects.size).toBe(0); // The API error must not imply rollback.
  });

  it('makes no atomic-erasure assumption about a concurrent writer saving history after the last inventory', async () => {
    const store = await setup();
    const erase = store.core.deleteNamespacedSecret.getMockImplementation()!;
    const { createSnapshot } = await import('@/lib/snapshot-store');
    store.core.deleteNamespacedSecret.mockImplementation(async (args) => {
      const result = await erase(args);
      // An already-authorized concurrent writer still holds the original live
      // object; saving its source is separate from its later (failing) live CAS.
      if (args.name === name) await createSnapshot(namespace, store.live, user);
      return result;
    });
    const response = await remove();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: 'deleted', history: 'cleaned' });
    expect(() => store.get(namespace, name)).toThrow();
    expect(store.get(namespace, historyName(uid, 3)).data).toEqual(store.live.data);
  });
});
