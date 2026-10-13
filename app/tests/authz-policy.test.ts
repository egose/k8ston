import { ApiException, type V1ConfigMap, type V1Secret } from '@kubernetes/client-node';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TEST_APP_URL } from './helpers/environment';
import { mockKubernetes } from './helpers/kubernetes';

const namespace = 'unit-test';
const user = { sub: 'alice-id', email: 'alice@example.test', name: 'Alice', groups: ['developers'] };
const privateMarker = 'synthetic-policy-content-must-not-be-logged';
const live: V1Secret = {
  metadata: {
    namespace,
    name: 'credentials',
    resourceVersion: '17',
    annotations: { 'krypton.io/managed-by': 'krypton' },
  },
  data: { credential: Buffer.from('synthetic-live-value').toString('base64') },
};
const unavailable = { error: 'Namespace access policy is unavailable' };
const restrictedMap = { [namespace]: { groups: ['operators'], users: [] } };
const policy = (value: unknown): V1ConfigMap => ({ data: { 'access.json': JSON.stringify(value) } });
const apiFailure = (status: number) =>
  new ApiException(status, privateMarker, JSON.stringify({ message: privateMarker }), {
    authorization: `Bearer ${privateMarker}`,
  });

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function signIn(identity = user) {
  const auth = await import('@/lib/auth');
  await auth.setSessionCookie(await auth.createSessionToken(identity));
}

async function request(boundary: 'read' | 'list' | 'create', ns = namespace) {
  const collection = await import('@/app/api/namespaces/[namespace]/secrets/route');
  const named = await import('@/app/api/namespaces/[namespace]/secrets/[name]/route');
  const url = `${TEST_APP_URL}/api/namespaces/${ns}/secrets`;
  if (boundary === 'read') {
    return named.GET(new Request(`${url}/credentials`), {
      params: Promise.resolve({ namespace: ns, name: 'credentials' }),
    });
  }
  const ctx = { params: Promise.resolve({ namespace: ns }) };
  if (boundary === 'list') return collection.GET(new Request(url), ctx);
  return collection.POST(
    new Request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Choosing an ACL in the form must not bypass namespace creation policy.
      body: JSON.stringify({ name: 'new-secret', data: { key: 'synthetic-new-value' }, allowedUsers: [user.email] }),
    }),
    ctx,
  );
}

async function setupCore() {
  const mock = await mockKubernetes();
  mock.core.readNamespacedSecret.mockResolvedValue(live);
  mock.core.listNamespacedSecret.mockResolvedValue({ items: [live] });
  mock.core.createNamespacedSecret.mockImplementation(async ({ body }) => body);
  return mock;
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('namespace policy failures at real read/list/create handlers', () => {
  const failures: Array<{
    label: string;
    result?: V1ConfigMap;
    error?: unknown;
    reason: string;
    status?: number;
  }> = [
    { label: 'missing ConfigMap data', result: {}, reason: 'missing_data' },
    { label: 'missing access.json key', result: { data: { other: privateMarker } }, reason: 'missing_data' },
    { label: 'empty access.json', result: { data: { 'access.json': '' } }, reason: 'missing_data' },
    { label: 'blank access.json', result: { data: { 'access.json': '\n  ' } }, reason: 'missing_data' },
    {
      label: 'non-string access.json',
      result: { data: { 'access.json': 42 } } as unknown as V1ConfigMap,
      reason: 'missing_data',
    },
    { label: 'invalid JSON', result: { data: { 'access.json': `{"${privateMarker}":` } }, reason: 'invalid_json' },
    { label: 'null map', result: policy(null), reason: 'invalid_schema' },
    { label: 'array map', result: policy([]), reason: 'invalid_schema' },
    { label: 'null namespace entry', result: policy({ [namespace]: null }), reason: 'invalid_schema' },
    { label: 'non-array groups', result: policy({ [namespace]: { groups: privateMarker } }), reason: 'invalid_schema' },
    { label: 'non-array users', result: policy({ [namespace]: { users: privateMarker } }), reason: 'invalid_schema' },
    { label: 'non-string member', result: policy({ [namespace]: { groups: [42] } }), reason: 'invalid_schema' },
    {
      label: 'misspelled rule field',
      result: policy({ [namespace]: { group: [privateMarker] } }),
      reason: 'invalid_schema',
    },
    { label: '403 read failure', error: apiFailure(403), reason: 'read_failed', status: 403 },
    { label: '401 read failure', error: apiFailure(401), reason: 'read_failed', status: 401 },
    { label: '500 read failure', error: apiFailure(500), reason: 'read_failed', status: 500 },
    { label: 'timeout', error: Object.assign(new Error(privateMarker), { code: 'ETIMEDOUT' }), reason: 'read_failed' },
    { label: 'untrusted status text', error: { code: `404 ${privateMarker}` }, reason: 'read_failed' },
  ];

  it.each(failures)('fails closed on $label without logging payloads', async ({ result, error, reason, status }) => {
    const { core, getAppsApi } = await setupCore();
    if (error !== undefined) core.readNamespacedConfigMap.mockRejectedValue(error);
    else core.readNamespacedConfigMap.mockResolvedValue(result!);
    await signIn();

    for (const boundary of ['read', 'list', 'create'] as const) {
      const response = await request(boundary);
      expect(response.status, boundary).toBe(503);
      expect(await response.json()).toEqual(unavailable);
    }
    // Failed reads are retried, never cached as an open policy.
    expect(core.readNamespacedConfigMap).toHaveBeenCalledTimes(3);
    expect(core.createNamespacedSecret).not.toHaveBeenCalled();
    expect(core.replaceNamespacedSecret).not.toHaveBeenCalled();
    expect(core.deleteNamespacedSecret).not.toHaveBeenCalled();
    expect(getAppsApi).not.toHaveBeenCalled();
    expect(vi.mocked(console.warn).mock.calls).toEqual(
      Array.from({ length: 3 }, () => [
        '[krypton] namespace access policy unavailable',
        { reason, ...(status ? { status } : {}) },
      ]),
    );
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain(privateMarker);
    expect(JSON.stringify(vi.mocked(console.log).mock.calls)).not.toContain(privateMarker);
  });

  it.each([
    { label: 'no items', items: [] },
    {
      label: 'only explicit ACLs',
      items: [
        {
          ...live,
          metadata: {
            ...live.metadata,
            annotations: { ...live.metadata?.annotations, 'krypton.io/allowed-users': user.email },
          },
        },
      ],
    },
  ])('returns unavailable for list creation hints with $label', async ({ items }) => {
    const { core } = await setupCore();
    core.listNamespacedSecret.mockResolvedValue({ items });
    core.readNamespacedConfigMap.mockRejectedValue(apiFailure(403));
    await signIn();
    const response = await request('list');
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual(unavailable);
    expect(core.readNamespacedConfigMap).toHaveBeenCalledTimes(1);
  });
});

describe('intentional absence and authorization precedence', () => {
  it.each([
    { label: 'confirmed 404', absent: true, value: undefined },
    { label: 'empty map', absent: false, value: {} },
    { label: 'namespace omitted', absent: false, value: { another: { groups: ['operators'] } } },
    { label: 'empty rule lists', absent: false, value: { [namespace]: { groups: [], users: [] } } },
    { label: 'omitted rule lists', absent: false, value: { [namespace]: {} } },
  ])('keeps $label intentionally open', async ({ absent, value }) => {
    const { core } = await setupCore();
    if (absent) core.readNamespacedConfigMap.mockRejectedValue(apiFailure(404));
    else core.readNamespacedConfigMap.mockResolvedValue(policy(value));
    await signIn();
    expect((await request('read')).status).toBe(200);
    const list = await request('list');
    expect(list.status).toBe(200);
    expect(await list.json()).toMatchObject({ canCreate: true, secrets: [{ name: 'credentials' }] });
    expect((await request('create')).status).toBe(201);
    expect(core.readNamespacedConfigMap).toHaveBeenCalledExactlyOnceWith({ namespace, name: 'krypton-access' });
    expect(console.warn).not.toHaveBeenCalled();
  });

  it.each([
    { label: 'matching namespace group', rules: { groups: ['developers'] }, allowed: true },
    { label: 'case-insensitive namespace user', rules: { users: ['ALICE@EXAMPLE.TEST'] }, allowed: true },
    {
      label: 'nonmatching namespace rules',
      rules: { groups: ['operators'], users: ['bob@example.test'] },
      allowed: false,
    },
  ])('enforces $label consistently for reading, listing, and creation', async ({ rules, allowed }) => {
    const { core } = await setupCore();
    core.readNamespacedConfigMap.mockResolvedValue(policy({ [namespace]: rules }));
    await signIn();
    expect((await request('read')).status).toBe(allowed ? 200 : 403);
    expect((await request('create')).status).toBe(allowed ? 201 : 403);
    const list = await request('list');
    expect(list.status).toBe(200);
    const body = await list.json();
    expect(body.canCreate).toBe(allowed);
    expect(body.secrets).toHaveLength(allowed ? 1 : 0);
    expect(core.createNamespacedSecret).toHaveBeenCalledTimes(allowed ? 1 : 0);
    expect(core.readNamespacedConfigMap).toHaveBeenCalledTimes(1);
  });

  it.each<{ label: string; annotations: Record<string, string>; allowed: boolean }>([
    {
      label: 'matching user',
      annotations: { 'krypton.io/allowed-users': '  ALICE@EXAMPLE.TEST, bob@example.test ' },
      allowed: true,
    },
    { label: 'matching group', annotations: { 'krypton.io/allowed-groups': ' operators, developers ' }, allowed: true },
    { label: 'different user', annotations: { 'krypton.io/allowed-users': 'bob@example.test' }, allowed: false },
    { label: 'case-sensitive group', annotations: { 'krypton.io/allowed-groups': 'Developers' }, allowed: false },
  ])('decides an explicit live ACL ($label) without namespace policy', async ({ annotations, allowed }) => {
    const { core } = await setupCore();
    core.readNamespacedConfigMap.mockRejectedValue(apiFailure(403));
    core.readNamespacedSecret.mockResolvedValue({
      ...live,
      metadata: { ...live.metadata, annotations: { ...live.metadata?.annotations, ...annotations } },
    });
    await signIn();
    const response = await request('read');
    expect(response.status).toBe(allowed ? 200 : 403);
    expect(core.readNamespacedConfigMap).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it.each(['admin group', 'admin email', 'bootstrap', 'explicit auth bypass'])(
    'preserves %s policy precedence',
    async (mode) => {
      if (mode === 'admin email') process.env.KRYPTON_ADMIN_USERS = 'ALICE@EXAMPLE.TEST';
      if (mode === 'bootstrap') delete process.env.KRYPTON_ADMIN_GROUPS;
      if (mode === 'explicit auth bypass') {
        process.env.AUTH_DISABLED = 'true';
        delete process.env.SESSION_SECRET;
      }
      const { core } = await setupCore();
      core.readNamespacedConfigMap.mockRejectedValue(apiFailure(403));
      const deniedLive = {
        ...live,
        metadata: {
          ...live.metadata,
          annotations: { ...live.metadata?.annotations, 'krypton.io/allowed-users': 'bob@example.test' },
        },
      };
      core.readNamespacedSecret.mockResolvedValue(deniedLive);
      core.listNamespacedSecret.mockResolvedValue({ items: [deniedLive] });
      if (mode !== 'explicit auth bypass') {
        await signIn(mode === 'admin group' ? { ...user, groups: ['unit-test-admins'] } : user);
      }
      expect((await request('read')).status).toBe(200);
      const list = await request('list');
      expect(list.status).toBe(200);
      expect(await list.json()).toMatchObject({ canCreate: true, secrets: [{ name: 'credentials' }] });
      expect((await request('create')).status).toBe(201);
      expect(core.readNamespacedConfigMap).not.toHaveBeenCalled();
    },
  );

  it.each(['list', 'create'] as const)(
    'keeps authentication and namespace gates before %s policy access',
    async (boundary) => {
      const { core, getCoreApi } = await setupCore();
      expect((await request(boundary)).status).toBe(401);
      await signIn();
      expect((await request(boundary, 'outside-scope')).status).toBe(403);
      expect(getCoreApi).not.toHaveBeenCalled();
      expect(core.readNamespacedConfigMap).not.toHaveBeenCalled();
    },
  );
});

describe('single-flight policy cache and refresh', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-12T12:00:00Z'));
  });

  it('coalesces misses and starts its exact 60s TTL when a valid read completes', async () => {
    const { core } = await mockKubernetes();
    const first = deferred<V1ConfigMap>();
    const refresh = deferred<V1ConfigMap>();
    core.readNamespacedConfigMap.mockReturnValueOnce(first.promise).mockReturnValueOnce(refresh.promise);
    const { getNamespaceAccessMap } = await import('@/lib/authz');
    const start = Date.now();
    const misses = Array.from({ length: 12 }, () => getNamespaceAccessMap());
    expect(core.readNamespacedConfigMap).toHaveBeenCalledTimes(1);
    vi.setSystemTime(start + 15_000);
    first.resolve(policy({}));
    expect(await Promise.all(misses)).toEqual(Array.from({ length: 12 }, () => ({})));
    vi.setSystemTime(start + 15_000 + 59_999);
    expect(await getNamespaceAccessMap()).toEqual({});
    expect(core.readNamespacedConfigMap).toHaveBeenCalledTimes(1);
    vi.setSystemTime(start + 15_000 + 60_000);
    const refreshes = Array.from({ length: 12 }, () => getNamespaceAccessMap());
    expect(core.readNamespacedConfigMap).toHaveBeenCalledTimes(2);
    refresh.resolve(policy(restrictedMap));
    expect(await Promise.all(refreshes)).toEqual(Array.from({ length: 12 }, () => restrictedMap));
  });

  it.each(['open', 'restricted', 'absent'])(
    'discards expired %s policy on refresh failure and immediately retries',
    async (initial) => {
      const { core } = await mockKubernetes();
      if (initial === 'absent') core.readNamespacedConfigMap.mockRejectedValueOnce(apiFailure(404));
      else core.readNamespacedConfigMap.mockResolvedValueOnce(policy(initial === 'open' ? {} : restrictedMap));
      const { getNamespaceAccessMap } = await import('@/lib/authz');
      await getNamespaceAccessMap();
      const refresh = deferred<V1ConfigMap>();
      core.readNamespacedConfigMap.mockReturnValueOnce(refresh.promise).mockResolvedValueOnce(policy(restrictedMap));
      vi.setSystemTime(Date.now() + 60_000);
      const pending = Promise.allSettled(Array.from({ length: 12 }, () => getNamespaceAccessMap()));
      expect(core.readNamespacedConfigMap).toHaveBeenCalledTimes(2);
      refresh.reject(apiFailure(403));
      const failures = await pending;
      expect(failures).toHaveLength(12);
      for (const result of failures) {
        expect(result).toMatchObject({ status: 'rejected', reason: { status: 503, message: unavailable.error } });
      }
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(await getNamespaceAccessMap()).toEqual(restrictedMap);
      expect(core.readNamespacedConfigMap).toHaveBeenCalledTimes(3);
      expect(await getNamespaceAccessMap()).toEqual(restrictedMap);
      expect(core.readNamespacedConfigMap).toHaveBeenCalledTimes(3);
    },
  );

  it('shares a failed refresh across real handlers, then enforces repaired policy without waiting another TTL', async () => {
    const { core } = await setupCore();
    core.readNamespacedConfigMap.mockRejectedValueOnce(apiFailure(404));
    await signIn();
    expect((await request('read')).status).toBe(200);
    vi.setSystemTime(Date.now() + 59_999);
    expect((await request('create')).status).toBe(201);
    expect(core.readNamespacedConfigMap).toHaveBeenCalledTimes(1);

    vi.setSystemTime(Date.now() + 1);
    const refresh = deferred<V1ConfigMap>();
    core.readNamespacedConfigMap.mockReturnValueOnce(refresh.promise);
    const authz = await import('@/lib/authz');
    const creationCheck = vi.spyOn(authz, 'canCreateInNamespace');
    const responses = Promise.all([request('read'), request('list'), request('create')]);
    // Wait for all three authenticated handlers to reach the shared policy read.
    await vi.waitFor(() => {
      expect(core.readNamespacedSecret).toHaveBeenCalledTimes(2);
      expect(core.listNamespacedSecret).toHaveBeenCalledTimes(1);
      expect(core.readNamespacedConfigMap).toHaveBeenCalledTimes(2);
      expect(creationCheck).toHaveBeenCalledTimes(1);
    });
    refresh.reject(Object.assign(new Error(privateMarker), { code: 'ETIMEDOUT' }));
    for (const response of await responses) {
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual(unavailable);
    }
    expect(core.readNamespacedConfigMap).toHaveBeenCalledTimes(2);
    // Only the creation before expiry reached Kubernetes.
    expect(core.createNamespacedSecret).toHaveBeenCalledTimes(1);

    core.readNamespacedConfigMap.mockResolvedValue(policy(restrictedMap));
    expect((await request('read')).status).toBe(403);
    expect((await request('create')).status).toBe(403);
    const list = await request('list');
    expect(list.status).toBe(200);
    expect(await list.json()).toEqual({ namespace, secrets: [], canCreate: false });
    expect(core.readNamespacedConfigMap).toHaveBeenCalledTimes(3);
    expect(core.createNamespacedSecret).toHaveBeenCalledTimes(1);
  });
});
