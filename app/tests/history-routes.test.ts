import type { CoreV1Api, V1Secret } from '@kubernetes/client-node';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TEST_APP_URL } from './helpers/environment';
import { apiError, boundSnapshot, historyHash, historyName, mockHistoryStore } from './helpers/history';
import { mockKubernetes } from './helpers/kubernetes';
import { dataUser, nativeSecret, rawData, textData } from './helpers/secret-data';

const namespace = 'unit-test';
const name = 'credentials';
const uid = 'synthetic-live-uid';
const encoded = (value: string) => ({ value: Buffer.from(value).toString('base64') });
function liveSecret(version = 2): V1Secret {
  const live = nativeSecret({ data: encoded('current') });
  live.metadata!.annotations!['k8ston.io/version'] = String(version);
  live.metadata!.finalizers = [];
  return live;
}
function context(secretName = name) {
  return { params: Promise.resolve({ namespace, name: secretName }) };
}
function request(method: string, body?: unknown, suffix = '', secretName = name) {
  return new Request(`${TEST_APP_URL}/api/namespaces/${namespace}/secrets/${secretName}${suffix}`, {
    method,
    ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });
}
async function signIn(user = dataUser) {
  const auth = await import('@/lib/auth');
  await auth.setSessionCookie(await auth.createSessionToken(user));
}
async function put(resourceVersion: string, data: Record<string, string>, secretName = name) {
  const { PUT } = await import('@/app/api/namespaces/[namespace]/secrets/[name]/route');
  return PUT(request('PUT', { resourceVersion, data }, '', secretName), context(secretName));
}
async function restore(version: number, secretName = name, resourceVersion = '17') {
  const { POST } = await import('@/app/api/namespaces/[namespace]/secrets/[name]/restore/route');
  return POST(request('POST', { version, resourceVersion }, '/restore', secretName), context(secretName));
}
async function versions(secretName = name) {
  const { GET } = await import('@/app/api/namespaces/[namespace]/secrets/[name]/versions/route');
  return GET(request('GET', undefined, '/versions', secretName), context(secretName));
}

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('history identity across the real route boundaries', () => {
  it.each([true, false])('retains and isolates predecessor/legacy history with managedOnly=%s', async (managedOnly) => {
    process.env.K8STON_MANAGED_ONLY = String(managedOnly);
    process.env.K8STON_HISTORY_LIMIT = '1';
    const previous = liveSecret();
    const oldUser = { sub: 'old-id', email: 'old@example.test', name: 'Old owner', groups: ['old-team'] };
    const newUser = { sub: 'new-id', email: 'new@example.test', name: 'New owner', groups: ['new-team'] };
    previous.metadata!.annotations!['k8ston.io/allowed-users'] = oldUser.email;
    const oldHistory = boundSnapshot(previous, 1, encoded('predecessor-value'));
    const legacy: V1Secret = {
      metadata: {
        namespace,
        name: 'credentials-v1',
        uid: 'legacy-uid',
        resourceVersion: 'legacy-rv',
        labels: { 'k8ston.io/kind': 'history', 'k8ston.io/history-of': name },
        annotations: { 'k8ston.io/version': '1', 'k8ston.io/allowed-users': newUser.email },
      },
      data: encoded('unbound-legacy-value'),
    };
    const store = await mockHistoryStore([previous, oldHistory, legacy]);
    await signIn(oldUser);
    const { DELETE } = await import('@/app/api/namespaces/[namespace]/secrets/[name]/route');
    expect((await DELETE(request('DELETE', undefined, '?keepHistory=true&resourceVersion=17'), context())).status).toBe(
      200,
    );
    expect(store.get(namespace, oldHistory.metadata!.name!)).toEqual(oldHistory);
    expect(store.core.listNamespacedSecret).not.toHaveBeenCalled();

    const recreated = liveSecret(1);
    recreated.metadata!.uid = 'new-lifetime-uid';
    recreated.metadata!.resourceVersion = 'new-lifetime-rv';
    recreated.metadata!.annotations!['k8ston.io/allowed-users'] = newUser.email;
    recreated.data = encoded('new-lifetime-value');
    store.seed(recreated);
    await signIn(newUser);
    expect((await (await versions()).json()).versions).toEqual([]);
    const missing = await restore(1, name, recreated.metadata!.resourceVersion!);
    expect(missing.status).toBe(404);
    expect(await missing.text()).not.toContain('predecessor-value');
    expect(store.core.createNamespacedSecret).not.toHaveBeenCalled();
    expect(store.core.replaceNamespacedSecret).not.toHaveBeenCalled();

    const updated = await put(recreated.metadata!.resourceVersion!, { value: 'new-lifetime-updated' });
    expect(updated.status).toBe(200);
    const restored = await restore(1, name, (await updated.json()).secret.resourceVersion);
    expect(restored.status).toBe(200);
    expect((await restored.json()).secret.data).toEqual({ value: 'new-lifetime-value' });
    const response = await (await versions()).json();
    expect(response.versions).toMatchObject([{ version: 2, data: { value: 'new-lifetime-updated' } }]);
    expect(JSON.stringify(response)).not.toContain('predecessor-value');
    expect(JSON.stringify(response)).not.toContain('unbound-legacy-value');
    for (const [args] of store.core.listNamespacedSecret.mock.calls) {
      expect(args.labelSelector).toBe(
        `k8ston.io/source-uid=${historyHash(recreated.metadata!.uid!)},k8ston.io/kind=history`,
      );
    }
    expect(
      (
        await DELETE(
          request('DELETE', undefined, `?resourceVersion=${store.get(namespace, name).metadata!.resourceVersion}`),
          context(),
        )
      ).status,
    ).toBe(200);
    expect([...store.objects.values()]).toEqual([oldHistory, legacy]);
    expect(
      store.core.deleteNamespacedSecret.mock.calls.every(
        ([args]) => args.name !== oldHistory.metadata!.name && args.name !== legacy.metadata!.name,
      ),
    ).toBe(true);
  });

  it.each([true, false])(
    'authorizes current ACLs and hides bound snapshots on every named path with managedOnly=%s',
    async (managedOnly) => {
      process.env.K8STON_MANAGED_ONLY = String(managedOnly);
      process.env.K8STON_RESTART_ENABLED = 'true';
      const live = liveSecret();
      live.metadata!.annotations!['k8ston.io/allowed-users'] = 'current-owner@example.test';
      const snapshot = boundSnapshot(live, 1);
      snapshot.metadata!.annotations!['k8ston.io/allowed-users'] = 'revoked@example.test';
      const store = await mockHistoryStore([live, snapshot]);
      await signIn({ ...dataUser, email: 'revoked@example.test', groups: ['revoked-team'] });
      expect((await versions()).status).toBe(403);
      expect((await restore(1)).status).toBe(403);
      await signIn();
      const direct = snapshot.metadata!.name!;
      const { GET, DELETE } = await import('@/app/api/namespaces/[namespace]/secrets/[name]/route');
      const { POST: restart } = await import('@/app/api/namespaces/[namespace]/secrets/[name]/restart-consumers/route');
      for (const response of [
        await GET(request('GET', undefined, '', direct), context(direct)),
        await put(snapshot.metadata!.resourceVersion!, { value: 'forbidden' }, direct),
        await DELETE(request('DELETE', undefined, '?resourceVersion=17', direct), context(direct)),
        await versions(direct),
        await restore(1, direct),
        await restart(request('POST', undefined, '/restart-consumers', direct), context(direct)),
      ])
        expect(response.status).toBe(404);
      expect(store.core.listNamespacedSecret).not.toHaveBeenCalled();
      expect(store.core.createNamespacedSecret).not.toHaveBeenCalled();
      expect(store.core.replaceNamespacedSecret).not.toHaveBeenCalled();
      expect(store.core.deleteNamespacedSecret).not.toHaveBeenCalled();
      expect(store.getAppsApi).not.toHaveBeenCalled();
    },
  );

  it.each([64, 253])('updates a %i-character live name through valid snapshot metadata', async (length) => {
    const live = liveSecret();
    live.metadata!.name = 'a'.repeat(length);
    const store = await mockHistoryStore([live]);
    await signIn();
    const response = await put(live.metadata!.resourceVersion!, { value: 'updated' }, live.metadata!.name);
    expect(response.status).toBe(200);
    expect((await response.json()).secret.name).toBe(live.metadata!.name);
    expect(store.get(namespace, historyName(uid, 2)).metadata!.annotations!['k8ston.io/history-of']).toBe(
      live.metadata!.name,
    );
    expect(store.core.replaceNamespacedSecret).toHaveBeenCalledTimes(1);
  });

  it('keeps adoption rollback states distinct and consecutively numbered across edits and restore', async () => {
    process.env.K8STON_MANAGED_ONLY = 'false';
    const live = liveSecret();
    delete live.metadata!.annotations!['k8ston.io/version'];
    delete live.metadata!.annotations!['k8ston.io/managed-by'];
    const store = await mockHistoryStore([live]);
    await signIn();
    const { GET } = await import('@/app/api/namespaces/[namespace]/secrets/[name]/route');
    expect((await (await GET(request('GET'), context())).json()).secret.version).toBe(1);
    const first = await put(live.metadata!.resourceVersion!, { value: 'first edit' });
    expect(first.status).toBe(200);
    const firstDetail = (await first.json()).secret;
    expect(firstDetail.version).toBe(2);
    const second = await put(firstDetail.resourceVersion, { value: 'second edit' });
    expect(second.status).toBe(200);
    expect((await second.json()).secret.version).toBe(3);
    expect((await (await versions()).json()).versions).toMatchObject([
      { version: 2, data: { value: 'first edit' } },
      { version: 1, data: { value: 'current' } },
    ]);
    const restored = await restore(1, name, store.get(namespace, name).metadata!.resourceVersion!);
    expect(restored.status).toBe(200);
    expect((await restored.json()).secret).toMatchObject({ version: 4, data: { value: 'current' } });
    expect((await (await versions()).json()).versions).toMatchObject([
      { version: 3, data: { value: 'second edit' } },
      { version: 2, data: { value: 'first edit' } },
      { version: 1, data: { value: 'current' } },
    ]);
    expect(new Set(store.core.createNamespacedSecret.mock.calls.map(([args]) => args.body.metadata!.name)).size).toBe(
      3,
    );
    expect(store.get(namespace, name).metadata!.uid).toBe(uid);
  });

  it('restores raw bytes while keeping current lifecycle/ACL metadata and separating internal records from DTOs', async () => {
    const live = liveSecret();
    live.type = 'example.test/native-type';
    live.metadata!.finalizers = ['example.test/native-finalizer'];
    live.metadata!.annotations!['k8ston.io/allowed-users'] = dataUser.email;
    const old = structuredClone(live);
    old.metadata!.resourceVersion = 'old-source-rv';
    old.metadata!.annotations!['k8ston.io/description'] = 'old description';
    old.metadata!.annotations!['k8ston.io/allowed-users'] = 'former@example.test';
    const target = boundSnapshot(old, 1, rawData);
    const store = await mockHistoryStore([live, target]);
    await signIn();
    const listed = (await (await versions()).json()).versions[0];
    expect(Object.keys(listed).sort()).toEqual([
      'binaryData',
      'binaryKeys',
      'data',
      'keys',
      'snapshotAt',
      'snapshotBy',
      'snapshotName',
      'version',
    ]);
    expect(listed.data).toEqual(textData);
    expect(listed.binaryKeys).toEqual(['archive.bin', 'control']);
    const response = await restore(1);
    expect(response.status).toBe(200);
    const next = store.core.replaceNamespacedSecret.mock.calls[0][0].body;
    expect(next.data).toEqual(rawData);
    expect(next.metadata).toMatchObject({
      uid,
      resourceVersion: live.metadata!.resourceVersion,
      ownerReferences: live.metadata!.ownerReferences,
      finalizers: live.metadata!.finalizers,
      annotations: {
        'k8ston.io/allowed-users': dataUser.email,
        'k8ston.io/description': 'live description',
        'k8ston.io/version': '3',
      },
    });
    expect(next.type).toBe(live.type);
    expect(next.immutable).toBe(live.immutable);
    const body = await response.json();
    expect(body.secret.binaryData['archive.bin']).toBe(rawData['archive.bin']);
    const audits = JSON.stringify(vi.mocked(console.log).mock.calls);
    for (const value of Object.values(rawData).filter(Boolean)) expect(audits).not.toContain(value);
  });
});

describe('write gating, native changes, and replica CAS', () => {
  it.each(['other source revision', 'wrong immutable bytes', 'unbound legacy', 'unrelated object'])(
    'blocks a PUT collision with %s without overwriting live data',
    async (kind) => {
      const live = liveSecret();
      const occupied = boundSnapshot(live, 2);
      if (kind === 'other source revision') {
        occupied.metadata!.annotations!['k8ston.io/source-resource-version'] = 'older-native-rv';
        occupied.metadata!.labels!['k8ston.io/source-resource-version'] = historyHash('older-native-rv');
      }
      if (kind === 'wrong immutable bytes') occupied.data = encoded('forged-history');
      if (kind === 'unbound legacy') delete occupied.metadata!.annotations!['k8ston.io/history-format'];
      if (kind === 'unrelated object') {
        occupied.metadata!.labels = {};
        occupied.metadata!.annotations = {};
        occupied.immutable = false;
      }
      const store = await mockHistoryStore([live, occupied]);
      await signIn();
      const response = await put(live.metadata!.resourceVersion!, { value: 'intended write' });
      expect(response.status).toBe(409);
      expect(await response.text()).not.toContain('forged-history');
      expect(store.get(namespace, name)).toEqual(live);
      expect(store.get(namespace, occupied.metadata!.name!)).toEqual(occupied);
      expect(store.core.replaceNamespacedSecret).not.toHaveBeenCalled();
      expect(store.core.deleteNamespacedSecret).not.toHaveBeenCalled();
    },
  );

  it('also blocks restore on an unverifiable current-state snapshot collision', async () => {
    const live = liveSecret();
    const occupied = boundSnapshot(live, 2, encoded('not the current bytes'));
    const target = boundSnapshot(live, 1, encoded('restore target'));
    const store = await mockHistoryStore([live, occupied, target]);
    await signIn();
    expect((await restore(1)).status).toBe(409);
    expect(store.core.replaceNamespacedSecret).not.toHaveBeenCalled();
    expect(store.get(namespace, name)).toEqual(live);
  });

  it.each(['save', 'list', 'prune', 'config'])(
    'blocks live replacement on a history %s failure and reports it',
    async (failure) => {
      process.env.K8STON_HISTORY_LIMIT = failure === 'config' ? '0' : '1';
      const live = liveSecret();
      const store = await mockHistoryStore([live, boundSnapshot(live, 1)]);
      if (failure === 'save') store.core.createNamespacedSecret.mockRejectedValueOnce(apiError(403));
      if (failure === 'list') store.core.listNamespacedSecret.mockRejectedValueOnce(apiError(403));
      if (failure === 'prune') store.core.deleteNamespacedSecret.mockRejectedValueOnce(apiError(403));
      await signIn();
      const response = await put(live.metadata!.resourceVersion!, { value: 'intended write' });
      expect(response.status).toBe(503);
      expect(await response.text()).not.toContain('synthetic-private');
      expect(store.core.replaceNamespacedSecret).not.toHaveBeenCalled();
      expect(store.get(namespace, name)).toEqual(live);
      if (failure === 'list' || failure === 'prune')
        expect(store.get(namespace, historyName(uid, 2)).immutable).toBe(true);
    },
  );

  it('protects an in-flight native change, then requires reviewed counter recovery instead of overwriting a different source', async () => {
    const live = liveSecret();
    const store = await mockHistoryStore([live]);
    const replace = store.core.replaceNamespacedSecret.getMockImplementation()!;
    store.core.replaceNamespacedSecret.mockImplementationOnce(async (args) => {
      const native = store.get(namespace, name);
      native.data = encoded('external controller update');
      native.metadata!.resourceVersion = 'external-controller-rv';
      native.metadata!.annotations!['example.test/controller-revision'] = 'native';
      store.seed(native);
      return replace(args);
    });
    await signIn();
    expect((await put(live.metadata!.resourceVersion!, { value: 'stale browser update' })).status).toBe(409);
    expect(store.get(namespace, name).data).toEqual(encoded('external controller update'));
    expect(store.get(namespace, historyName(uid, 2)).data).toEqual(live.data);
    const retry = await put('external-controller-rv', { value: 'fresh browser intent' });
    expect(retry.status).toBe(409);
    expect(store.core.replaceNamespacedSecret).toHaveBeenCalledTimes(1);

    // Explicit operator review/repair is outside K8ston; no automatic adoption
    // or retagging by name. The fixture models a CAS metadata repair on this UID.
    const repaired = store.get(namespace, name);
    repaired.metadata!.annotations!['k8ston.io/version'] = '3';
    repaired.metadata!.resourceVersion = 'operator-reviewed-rv';
    store.seed(repaired);
    const recovered = await put('operator-reviewed-rv', { value: 'fresh browser intent' });
    expect(recovered.status).toBe(200);
    expect((await recovered.json()).secret.version).toBe(4);
    expect(store.get(namespace, historyName(uid, 2)).data).toEqual(live.data);
    expect(store.get(namespace, historyName(uid, 3)).data).toEqual(encoded('external controller update'));
    expect(store.get(namespace, name).metadata!.annotations!['example.test/controller-revision']).toBe('native');
  });

  it('captures ordinary external changes after a successful write at their exact native revision', async () => {
    const live = liveSecret();
    const store = await mockHistoryStore([live]);
    await signIn();
    expect((await put(live.metadata!.resourceVersion!, { value: 'first app update' })).status).toBe(200);
    const native = store.get(namespace, name);
    native.data = encoded('external value');
    native.metadata!.resourceVersion = 'external/opaque:rv';
    store.seed(native);
    expect((await put(native.metadata!.resourceVersion, { value: 'second app update' })).status).toBe(200);
    const snapshot = store.get(namespace, historyName(uid, 3));
    expect(snapshot.data).toEqual(encoded('external value'));
    expect(snapshot.metadata!.annotations!['k8ston.io/source-resource-version']).toBe('external/opaque:rv');
  });

  it('lets two isolated replicas verify one source snapshot while Kubernetes CAS admits only one replacement', async () => {
    const live = liveSecret();
    const store = await mockHistoryStore([live]);
    await signIn();
    const replicaA = await import('@/app/api/namespaces/[namespace]/secrets/[name]/route');
    vi.resetModules();
    const replicaClients = await mockKubernetes();
    replicaClients.getCoreApi.mockReturnValue(store.core as unknown as CoreV1Api);
    const replicaB = await import('@/app/api/namespaces/[namespace]/secrets/[name]/route');
    const replace = store.core.replaceNamespacedSecret.getMockImplementation()!;
    let arrivals = 0;
    let release!: () => void;
    const bothReady = new Promise<void>((resolve) => {
      release = resolve;
    });
    store.core.replaceNamespacedSecret.mockImplementation(async (args) => {
      if (++arrivals === 2) release();
      await bothReady;
      return replace(args);
    });
    const responses = await Promise.all([
      replicaA.PUT(
        request('PUT', { resourceVersion: live.metadata!.resourceVersion, data: { value: 'replica A' } }),
        context(),
      ),
      replicaB.PUT(
        request('PUT', { resourceVersion: live.metadata!.resourceVersion, data: { value: 'replica B' } }),
        context(),
      ),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
    expect(store.core.createNamespacedSecret).toHaveBeenCalledTimes(2);
    expect(
      store.core.readNamespacedSecret.mock.calls.filter(([args]) => args.name === historyName(uid, 2)),
    ).toHaveLength(1);
    expect(store.get(namespace, historyName(uid, 2)).data).toEqual(live.data);
    const winner = store.get(namespace, name);
    expect([encoded('replica A'), encoded('replica B')]).toContainEqual(winner.data);
    expect(winner.metadata!.annotations!['k8ston.io/version']).toBe('3');
    expect(store.objects.size).toBe(2);
    for (const [args] of store.core.replaceNamespacedSecret.mock.calls)
      expect(args.body.metadata).toMatchObject({ uid, resourceVersion: live.metadata!.resourceVersion });
  });
});

describe('DELETE cleanup reporting and preserved live authorization', () => {
  it.each(['list', 'delete', 'pending'])(
    'never reports complete bound-history cleanup when %s fails',
    async (failure) => {
      const live = liveSecret();
      const snapshot = boundSnapshot(live, 1);
      if (failure === 'pending') snapshot.metadata!.finalizers = ['example.test/hold'];
      const store = await mockHistoryStore([live, snapshot]);
      const remove = store.core.deleteNamespacedSecret.getMockImplementation()!;
      if (failure === 'list') store.core.listNamespacedSecret.mockRejectedValueOnce(apiError(403));
      if (failure === 'delete') {
        store.core.deleteNamespacedSecret.mockImplementation(async (args) => {
          if (args.name === snapshot.metadata!.name) throw apiError(403);
          return remove(args);
        });
      }
      await signIn();
      const { DELETE } = await import('@/app/api/namespaces/[namespace]/secrets/[name]/route');
      const response = await DELETE(request('DELETE', undefined, '?resourceVersion=17'), context());
      expect(response.status).toBe(503);
      expect(await response.text()).toContain('History cleanup');
      expect(store.get(namespace, name)).toEqual(live);
      expect(store.get(namespace, snapshot.metadata!.name!)).toBeDefined();
      expect(vi.mocked(console.log).mock.calls.map(([event]) => JSON.parse(event))).not.toContainEqual(
        expect.objectContaining({ action: 'secret.delete', result: 'allow' }),
      );
      // Cleanup failures leave the live object available to authorize a retry.
      store.core.deleteNamespacedSecret.mockImplementation(remove);
      const repaired = store.get(namespace, snapshot.metadata!.name!);
      repaired.metadata!.finalizers = [];
      repaired.metadata!.resourceVersion = 'repaired-snapshot-rv';
      store.seed(repaired);
      expect((await DELETE(request('DELETE', undefined, '?resourceVersion=17'), context())).status).toBe(200);
      expect(store.objects.size).toBe(0);
    },
  );
});
