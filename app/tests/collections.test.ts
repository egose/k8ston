import type { V1Secret } from '@kubernetes/client-node';
import { describe, expect, it, vi } from 'vitest';
import { mockKubernetes } from './helpers/kubernetes';
import { apiError, boundSnapshot, historyHash, mockHistoryStore } from './helpers/history';
import { dataUser, nativeSecret, rawData } from './helpers/secret-data';
import {
  consumerNamespace,
  consumerSecret,
  consumerUser,
  consumerWorkload,
  mockConsumers,
  statefulConsumer,
} from './helpers/consumers';

const item = (name: string) => ({ metadata: { name, namespace: 'unit-test' }, data: { value: 'synthetic' } });
const smallLimits = { pageSize: 2, maxPages: 4, maxItems: 8, maxBytes: 4096 };

describe('complete bounded Kubernetes collections', () => {
  it('returns all objects once, follows short/empty pages, and deduplicates identical entries', async () => {
    const { readK8sCollection } = await import('@/lib/k8s-list');
    const page = vi
      .fn()
      .mockResolvedValueOnce({
        items: [item('a'), item('b')],
        metadata: { _continue: 'opaque+/one=', resourceVersion: '17' },
      })
      .mockResolvedValueOnce({ items: [], metadata: { _continue: 'opaque-two', resourceVersion: '17' } })
      .mockResolvedValueOnce({
        items: [item('b'), item('c')],
        metadata: { _continue: 'opaque-three', resourceVersion: '17' },
      })
      .mockResolvedValueOnce({ items: [item('d')], metadata: { _continue: '', resourceVersion: '17' } });
    expect(await readK8sCollection(page, smallLimits, (value: ReturnType<typeof item>) => value.metadata.name)).toEqual(
      ['a', 'b', 'c', 'd'],
    );
    expect(page.mock.calls).toEqual([
      [{ limit: 2 }],
      [{ limit: 2, _continue: 'opaque+/one=' }],
      [{ limit: 2, _continue: 'opaque-two' }],
      [{ limit: 2, _continue: 'opaque-three' }],
    ]);
  });

  it.each([
    { label: 'number', token: 42 },
    { label: 'null', token: null },
    { label: 'object', token: {} },
    { label: 'whitespace', token: 'bad token' },
    { label: 'newline', token: 'bad\nvalue' },
    { label: 'Unicode', token: 'é' },
    { label: 'oversized', token: 'x'.repeat(8193) },
  ])('rejects a $label continuation without reflecting it or requesting another page', async ({ token }) => {
    const { readK8sCollection } = await import('@/lib/k8s-list');
    const page = vi.fn().mockResolvedValue({ items: [item('a')], metadata: { _continue: token } });
    await expect(
      readK8sCollection(page, { ...smallLimits, maxBytes: 16 * 1024 }, (value) => value),
    ).rejects.toMatchObject({ status: 503, reason: 'invalid_continue' });
    expect(page).toHaveBeenCalledOnce();
  });

  it.each(['immediate', 'cycle'])('rejects a %s repeated token without a misleading partial result', async (kind) => {
    const { readK8sCollection } = await import('@/lib/k8s-list');
    const page = vi
      .fn()
      .mockResolvedValueOnce({ items: [item('a')], metadata: { _continue: 'first' } })
      .mockResolvedValueOnce({ items: [item('b')], metadata: { _continue: kind === 'immediate' ? 'first' : 'second' } })
      .mockResolvedValueOnce({ items: [item('c')], metadata: { _continue: 'first' } });
    await expect(readK8sCollection(page, smallLimits, (value) => value)).rejects.toMatchObject({
      status: 503,
      reason: 'repeated_continue',
    });
    expect(page).toHaveBeenCalledTimes(kind === 'immediate' ? 2 : 3);
  });

  it('bounds fresh-token empty-page loops as well as accumulated objects', async () => {
    const { readK8sCollection } = await import('@/lib/k8s-list');
    let serial = 0;
    const page = vi.fn(async () => ({ items: [], metadata: { _continue: `new-${++serial}` } }));
    await expect(readK8sCollection(page, smallLimits, (value) => value)).rejects.toMatchObject({
      reason: 'page_limit',
    });
    expect(page).toHaveBeenCalledTimes(smallLimits.maxPages);
  });

  it('bounds total raw objects, including duplicates discarded from the result', async () => {
    const { readK8sCollection } = await import('@/lib/k8s-list');
    const page = vi
      .fn()
      .mockResolvedValueOnce({ items: [item('a'), item('b')], metadata: { _continue: 'next' } })
      .mockResolvedValueOnce({ items: [item('a'), item('b')] });
    await expect(readK8sCollection(page, { ...smallLimits, maxItems: 3 }, () => null)).rejects.toMatchObject({
      reason: 'item_limit',
    });
    expect(page).toHaveBeenCalledTimes(2);
  });

  it('bounds UTF-8 bytes before filtering/projection, including a nonempty first page', async () => {
    const { readK8sCollection } = await import('@/lib/k8s-list');
    const first = { items: [item('a')], metadata: { _continue: 'next' } };
    const second = { items: [{ ...item('b'), data: { value: 'é'.repeat(40) } }] };
    const exact = Buffer.byteLength(JSON.stringify(first)) + Buffer.byteLength(JSON.stringify(second));
    const page = () => vi.fn().mockResolvedValueOnce(first).mockResolvedValueOnce(second);
    expect(await readK8sCollection(page(), { ...smallLimits, maxBytes: exact }, () => null)).toEqual([]);
    await expect(readK8sCollection(page(), { ...smallLimits, maxBytes: exact - 1 }, () => null)).rejects.toMatchObject({
      reason: 'byte_limit',
    });
  });

  it('bounds metadata-only accumulation without visiting values during sizing or deduplication', async () => {
    const { readK8sCollection } = await import('@/lib/k8s-list');
    const secret = item('a');
    const readData = vi.fn(() => {
      throw new Error('Metadata-only callers must not read values');
    });
    Object.defineProperty(secret, 'data', { get: readData });
    const page = () => vi.fn().mockResolvedValue({ items: [secret, secret] });
    expect(
      await readK8sCollection(page(), smallLimits, (value: typeof secret) => value.metadata, 'projection'),
    ).toEqual([secret.metadata]);
    await expect(
      readK8sCollection(
        page(),
        { ...smallLimits, maxBytes: 2 },
        (value: typeof secret) => value.metadata,
        'projection',
      ),
    ).rejects.toMatchObject({ reason: 'byte_limit' });
    expect(readData).not.toHaveBeenCalled();
  });

  it.each([
    { label: 'missing items', page: {} },
    { label: 'null page', page: null },
    { label: 'non-array items', page: { items: {} } },
    { label: 'missing name', page: { items: [{}] } },
    { label: 'malformed metadata', page: { items: [], metadata: null } },
    { label: 'array metadata', page: { items: [], metadata: [] } },
    { label: 'ignored batch limit', page: { items: [item('a'), item('b'), item('c')] } },
  ])('fails a $label response explicitly', async ({ page: result }) => {
    const { readK8sCollection } = await import('@/lib/k8s-list');
    await expect(
      readK8sCollection(vi.fn().mockResolvedValue(result), smallLimits, (value) => value),
    ).rejects.toMatchObject({ status: 503 });
  });

  it.each(['duplicate changed object', 'changed list revision', 'missing list revision'])(
    'rejects %s instead of mixing inconsistent pages',
    async (problem) => {
      const { readK8sCollection } = await import('@/lib/k8s-list');
      const page = vi
        .fn()
        .mockResolvedValueOnce({ items: [item('a')], metadata: { _continue: 'next', resourceVersion: '17' } })
        .mockResolvedValueOnce({
          items: [{ ...item(problem === 'duplicate changed object' ? 'a' : 'b'), data: { value: 'changed' } }],
          metadata: {
            resourceVersion:
              problem === 'changed list revision' ? '18' : problem === 'missing list revision' ? undefined : '17',
          },
        });
      await expect(readK8sCollection(page, smallLimits, (value) => value)).rejects.toMatchObject({
        reason: 'inconsistent_page',
      });
    },
  );

  it.each([403, 410, 429, 503])(
    'preserves page-two HTTP %i, with no automatic restart or partial inventory',
    async (status) => {
      const { readK8sCollection } = await import('@/lib/k8s-list');
      const { jsonError } = await import('@/lib/http');
      const page = vi
        .fn()
        .mockResolvedValueOnce({ items: [item('a')], metadata: { _continue: 'next' } })
        .mockRejectedValueOnce(apiError(status));
      const response = await readK8sCollection(page, smallLimits, (value) => value).then(() => {
        throw new Error('Expected failure');
      }, jsonError);
      expect(response.status).toBe(status);
      expect(await response.text()).not.toMatch(/synthetic-private|items|"a"/);
      expect(page).toHaveBeenCalledTimes(2);
    },
  );
});

describe('namespace scopes and own-property policy', () => {
  it('resolves/checks a configured allowlist without any Kubernetes client or namespace request', async () => {
    Object.assign(process.env, { K8STON_SCOPE: 'cluster', K8STON_NAMESPACES: 'unit-test, constructor, unit-test' });
    const mock = await mockKubernetes();
    const { listAllowedNamespaces, assertNamespaceAllowed } = await import('@/lib/namespaces');
    expect(await listAllowedNamespaces(dataUser)).toEqual(['constructor', 'unit-test']);
    for (let i = 0; i < 4; i++) await assertNamespaceAllowed('constructor', dataUser);
    await expect(assertNamespaceAllowed('outside', dataUser)).rejects.toMatchObject({ status: 403 });
    expect(mock.core.listNamespace).not.toHaveBeenCalled();
    expect(mock.getCoreApi).not.toHaveBeenCalled();
  });

  it('keeps own-namespace scope ahead of a configured cluster allowlist', async () => {
    process.env.K8STON_NAMESPACES = 'outside';
    const mock = await mockKubernetes();
    const { listAllowedNamespaces, assertNamespaceAllowed } = await import('@/lib/namespaces');
    expect(await listAllowedNamespaces(dataUser)).toEqual(['unit-test']);
    await expect(assertNamespaceAllowed('outside', dataUser)).rejects.toMatchObject({ status: 403 });
    expect(mock.getCoreApi).not.toHaveBeenCalled();
  });

  it('lists unrestricted cluster namespaces completely, carrying the same request options on every page', async () => {
    Object.assign(process.env, { K8STON_SCOPE: 'cluster', K8STON_IMPERSONATION: 'true' });
    const mock = await mockKubernetes();
    mock.core.listNamespace
      .mockResolvedValueOnce({ items: [{ metadata: { name: 'z' } }], metadata: { _continue: 'next' } })
      .mockResolvedValueOnce({ items: [{ metadata: { name: 'a' } }] });
    const { listAllowedNamespaces } = await import('@/lib/namespaces');
    expect(await listAllowedNamespaces(dataUser)).toEqual(['a', 'z']);
    const calls = mock.core.listNamespace.mock.calls;
    expect(calls.map(([args]) => args)).toEqual([{ limit: 100 }, { limit: 100, _continue: 'next' }]);
    expect(calls[0][1]?.httpApi).toBeDefined();
    expect(calls[1][1]).toBe(calls[0][1]);
  });

  it('does not replace failed unrestricted discovery with a successful own-namespace subset', async () => {
    process.env.K8STON_SCOPE = 'cluster';
    const mock = await mockKubernetes();
    mock.core.listNamespace
      .mockResolvedValueOnce({ items: [{ metadata: { name: 'a' } }], metadata: { _continue: 'next' } })
      .mockRejectedValueOnce(apiError(403));
    const { listAllowedNamespaces } = await import('@/lib/namespaces');
    await expect(listAllowedNamespaces(dataUser)).rejects.toMatchObject({ code: 403 });
    expect(mock.core.listNamespace).toHaveBeenCalledTimes(2);
  });

  it.each<{ label: string; absent?: boolean; policy: Record<string, unknown>; allowed: boolean }>([
    { label: 'confirmed absence', absent: true, policy: {}, allowed: true },
    { label: 'empty map', policy: {}, allowed: true },
    { label: 'omitted namespace', policy: { other: { groups: ['other'] } }, allowed: true },
    { label: 'empty own rule', policy: { constructor: {} }, allowed: true },
    { label: 'matching own rule', policy: { constructor: { groups: ['team'] } }, allowed: true },
    { label: 'denying own rule', policy: { constructor: { groups: ['other'] } }, allowed: false },
  ])('treats constructor as a valid namespace with $label', async ({ policy, absent, allowed }) => {
    const mock = await mockKubernetes();
    if (absent) mock.core.readNamespacedConfigMap.mockRejectedValue(apiError(404));
    else mock.core.readNamespacedConfigMap.mockResolvedValue({ data: { 'access.json': JSON.stringify(policy) } });
    const { canAccessSecret, canCreateInNamespace } = await import('@/lib/authz');
    const user = { ...dataUser, groups: ['team'] };
    const live = nativeSecret();
    live.metadata!.namespace = 'constructor';
    expect(await canAccessSecret(user, 'constructor', live)).toBe(allowed);
    expect(await canCreateInNamespace(user, 'constructor')).toBe(allowed);
    expect(mock.core.readNamespacedConfigMap).toHaveBeenCalledOnce();
  });

  it('does not confuse oversized policy ACLs with intentionally absent rules', async () => {
    const mock = await mockKubernetes();
    const log = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mock.core.readNamespacedConfigMap.mockResolvedValue({
      data: { 'access.json': JSON.stringify({ constructor: { users: Array(257).fill('synthetic-policy-user') } }) },
    });
    const { canCreateInNamespace } = await import('@/lib/authz');
    await expect(canCreateInNamespace({ ...dataUser, groups: [] }, 'constructor')).rejects.toMatchObject({
      status: 503,
    });
    expect(JSON.stringify(log.mock.calls)).not.toContain('synthetic-policy-user');
  });
});

function historyLive(version: number): V1Secret {
  const live = nativeSecret();
  live.metadata!.annotations!['k8ston.io/version'] = String(version);
  live.metadata!.resourceVersion = `live-${version}`;
  return live;
}

describe('UID-bound history and workload callers', () => {
  it('uses complete UID-scoped pages for list, raw restore lookup, deletion, and final cleanup confirmation', async () => {
    process.env.K8STON_IMPERSONATION = 'true';
    const live = historyLive(206);
    const snapshots = Array.from({ length: 205 }, (_, i) => boundSnapshot(historyLive(i + 1), i + 1));
    const store = await mockHistoryStore(snapshots);
    const { listSnapshots, readSnapshotVersion, deleteSnapshots } = await import('@/lib/snapshot-store');
    const decoder = vi.spyOn(TextDecoder.prototype, 'decode');
    const records = await listSnapshots('unit-test', live, dataUser);
    expect(records.map((record) => record.metadata.version)).toEqual(Array.from({ length: 205 }, (_, i) => 205 - i));
    const target = await readSnapshotVersion('unit-test', live, 1, dataUser);
    expect(target.secret.data).toEqual(rawData);
    expect(Object.hasOwn(target.secret.data!, '__proto__')).toBe(true);
    await deleteSnapshots('unit-test', live, dataUser);
    expect(store.objects.size).toBe(0);
    expect(store.core.deleteNamespacedSecret).toHaveBeenCalledTimes(205);
    expect(store.core.listNamespacedSecret).toHaveBeenCalledTimes(10); // 3 + 3 + 3 + final empty inventory
    for (const [args, opts] of store.core.listNamespacedSecret.mock.calls) {
      expect(args).toMatchObject({
        namespace: 'unit-test',
        limit: 100,
        labelSelector: `k8ston.io/source-uid=${historyHash(live.metadata!.uid!)},k8ston.io/kind=history`,
      });
      expect(opts?.httpApi).toBeDefined();
    }
    expect(decoder).not.toHaveBeenCalled();
  });

  it('prunes beyond the first page using metadata and keeps the newest configured 100', async () => {
    Object.assign(process.env, { K8STON_HISTORY_LIMIT: '100', K8STON_IMPERSONATION: 'true' });
    const live = historyLive(150);
    const store = await mockHistoryStore(
      Array.from({ length: 149 }, (_, i) => boundSnapshot(historyLive(i + 1), i + 1)),
    );
    const { createSnapshot, listSnapshots } = await import('@/lib/snapshot-store');
    const decoder = vi.spyOn(TextDecoder.prototype, 'decode');
    await createSnapshot('unit-test', live, dataUser);
    expect(store.core.listNamespacedSecret).toHaveBeenCalledTimes(2);
    expect(store.core.deleteNamespacedSecret).toHaveBeenCalledTimes(50);
    expect((await listSnapshots('unit-test', live, dataUser)).map((r) => r.metadata.version)).toEqual(
      Array.from({ length: 100 }, (_, i) => 150 - i),
    );
    expect(decoder).not.toHaveBeenCalled();
    expect(store.core.listNamespacedSecret.mock.calls.every(([, opts]) => !!opts?.httpApi)).toBe(true);
  });

  it.each(['list', 'restore lookup', 'delete'] as const)(
    'fails %s on a late history page instead of using a partial inventory',
    async (action) => {
      const live = historyLive(3);
      const store = await mockHistoryStore();
      store.core.listNamespacedSecret
        .mockResolvedValueOnce({ items: [boundSnapshot(historyLive(1), 1)], metadata: { _continue: 'next' } })
        .mockRejectedValueOnce(apiError(403));
      const { listSnapshots, readSnapshotVersion, deleteSnapshots } = await import('@/lib/snapshot-store');
      const operation =
        action === 'list'
          ? listSnapshots('unit-test', live, dataUser)
          : action === 'restore lookup'
            ? readSnapshotVersion('unit-test', live, 1, dataUser)
            : deleteSnapshots('unit-test', live, dataUser);
      await expect(operation).rejects.toMatchObject({ status: 503 });
      expect(store.core.deleteNamespacedSecret).not.toHaveBeenCalled();
      expect(store.core.createNamespacedSecret).not.toHaveBeenCalled();
    },
  );

  it('keeps complete per-kind workload pages and per-user list/patch options', async () => {
    process.env.K8STON_IMPERSONATION = 'true';
    const mock = await mockConsumers();
    for (const list of [mock.apps.listNamespacedDeployment, mock.apps.listNamespacedDaemonSet]) {
      list
        .mockResolvedValueOnce({ items: [consumerWorkload('first')], metadata: { _continue: 'next' } })
        .mockResolvedValueOnce({ items: [consumerWorkload('second')] });
    }
    mock.apps.listNamespacedStatefulSet
      .mockResolvedValueOnce({ items: [statefulConsumer('first')], metadata: { _continue: 'next' } })
      .mockResolvedValueOnce({ items: [statefulConsumer('second')] });
    const { restartConsumers } = await import('@/lib/consumers');
    const result = await restartConsumers(consumerNamespace, consumerSecret, consumerUser);
    expect(result).toMatchObject({ status: 'requested', matched: 6, discoveryFailures: [] });
    for (const list of [
      mock.apps.listNamespacedDeployment,
      mock.apps.listNamespacedStatefulSet,
      mock.apps.listNamespacedDaemonSet,
    ]) {
      expect(list.mock.calls.map(([args]) => args)).toEqual([
        { namespace: consumerNamespace, limit: 100 },
        { namespace: consumerNamespace, limit: 100, _continue: 'next' },
      ]);
      expect(list.mock.calls[0][1]?.httpApi).toBeDefined();
      expect(list.mock.calls[1][1]).toBe(list.mock.calls[0][1]);
    }
    for (const patch of [
      mock.apps.patchNamespacedDeployment,
      mock.apps.patchNamespacedStatefulSet,
      mock.apps.patchNamespacedDaemonSet,
    ]) {
      expect(patch.mock.calls.map(([args]) => args.name)).toEqual(['first', 'second']);
      expect(patch.mock.calls.every(([, opts]) => !!opts?.httpApi)).toBe(true);
    }
  });

  it('settles a failed later page before any patches and isolates the incomplete kind', async () => {
    const mock = await mockConsumers();
    let reject!: (error: unknown) => void;
    mock.apps.listNamespacedDeployment
      .mockResolvedValueOnce({ items: [consumerWorkload('incomplete')], metadata: { _continue: 'next' } })
      .mockReturnValueOnce(
        new Promise((_resolve, fail) => {
          reject = fail;
        }),
      );
    mock.apps.listNamespacedDaemonSet.mockResolvedValue({ items: [consumerWorkload('complete')] });
    const { restartConsumers } = await import('@/lib/consumers');
    const operation = restartConsumers(consumerNamespace, consumerSecret, consumerUser);
    await vi.waitFor(() => expect(mock.apps.listNamespacedDeployment).toHaveBeenCalledTimes(2));
    expect(mock.apps.patchNamespacedDaemonSet).not.toHaveBeenCalled();
    reject(apiError(403));
    const result = await operation;
    expect(result).toMatchObject({
      status: 'partial',
      matched: 1,
      requested: [{ kind: 'DaemonSet', name: 'complete' }],
      discoveryFailures: [{ kind: 'Deployment', code: 'forbidden', httpStatus: 403 }],
    });
    expect(mock.apps.patchNamespacedDeployment).not.toHaveBeenCalled();
  });
});
