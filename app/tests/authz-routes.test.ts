import { ApiException, type V1Secret } from '@kubernetes/client-node';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TEST_APP_URL } from './helpers/environment';
import { mockKubernetes } from './helpers/kubernetes';
import { apiError, boundSnapshot, historyName, persistedSnapshot } from './helpers/history';

const namespace = 'unit-test';
const user = { sub: 'alice-id', email: 'alice@example.test', name: 'Alice', groups: ['developers'] };
const liveValue = 'synthetic-current-value';
const historicalValue = 'synthetic-historical-value';
const live: V1Secret = {
  metadata: {
    namespace,
    name: 'credentials',
    uid: 'synthetic-live-uid',
    resourceVersion: '17',
    annotations: {
      'krypton.io/managed-by': 'krypton',
      'krypton.io/version': '2',
      'krypton.io/allowed-users': user.email,
    },
  },
  data: { credential: Buffer.from(liveValue).toString('base64') },
};
const snapshot: V1Secret = {
  metadata: {
    namespace,
    name: 'credentials-v1',
    resourceVersion: '11',
    labels: { 'krypton.io/kind': 'history', 'krypton.io/history-of': 'credentials' },
    annotations: {
      'krypton.io/version': '1',
      'krypton.io/history-of': 'credentials',
      'krypton.io/allowed-users': user.email,
    },
  },
  data: { credential: Buffer.from(historicalValue).toString('base64') },
};

type Handler = (req: Request, ctx: { params: Promise<{ namespace: string; name: string }> }) => Promise<Response>;
const actions: Array<{
  label: string;
  action: string;
  method: string;
  suffix: string;
  body?: Record<string, unknown>;
  load: () => Promise<Handler>;
}> = [
  {
    label: 'GET',
    action: 'secret.read',
    method: 'GET',
    suffix: '',
    load: async () => (await import('@/app/api/namespaces/[namespace]/secrets/[name]/route')).GET,
  },
  {
    label: 'PUT',
    action: 'secret.update',
    method: 'PUT',
    suffix: '',
    body: { resourceVersion: '17', data: { credential: 'synthetic-updated-value' }, allowedUsers: [user.email] },
    load: async () => (await import('@/app/api/namespaces/[namespace]/secrets/[name]/route')).PUT,
  },
  {
    label: 'DELETE',
    action: 'secret.delete',
    method: 'DELETE',
    suffix: '?resourceVersion=17',
    load: async () => (await import('@/app/api/namespaces/[namespace]/secrets/[name]/route')).DELETE,
  },
  {
    label: 'history',
    action: 'secret.history',
    method: 'GET',
    suffix: '/versions',
    load: async () => (await import('@/app/api/namespaces/[namespace]/secrets/[name]/versions/route')).GET,
  },
  {
    label: 'restore',
    action: 'secret.restore',
    method: 'POST',
    suffix: '/restore',
    body: { version: 1, resourceVersion: '17' },
    load: async () => (await import('@/app/api/namespaces/[namespace]/secrets/[name]/restore/route')).POST,
  },
  {
    label: 'restart',
    action: 'secret.restart',
    method: 'POST',
    suffix: '/restart-consumers',
    load: async () => (await import('@/app/api/namespaces/[namespace]/secrets/[name]/restart-consumers/route')).POST,
  },
];

async function invoke(action: (typeof actions)[number], name = 'credentials', ns = namespace) {
  const handler = await action.load();
  return handler(
    new Request(`${TEST_APP_URL}/api/namespaces/${ns}/secrets/${name}${action.suffix}`, {
      method: action.method,
      ...(action.body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(action.body) } : {}),
    }),
    { params: Promise.resolve({ namespace: ns, name }) },
  );
}

async function signIn(admin = false) {
  const auth = await import('@/lib/auth');
  await auth.setSessionCookie(await auth.createSessionToken(admin ? { ...user, groups: ['unit-test-admins'] } : user));
}

function expectNoActions(mock: Awaited<ReturnType<typeof mockKubernetes>>) {
  expect(mock.core.listNamespacedSecret).not.toHaveBeenCalled();
  expect(mock.core.createNamespacedSecret).not.toHaveBeenCalled();
  expect(mock.core.replaceNamespacedSecret).not.toHaveBeenCalled();
  expect(mock.core.deleteNamespacedSecret).not.toHaveBeenCalled();
  expect(mock.getAppsApi).not.toHaveBeenCalled();
}

async function setupAllowedActions(current = live) {
  const mock = await mockKubernetes();
  const deleted = new Set<string>();
  mock.core.readNamespacedSecret.mockImplementation(async ({ name }) => {
    if (name === live.metadata!.name && !deleted.has(name)) return current;
    throw apiError(404); // Confirmed live/snapshot absence after DELETE.
  });
  // Old ACLs can deny Alice: history is governed by the current live ACL alone.
  const target = boundSnapshot({ ...live, metadata: { ...live.metadata, resourceVersion: '11' } }, 1, snapshot.data);
  target.metadata!.annotations!['krypton.io/allowed-users'] = 'bob@example.test';
  const snapshots = [target];
  mock.core.listNamespacedSecret.mockImplementation(async () => ({
    items: snapshots.filter((s) => !deleted.has(s.metadata!.name!)),
  }));
  mock.core.createNamespacedSecret.mockImplementation(async ({ body }) => {
    const saved = persistedSnapshot(body);
    snapshots.push(saved);
    return saved;
  });
  mock.core.replaceNamespacedSecret.mockImplementation(async ({ body }) => ({
    ...body,
    metadata: { ...body.metadata, resourceVersion: '18' },
  }));
  mock.core.deleteNamespacedSecret.mockImplementation(async ({ name }) => {
    deleted.add(name);
    return {};
  });
  mock.apps.listNamespacedDeployment.mockResolvedValue({
    items: [
      {
        metadata: { name: 'consumer', uid: 'synthetic-uid-consumer', resourceVersion: '1001' },
        spec: {
          selector: {},
          template: { spec: { containers: [{ name: 'app', envFrom: [{ secretRef: { name: 'credentials' } }] }] } },
        },
      },
    ],
  });
  mock.apps.listNamespacedStatefulSet.mockResolvedValue({ items: [] });
  mock.apps.listNamespacedDaemonSet.mockResolvedValue({ items: [] });
  mock.apps.patchNamespacedDeployment.mockResolvedValue({});
  return mock;
}

beforeEach(() => {
  process.env.KRYPTON_RESTART_ENABLED = 'true';
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe.each([true, false])('shared live-object boundary with managedOnly=%s', (managedOnly) => {
  beforeEach(() => {
    process.env.KRYPTON_MANAGED_ONLY = String(managedOnly);
  });

  it.each(actions)('$label denies a revoked live ACL and hides directly addressed historical ACLs', async (action) => {
    const mock = await mockKubernetes();
    await signIn();
    const revokedLive = {
      ...live,
      metadata: {
        ...live.metadata,
        annotations: { ...live.metadata?.annotations, 'krypton.io/allowed-users': 'bob@example.test' },
      },
    };
    mock.core.readNamespacedSecret.mockResolvedValueOnce(revokedLive);
    const denied = await invoke(action);
    expect(denied.status).toBe(403);
    expect(await denied.text()).not.toContain(liveValue);

    // Normal snapshots have no managed annotation. Also reject snapshots that
    // were stamped managed previously; an admin or old ACL cannot override kind.
    for (const annotations of [
      snapshot.metadata?.annotations,
      {
        ...snapshot.metadata?.annotations,
        'krypton.io/managed-by': 'krypton',
      },
    ]) {
      mock.core.readNamespacedSecret.mockResolvedValueOnce({
        ...snapshot,
        metadata: { ...snapshot.metadata, annotations },
      });
      const response = await invoke(action, 'credentials-v1');
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: `Secret "credentials-v1" not found in "${namespace}"` });
    }
    expect(mock.core.readNamespacedSecret).toHaveBeenCalledTimes(3);
    expect(mock.core.readNamespacedConfigMap).not.toHaveBeenCalled();
    expectNoActions(mock);
    const audits = vi.mocked(console.log).mock.calls.map(([event]) => JSON.parse(event));
    expect(audits).toHaveLength(3);
    for (const audit of audits)
      expect(audit).toMatchObject({ action: action.action, result: 'deny', user: user.email });
    expect(JSON.stringify(audits)).not.toContain(liveValue);
    expect(JSON.stringify(audits)).not.toContain(historicalValue);
  });

  it.each(actions)('$label hides directly addressed snapshots even from admins', async (action) => {
    const mock = await mockKubernetes();
    await signIn(true);
    mock.core.readNamespacedSecret.mockResolvedValue({
      ...snapshot,
      metadata: {
        ...snapshot.metadata,
        annotations: { ...snapshot.metadata?.annotations, 'krypton.io/managed-by': 'krypton' },
      },
    });
    const response = await invoke(action, 'credentials-v1');
    expect(response.status).toBe(404);
    expect(mock.core.readNamespacedConfigMap).not.toHaveBeenCalled();
    expectNoActions(mock);
  });

  it.each(actions)(
    '$label keeps authorized live operations usable without consulting namespace policy',
    async (action) => {
      const mock = await setupAllowedActions();
      await signIn();
      const response = await invoke(action);
      expect(response.status).toBe(200);
      const liveReads = action.label === 'DELETE' ? 5 : action.label === 'restore' ? 2 : 1;
      expect(mock.core.readNamespacedSecret.mock.calls.filter(([args]) => args.name === 'credentials')).toEqual(
        Array.from({ length: liveReads }, () => [{ namespace, name: 'credentials' }, undefined]),
      );
      expect(mock.core.readNamespacedSecret).toHaveBeenCalledTimes(liveReads + (action.label === 'DELETE' ? 1 : 0));
      expect(mock.core.readNamespacedConfigMap).not.toHaveBeenCalled();
      const body = await response.json();
      if (action.label === 'GET') expect(body.secret.data).toEqual({ credential: liveValue });
      if (action.label === 'PUT') {
        expect(body.secret.data).toEqual({ credential: 'synthetic-updated-value' });
        expect(mock.core.createNamespacedSecret).toHaveBeenCalledTimes(1);
        expect(mock.core.replaceNamespacedSecret).toHaveBeenCalledTimes(1);
      }
      if (action.label === 'DELETE') {
        expect(body).toEqual({
          status: 'deleted',
          name: 'credentials',
          deleted: 'credentials',
          uid: live.metadata!.uid,
          history: 'cleaned',
        });
        expect(mock.core.deleteNamespacedSecret.mock.calls.map(([args]) => args.name)).toEqual([
          historyName(live.metadata!.uid!, 1),
          'credentials',
        ]);
      }
      if (action.label === 'history') expect(body.versions).toMatchObject([{ data: { credential: historicalValue } }]);
      if (action.label === 'restore') {
        expect(body.secret.data).toEqual({ credential: historicalValue });
        expect(body.secret.allowedUsers).toEqual([user.email]);
        expect(mock.core.createNamespacedSecret).toHaveBeenCalledTimes(1);
        expect(mock.core.replaceNamespacedSecret).toHaveBeenCalledTimes(1);
      }
      if (action.label === 'restart') {
        expect(body.status).toBe('requested');
        expect(body.requested).toEqual([{ kind: 'Deployment', name: 'consumer' }]);
        expect(mock.apps.patchNamespacedDeployment).toHaveBeenCalledTimes(1);
      }
    },
  );

  it.each(actions)('$label preserves the unmanaged live-object visibility switch', async (action) => {
    const mock = await setupAllowedActions({
      ...live,
      metadata: {
        ...live.metadata,
        annotations: { 'krypton.io/allowed-users': user.email, 'krypton.io/version': '2' },
      },
    });
    await signIn();
    const response = await invoke(action);
    expect(response.status).toBe(managedOnly ? 404 : 200);
    expect(mock.core.readNamespacedConfigMap).not.toHaveBeenCalled();
    if (managedOnly) expectNoActions(mock);
  });

  it.each([false, true])('uses the same visibility rules for lists (admin=%s)', async (admin) => {
    const { core } = await mockKubernetes();
    await signIn(admin);
    core.readNamespacedConfigMap.mockResolvedValue({ data: { 'access.json': '{}' } });
    const unmanaged = {
      ...live,
      metadata: { ...live.metadata, name: 'external', annotations: { 'krypton.io/allowed-users': user.email } },
    };
    const deniedLive = {
      ...live,
      metadata: {
        ...live.metadata,
        name: 'denied',
        annotations: { ...live.metadata?.annotations, 'krypton.io/allowed-users': 'bob@example.test' },
      },
    };
    core.listNamespacedSecret.mockResolvedValue({
      items: [
        snapshot,
        {
          ...snapshot,
          metadata: {
            ...snapshot.metadata,
            name: 'credentials-v0',
            annotations: { 'krypton.io/managed-by': 'krypton' },
          },
        },
        live,
        deniedLive,
        unmanaged,
      ],
    });
    const { GET } = await import('@/app/api/namespaces/[namespace]/secrets/route');
    const response = await GET(new Request(`${TEST_APP_URL}/api/namespaces/${namespace}/secrets`), {
      params: Promise.resolve({ namespace }),
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.canCreate).toBe(true);
    expect(body.secrets.map((secret: { name: string }) => secret.name)).toEqual([
      'credentials',
      ...(admin ? ['denied'] : []),
      ...(!managedOnly ? ['external'] : []),
    ]);
    expect(JSON.stringify(body)).not.toContain(historicalValue);
    // Non-admins read for authz; admins read once for the teams dropdown (cached, open policy).
    expect(core.readNamespacedConfigMap).toHaveBeenCalledTimes(1);
  });
});

describe('route authentication, namespace, and fallback-policy enforcement', () => {
  it.each(actions)('$label authenticates before any Kubernetes access', async (action) => {
    const mock = await mockKubernetes();
    const response = await invoke(action);
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Authentication required' });
    expect(mock.getCoreApi).not.toHaveBeenCalled();
    expectNoActions(mock);
  });

  it.each(actions)('$label enforces namespace scope before loading a live object', async (action) => {
    const mock = await mockKubernetes();
    await signIn();
    const response = await invoke(action, 'credentials', 'outside-scope');
    expect(response.status).toBe(403);
    expect(mock.getCoreApi).not.toHaveBeenCalled();
    expectNoActions(mock);
  });

  it.each(actions)('$label fails closed before side effects when fallback policy is unavailable', async (action) => {
    const mock = await mockKubernetes();
    await signIn();
    mock.core.readNamespacedSecret.mockResolvedValue({
      ...live,
      metadata: { ...live.metadata, annotations: { 'krypton.io/managed-by': 'krypton' } },
    });
    mock.core.readNamespacedConfigMap.mockRejectedValue(new ApiException(403, 'synthetic-private-error', {}, {}));
    const response = await invoke(action);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'Namespace access policy is unavailable' });
    expectNoActions(mock);
  });

  it('keeps restart opt-in even for admins', async () => {
    process.env.KRYPTON_RESTART_ENABLED = 'false';
    const mock = await mockKubernetes();
    await signIn(true);
    const response = await invoke(actions[5]);
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Restarting apps is disabled on this deployment' });
    expect(mock.getCoreApi).not.toHaveBeenCalled();
    expectNoActions(mock);
  });
});
