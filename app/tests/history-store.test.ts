import type { V1Secret } from '@kubernetes/client-node';
import { describe, expect, it, vi } from 'vitest';
import { apiError, boundSnapshot, historyHash, historyName, mockHistoryStore } from './helpers/history';
import { dataUser, nativeSecret, rawData } from './helpers/secret-data';

const namespace = 'unit-test';
const uid = 'synthetic-live-uid';
function liveAt(version: number): V1Secret {
  const live = nativeSecret();
  live.metadata!.resourceVersion = `opaque/revision:${version}`;
  live.metadata!.annotations!['k8ston.io/version'] = String(version);
  return live;
}

describe('source identity, raw storage, and legacy quarantine', () => {
  it.each([64, 253])(
    'archives a %i-character live name with bounded native metadata and raw own-key data',
    async (length) => {
      const live = liveAt(2);
      live.metadata!.name = 'a'.repeat(length);
      live.type = `example.test/${'custom-type-'.repeat(12)}`;
      live.metadata!.managedFields = [{ manager: 'synthetic-controller', operation: 'Update', apiVersion: 'v1' }];
      live.metadata!.annotations!['kubernetes.io/service-account.name'] = 'synthetic-service-account';
      live.metadata!.annotations!['kubectl.kubernetes.io/last-applied-configuration'] = 'synthetic-native-metadata';
      const before = structuredClone(live);
      const store = await mockHistoryStore([live]);
      const { createSnapshot, listSnapshots } = await import('@/lib/snapshot-store');
      await createSnapshot(namespace, live, dataUser);
      const snapshot = store.get(namespace, historyName(uid, 2));
      expect(snapshot.metadata!.name!.length).toBeLessThanOrEqual(63);
      expect(snapshot.metadata!.name).toMatch(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/);
      for (const value of Object.values(snapshot.metadata!.labels!)) {
        expect(value.length).toBeLessThanOrEqual(63);
        expect(value).toMatch(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/);
      }
      expect(snapshot.metadata!.annotations).toMatchObject({
        'k8ston.io/history-of': live.metadata!.name,
        'k8ston.io/source-uid': uid,
        'k8ston.io/source-resource-version': live.metadata!.resourceVersion,
        'k8ston.io/source-type': live.type,
        'k8ston.io/history-format': 'uid-rv-v1',
      });
      expect(snapshot).toMatchObject({ immutable: true, type: 'Opaque', data: rawData });
      expect(Object.hasOwn(snapshot.data!, '__proto__')).toBe(true);
      expect(snapshot.metadata).not.toHaveProperty('ownerReferences');
      expect(snapshot.metadata).not.toHaveProperty('finalizers');
      expect(snapshot.metadata).not.toHaveProperty('managedFields');
      expect(snapshot.metadata!.annotations).not.toHaveProperty('kubernetes.io/service-account.name');
      expect(snapshot.metadata!.annotations).not.toHaveProperty('kubectl.kubernetes.io/last-applied-configuration');
      const [record] = await listSnapshots(namespace, live, dataUser);
      expect(record.secret.data).toEqual(rawData);
      expect(record.metadata).not.toHaveProperty('data');
      expect(record).not.toHaveProperty('binaryData');
      expect(live).toEqual(before);
      expect(store.core.listNamespacedSecret.mock.calls[0][0].labelSelector).toBe(
        `k8ston.io/source-uid=${historyHash(uid)},k8ston.io/kind=history`,
      );
    },
  );

  it('uses Opaque for a native controller type without inheriting its active controller metadata', async () => {
    const live = liveAt(1);
    live.type = 'kubernetes.io/service-account-token';
    live.metadata!.annotations!['kubernetes.io/service-account.name'] = 'synthetic-controller-account';
    const store = await mockHistoryStore();
    const { createSnapshot } = await import('@/lib/snapshot-store');
    await createSnapshot(namespace, live, dataUser);
    const snapshot = store.get(namespace, historyName(uid, 1));
    expect(snapshot.type).toBe('Opaque');
    expect(snapshot.metadata!.annotations!['k8ston.io/source-type']).toBe(live.type);
    expect(snapshot.metadata!.annotations).not.toHaveProperty('kubernetes.io/service-account.name');
  });

  it.each(['uid', 'resourceVersion', 'namespace', 'name'] as const)(
    'requires live %s before any history access or mutation',
    async (field) => {
      const live = liveAt(2);
      delete live.metadata![field];
      const store = await mockHistoryStore();
      const history = await import('@/lib/snapshot-store');
      for (const operation of [
        () => history.listSnapshots(namespace, live, dataUser),
        () => history.readSnapshotVersion(namespace, live, 1, dataUser),
        () => history.createSnapshot(namespace, live, dataUser),
        () => history.deleteSnapshots(namespace, live, dataUser),
      ])
        await expect(operation()).rejects.toMatchObject({ status: 409 });
      expect(store.getCoreApi).not.toHaveBeenCalled();
    },
  );

  it('requires a live object even inside the store and refuses a namespace mismatch', async () => {
    const live = liveAt(2);
    const store = await mockHistoryStore();
    const { listSnapshots } = await import('@/lib/snapshot-store');
    await expect(listSnapshots('another-namespace', live, dataUser)).rejects.toMatchObject({ status: 409 });
    await expect(listSnapshots(namespace, boundSnapshot(live, 1), dataUser)).rejects.toMatchObject({ status: 409 });
    expect(store.getCoreApi).not.toHaveBeenCalled();
  });

  const quarantined: Array<[string, (secret: V1Secret) => void]> = [
    [
      'unbound legacy',
      (s) => {
        s.metadata!.annotations = { 'k8ston.io/version': '1', 'k8ston.io/history-of': 'credentials' };
      },
    ],
    [
      'missing format after partial migration',
      (s) => {
        delete s.metadata!.annotations!['k8ston.io/history-format'];
      },
    ],
    [
      'unsupported format',
      (s) => {
        s.metadata!.annotations!['k8ston.io/history-format'] = 'unknown';
      },
    ],
    [
      'missing source UID',
      (s) => {
        delete s.metadata!.annotations!['k8ston.io/source-uid'];
      },
    ],
    [
      'predecessor UID with forged matching label',
      (s) => {
        s.metadata!.annotations!['k8ston.io/source-uid'] = 'predecessor-uid';
      },
    ],
    [
      'missing source revision',
      (s) => {
        delete s.metadata!.annotations!['k8ston.io/source-resource-version'];
      },
    ],
    [
      'mismatched source revision label',
      (s) => {
        s.metadata!.labels!['k8ston.io/source-resource-version'] = 'wrong';
      },
    ],
    [
      'missing original type',
      (s) => {
        delete s.metadata!.annotations!['k8ston.io/source-type'];
      },
    ],
    [
      'wrong original name',
      (s) => {
        s.metadata!.annotations!['k8ston.io/history-of'] = 'other-secret';
      },
    ],
    [
      'wrong namespace',
      (s) => {
        s.metadata!.namespace = 'other-namespace';
      },
    ],
    [
      'mutable data',
      (s) => {
        s.immutable = false;
      },
    ],
    [
      'active native type',
      (s) => {
        s.type = 'kubernetes.io/tls';
      },
    ],
    [
      'invalid version',
      (s) => {
        s.metadata!.annotations!['k8ston.io/version'] = '1extra';
      },
    ],
    [
      'unbound name',
      (s) => {
        s.metadata!.name = 'credentials-v1';
      },
    ],
  ];
  it.each(quarantined)(
    'quarantines %s from list, restore, and cleanup even if a selector returns it',
    async (_label, corrupt) => {
      const live = liveAt(3);
      const candidate = boundSnapshot(liveAt(1), 1);
      corrupt(candidate);
      const store = await mockHistoryStore();
      store.core.listNamespacedSecret.mockResolvedValue({ items: [candidate] });
      const { listSnapshots, readSnapshotVersion, deleteSnapshots } = await import('@/lib/snapshot-store');
      expect(await listSnapshots(namespace, live, dataUser)).toEqual([]);
      await expect(readSnapshotVersion(namespace, live, 1, dataUser)).rejects.toMatchObject({ status: 404 });
      await deleteSnapshots(namespace, live, dataUser);
      expect(store.core.deleteNamespacedSecret).not.toHaveBeenCalled();
      expect(store.core.readNamespacedSecret).not.toHaveBeenCalled();
    },
  );

  it('isolates retained history for two same-name lifetimes in both selectors and returned records', async () => {
    const old = liveAt(1);
    const live = liveAt(2);
    live.metadata!.uid = 'recreated-uid';
    const predecessor = boundSnapshot(old, 1);
    const current = boundSnapshot(live, 1);
    const store = await mockHistoryStore([predecessor, current]);
    const { listSnapshots, deleteSnapshots } = await import('@/lib/snapshot-store');
    expect((await listSnapshots(namespace, live, dataUser)).map((s) => s.metadata.name)).toEqual([
      current.metadata!.name,
    ]);
    await deleteSnapshots(namespace, live, dataUser);
    expect(store.get(namespace, predecessor.metadata!.name!)).toEqual(predecessor);
    expect(store.core.deleteNamespacedSecret).toHaveBeenCalledExactlyOnceWith(
      {
        namespace,
        name: current.metadata!.name,
        body: { preconditions: { uid: current.metadata!.uid, resourceVersion: current.metadata!.resourceVersion } },
      },
      undefined,
    );
  });
});

describe('verified idempotency and conflicting source revisions', () => {
  it('retries the same immutable bytes despite canonical base64 and a different retry actor/time', async () => {
    const live = liveAt(3);
    live.data = { ...rawData, canonical: 'dGV4dA==\n' };
    const store = await mockHistoryStore();
    const { createSnapshot } = await import('@/lib/snapshot-store');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    await createSnapshot(namespace, live, dataUser);
    const first = store.get(namespace, historyName(uid, 3));
    expect(first.data!.canonical).toBe('dGV4dA==');
    vi.setSystemTime(new Date('2026-02-01T00:00:00Z'));
    await createSnapshot(namespace, live, { ...dataUser, email: 'retry@example.test' });
    expect(store.get(namespace, historyName(uid, 3))).toEqual(first);
    expect(store.core.createNamespacedSecret).toHaveBeenCalledTimes(2);
    expect(store.core.readNamespacedSecret).toHaveBeenCalledExactlyOnceWith(
      { namespace, name: first.metadata!.name },
      undefined,
    );
    expect(store.core.listNamespacedSecret).toHaveBeenCalledTimes(2);
  });

  const impostors: Array<[string, (secret: V1Secret) => void]> = [
    [
      'different data with copied identity/fingerprint',
      (s) => {
        s.data!['archive.bin'] = 'd3Jvbmc=';
        s.metadata!.annotations!['k8ston.io/content-hash'] = 'copied-claim';
      },
    ],
    [
      'missing own special key',
      (s) => {
        delete s.data!.__proto__;
      },
    ],
    [
      'additional key',
      (s) => {
        s.data!.extra = 'eA==';
      },
    ],
    [
      'empty data',
      (s) => {
        s.data = {};
      },
    ],
    [
      'mutable data',
      (s) => {
        s.immutable = false;
      },
    ],
    [
      'different source type',
      (s) => {
        s.metadata!.annotations!['k8ston.io/source-type'] = 'example.test/different';
      },
    ],
    [
      'different source UID',
      (s) => {
        s.metadata!.annotations!['k8ston.io/source-uid'] = 'other-uid';
      },
    ],
    [
      'different source revision',
      (s) => {
        s.metadata!.annotations!['k8ston.io/source-resource-version'] = 'another-revision';
        s.metadata!.labels!['k8ston.io/source-resource-version'] = historyHash('another-revision');
      },
    ],
    [
      'different description',
      (s) => {
        s.metadata!.annotations!['k8ston.io/description'] = 'changed';
      },
    ],
    [
      'different source ACL',
      (s) => {
        s.metadata!.annotations!['k8ston.io/allowed-users'] = 'another@example.test';
      },
    ],
    [
      'missing binding',
      (s) => {
        delete s.metadata!.annotations!['k8ston.io/history-format'];
      },
    ],
    [
      'missing persisted identity',
      (s) => {
        delete s.metadata!.uid;
      },
    ],
    [
      'different slot',
      (s) => {
        s.metadata!.annotations!['k8ston.io/version'] = '2';
      },
    ],
    [
      'terminating object',
      (s) => {
        s.metadata!.deletionTimestamp = new Date();
      },
    ],
    [
      'controller ownership',
      (s) => {
        s.metadata!.ownerReferences = liveAt(3).metadata!.ownerReferences;
      },
    ],
    [
      'finalizers',
      (s) => {
        s.metadata!.finalizers = ['example.test/hold'];
      },
    ],
  ];
  it.each(impostors)('rejects an occupied slot with %s before pruning or allowing a write', async (_label, corrupt) => {
    const live = liveAt(3);
    const occupied = boundSnapshot(live, 3);
    corrupt(occupied);
    const store = await mockHistoryStore([occupied]);
    const { createSnapshot } = await import('@/lib/snapshot-store');
    await expect(createSnapshot(namespace, live, dataUser)).rejects.toMatchObject({
      status: 409,
      message: expect.stringContaining('identity/content conflict'),
    });
    expect(store.core.listNamespacedSecret).not.toHaveBeenCalled();
    expect(store.core.deleteNamespacedSecret).not.toHaveBeenCalled();
    expect(store.core.replaceNamespacedSecret).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    'blocks an external revision change with changedData=%s in an occupied version slot',
    async (changedData) => {
      const previous = liveAt(2);
      const occupied = boundSnapshot(previous, 2);
      const live = structuredClone(previous);
      live.metadata!.resourceVersion = 'native-metadata-or-data-change';
      if (changedData) live.data = { changed: 'eA==' };
      const store = await mockHistoryStore([occupied]);
      const { createSnapshot } = await import('@/lib/snapshot-store');
      await expect(createSnapshot(namespace, live, dataUser)).rejects.toMatchObject({ status: 409 });
      expect(store.get(namespace, occupied.metadata!.name!)).toEqual(occupied);
    },
  );

  it.each([403, 404, 500])('does not accept a create 409 when its verification read returns %i', async (status) => {
    const store = await mockHistoryStore();
    store.core.createNamespacedSecret.mockRejectedValue(apiError(409));
    store.core.readNamespacedSecret.mockRejectedValue(apiError(status));
    const { createSnapshot } = await import('@/lib/snapshot-store');
    await expect(createSnapshot(namespace, liveAt(2), dataUser)).rejects.toMatchObject({
      status: 409,
      message: expect.not.stringContaining('synthetic-private'),
    });
    expect(store.core.listNamespacedSecret).not.toHaveBeenCalled();
  });

  it('does not treat an unrelated Secret at the deterministic name as a retry', async () => {
    const occupied = nativeSecret();
    occupied.metadata!.name = historyName(uid, 2);
    const store = await mockHistoryStore([occupied]);
    const { createSnapshot } = await import('@/lib/snapshot-store');
    await expect(createSnapshot(namespace, liveAt(2), dataUser)).rejects.toMatchObject({ status: 409 });
    expect(store.get(namespace, occupied.metadata!.name)).toEqual(occupied);
  });

  it.each(['data', 'immutable', 'owner'] as const)(
    'checks admission-altered %s on successful creates too',
    async (change) => {
      const store = await mockHistoryStore();
      const create = store.core.createNamespacedSecret.getMockImplementation()!;
      store.core.createNamespacedSecret.mockImplementation(async ({ namespace, body }) => {
        const altered = structuredClone(body);
        if (change === 'data') altered.data = { wrong: 'eA==' };
        if (change === 'immutable') altered.immutable = false;
        if (change === 'owner') altered.metadata!.ownerReferences = liveAt(2).metadata!.ownerReferences;
        return create({ namespace, body: altered });
      });
      const { createSnapshot } = await import('@/lib/snapshot-store');
      await expect(createSnapshot(namespace, liveAt(2), dataUser)).rejects.toMatchObject({ status: 409 });
      expect(store.core.listNamespacedSecret).not.toHaveBeenCalled();
    },
  );
});

describe('bounded retention and truthful metadata-only cleanup', () => {
  it.each([
    [0, 3],
    [2, 3],
    [3, 3],
    [5, 3],
    [2, 1],
    [101, 100],
  ])('retains the newest states with %i existing and limit %i', async (count, limit) => {
    process.env.K8STON_HISTORY_LIMIT = String(limit);
    const live = liveAt(count + 1);
    const older = Array.from({ length: count }, (_, i) => boundSnapshot(liveAt(i + 1), i + 1));
    const store = await mockHistoryStore(older);
    const { createSnapshot, listSnapshots } = await import('@/lib/snapshot-store');
    await createSnapshot(namespace, live, dataUser);
    const kept = await listSnapshots(namespace, live, dataUser);
    expect(kept.map((s) => s.metadata.version)).toEqual(
      Array.from({ length: Math.min(count + 1, limit) }, (_, i) => count + 1 - i),
    );
    expect(store.core.deleteNamespacedSecret).toHaveBeenCalledTimes(Math.max(count + 1 - limit, 0));
    expect(store.core.readNamespacedSecret).toHaveBeenCalledTimes(Math.max(count + 1 - limit, 0));
    for (const [args] of store.core.deleteNamespacedSecret.mock.calls) {
      const original = older.find((s) => s.metadata!.name === args.name)!;
      expect(args.body).toEqual({
        preconditions: { uid: original.metadata!.uid, resourceVersion: original.metadata!.resourceVersion },
      });
    }
  });

  it('never reads snapshot values to prune or delete and bounds concurrent deletion work', async () => {
    process.env.K8STON_HISTORY_LIMIT = '1';
    const store = await mockHistoryStore([1, 2, 3].map((v) => boundSnapshot(liveAt(v), v)));
    const list = store.core.listNamespacedSecret.getMockImplementation()!;
    store.core.listNamespacedSecret.mockImplementation(async (args) => {
      const result = await list(args);
      for (const secret of result.items)
        Object.defineProperty(secret, 'data', {
          get() {
            throw new Error('Cleanup must not inspect or decode values');
          },
        });
      return result;
    });
    let active = 0;
    let maximum = 0;
    const remove = store.core.deleteNamespacedSecret.getMockImplementation()!;
    store.core.deleteNamespacedSecret.mockImplementation(async (args) => {
      active++;
      maximum = Math.max(maximum, active);
      await new Promise((resolve) => setTimeout(resolve, 1));
      try {
        return await remove(args);
      } finally {
        active--;
      }
    });
    const { createSnapshot, deleteSnapshots } = await import('@/lib/snapshot-store');
    await createSnapshot(namespace, liveAt(4), dataUser);
    await deleteSnapshots(namespace, liveAt(4), dataUser);
    expect(store.objects.size).toBe(0);
    expect(maximum).toBe(1);
    expect(store.core.deleteNamespacedSecret).toHaveBeenCalledTimes(4);
  });

  it('reports mixed failed/pending pruning, then retries cleanup on the verified source collision', async () => {
    process.env.K8STON_HISTORY_LIMIT = '1';
    const snapshots = [1, 2, 3].map((v) => boundSnapshot(liveAt(v), v));
    snapshots[1].metadata!.finalizers = ['example.test/hold'];
    const store = await mockHistoryStore(snapshots);
    const remove = store.core.deleteNamespacedSecret.getMockImplementation()!;
    store.core.deleteNamespacedSecret.mockImplementation(async (args) => {
      if (args.name === historyName(uid, 1)) throw apiError(403);
      return remove(args);
    });
    const { createSnapshot } = await import('@/lib/snapshot-store');
    await expect(createSnapshot(namespace, liveAt(4), dataUser)).rejects.toMatchObject({
      status: 503,
      message:
        'History pruning incomplete: 1/3 confirmed absent, 1 still present, 1 failed. Live write was not attempted; retry after resolving cleanup.',
    });
    expect(store.get(namespace, historyName(uid, 2)).metadata!.deletionTimestamp).toBeDefined();
    expect(store.get(namespace, historyName(uid, 4)).immutable).toBe(true);
    const repaired = store.get(namespace, historyName(uid, 2));
    repaired.metadata!.finalizers = [];
    repaired.metadata!.resourceVersion = 'operator-repaired';
    store.seed(repaired);
    store.core.deleteNamespacedSecret.mockImplementation(remove);
    await createSnapshot(namespace, liveAt(4), dataUser);
    expect([...store.objects.values()].map((s) => s.metadata!.name)).toEqual([historyName(uid, 4)]);
    expect(store.core.createNamespacedSecret).toHaveBeenCalledTimes(2);
    expect(store.core.readNamespacedSecret.mock.calls.some(([args]) => args.name === historyName(uid, 4))).toBe(true);
  });

  it('surfaces a post-snapshot list failure and retries it without rewriting the snapshot', async () => {
    const store = await mockHistoryStore();
    store.core.listNamespacedSecret.mockRejectedValueOnce(apiError(403));
    const { createSnapshot } = await import('@/lib/snapshot-store');
    await expect(createSnapshot(namespace, liveAt(2), dataUser)).rejects.toMatchObject({
      status: 503,
      message: expect.stringContaining('pruning could not list'),
    });
    const saved = store.get(namespace, historyName(uid, 2));
    await createSnapshot(namespace, liveAt(2), dataUser);
    expect(store.get(namespace, historyName(uid, 2))).toEqual(saved);
    expect(store.core.listNamespacedSecret).toHaveBeenCalledTimes(2);
  });

  it.each(['uid', 'resourceVersion'] as const)(
    'never deletes a snapshot whose %s changed after listing',
    async (field) => {
      process.env.K8STON_HISTORY_LIMIT = '1';
      const old = boundSnapshot(liveAt(1), 1);
      const store = await mockHistoryStore([old]);
      const remove = store.core.deleteNamespacedSecret.getMockImplementation()!;
      store.core.deleteNamespacedSecret.mockImplementationOnce(async (args) => {
        const changed = store.get(namespace, args.name);
        changed.metadata![field] = 'concurrent-replacement';
        store.seed(changed);
        return remove(args);
      });
      const { createSnapshot } = await import('@/lib/snapshot-store');
      await expect(createSnapshot(namespace, liveAt(2), dataUser)).rejects.toMatchObject({
        status: 503,
        message: expect.stringContaining('1 failed'),
      });
      expect(store.get(namespace, old.metadata!.name!).metadata![field]).toBe('concurrent-replacement');
      expect(store.core.deleteNamespacedSecret.mock.calls[0][0].body?.preconditions).toEqual({
        uid: old.metadata!.uid,
        resourceVersion: old.metadata!.resourceVersion,
      });
    },
  );

  it('accepts a concurrent cleanup 404 as confirmed absence', async () => {
    const old = boundSnapshot(liveAt(1), 1);
    const store = await mockHistoryStore([old]);
    store.core.deleteNamespacedSecret.mockImplementationOnce(async ({ namespace, name }) => {
      store.objects.delete(`${namespace}/${name}`);
      throw apiError(404);
    });
    const { deleteSnapshots } = await import('@/lib/snapshot-store');
    await deleteSnapshots(namespace, liveAt(2), dataUser);
    expect(store.objects.size).toBe(0);
    expect(store.core.readNamespacedSecret).not.toHaveBeenCalled();
  });

  it('does not call an unverified deletion complete when the confirmation read fails', async () => {
    const store = await mockHistoryStore([boundSnapshot(liveAt(1), 1)]);
    store.core.readNamespacedSecret.mockRejectedValueOnce(apiError(403));
    const { deleteSnapshots } = await import('@/lib/snapshot-store');
    await expect(deleteSnapshots(namespace, liveAt(2), dataUser)).rejects.toMatchObject({
      status: 503,
      message: expect.stringContaining('0/1 confirmed absent'),
    });
  });

  it('does not prune newer history after a native version-counter reset', async () => {
    process.env.K8STON_HISTORY_LIMIT = '1';
    const store = await mockHistoryStore([boundSnapshot(liveAt(5), 5)]);
    const { createSnapshot } = await import('@/lib/snapshot-store');
    await expect(createSnapshot(namespace, liveAt(1), dataUser)).rejects.toMatchObject({
      status: 409,
      message: expect.stringContaining('behind retained history'),
    });
    expect(store.core.deleteNamespacedSecret).not.toHaveBeenCalled();
    expect(store.objects.size).toBe(2);
  });

  it('requires the just-verified snapshot to remain in the pruning inventory', async () => {
    const store = await mockHistoryStore();
    store.core.listNamespacedSecret.mockResolvedValue({ items: [] });
    const { createSnapshot } = await import('@/lib/snapshot-store');
    await expect(createSnapshot(namespace, liveAt(1), dataUser)).rejects.toMatchObject({
      status: 409,
      message: expect.stringContaining('changed or disappeared'),
    });
    expect(store.core.deleteNamespacedSecret).not.toHaveBeenCalled();
  });
});

describe('positive bounded configuration and counters', () => {
  it.each([undefined, '1', '20', '100'])(
    'accepts retention %s and reports the effective public limit',
    async (value) => {
      if (value !== undefined) process.env.K8STON_HISTORY_LIMIT = value;
      const { config } = await import('@/lib/config');
      expect(config.historyLimit).toBe(value === undefined ? 20 : Number(value));
      const { GET } = await import('@/app/api/config/route');
      expect((await (await GET()).json()).historyLimit).toBe(config.historyLimit);
    },
  );

  it.each(['', '0', '-1', '101', '2junk', '1.5', 'NaN', 'Infinity', '1e2', ' 20', '020', '9007199254740992'])(
    'rejects retention %j before any snapshot side effect',
    async (value) => {
      process.env.K8STON_HISTORY_LIMIT = value;
      const store = await mockHistoryStore();
      const { createSnapshot } = await import('@/lib/snapshot-store');
      await expect(createSnapshot(namespace, liveAt(1), dataUser)).rejects.toMatchObject({
        status: 503,
        message: 'K8STON_HISTORY_LIMIT must be an integer from 1 to 100',
      });
      expect(store.getCoreApi).not.toHaveBeenCalled();
      const { GET } = await import('@/app/api/config/route');
      const response = await GET();
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ error: 'K8STON_HISTORY_LIMIT must be an integer from 1 to 100' });
    },
  );

  it.each([undefined, '0', '1', '2'])('uses a consistent positive adoption baseline for counter %s', async (value) => {
    const live = liveAt(1);
    if (value === undefined) delete live.metadata!.annotations!['k8ston.io/version'];
    else live.metadata!.annotations!['k8ston.io/version'] = value;
    const { currentSecretVersion, nextSecretVersion } = await import('@/lib/snapshot-store');
    const { toSummary } = await import('@/lib/secrets');
    const current = value === '2' ? 2 : 1;
    expect(currentSecretVersion(live)).toBe(current);
    expect(toSummary(namespace, live).version).toBe(current);
    expect(nextSecretVersion(live)).toBe(current + 1);
  });

  it.each(['', '-1', '1garbage', '2.5', '9007199254740992'])(
    'rejects malformed native counter %j instead of reusing a version',
    async (value) => {
      const live = liveAt(1);
      live.metadata!.annotations!['k8ston.io/version'] = value;
      const { nextSecretVersion } = await import('@/lib/snapshot-store');
      expect(() => nextSecretVersion(live)).toThrow('Invalid Secret version counter');
    },
  );

  it('keeps maximum-safe counter names valid and refuses an overflowing live version', async () => {
    const live = liveAt(Number.MAX_SAFE_INTEGER);
    const store = await mockHistoryStore();
    const { createSnapshot, nextSecretVersion } = await import('@/lib/snapshot-store');
    await createSnapshot(namespace, live, dataUser);
    expect(store.core.createNamespacedSecret.mock.calls[0][0].body.metadata!.name!.length).toBeLessThanOrEqual(63);
    expect(() => nextSecretVersion(live)).toThrow('exhausted');
  });
});
