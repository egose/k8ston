import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RestartResult } from '@/lib/consumers';
import { TEST_APP_URL } from './helpers/environment';
import {
  consumerApiError,
  consumerNamespace as namespace,
  consumerSecret as name,
  consumerUser as user,
  consumerWorkload,
  mockConsumers,
  privateConsumerMarker,
  statefulConsumer,
} from './helpers/consumers';

const kinds = ['Deployment', 'StatefulSet', 'DaemonSet'] as const;

async function setup(signedIn = true) {
  const mock = await mockConsumers();
  mock.core.readNamespacedSecret.mockResolvedValue({
    metadata: {
      namespace,
      name,
      annotations: { 'k8ston.io/managed-by': 'k8ston', 'k8ston.io/allowed-users': user.email },
    },
    data: { credential: Buffer.from(privateConsumerMarker).toString('base64') },
  });
  if (signedIn) {
    const auth = await import('@/lib/auth');
    await auth.setSessionCookie(await auth.createSessionToken(user));
  }
  return mock;
}

async function invoke() {
  const { POST } = await import('@/app/api/namespaces/[namespace]/secrets/[name]/restart-consumers/route');
  const response = await POST(
    new Request(`${TEST_APP_URL}/api/namespaces/${namespace}/secrets/${name}/restart-consumers`, { method: 'POST' }),
    {
      params: Promise.resolve({ namespace, name }),
    },
  );
  expect(response.headers.get('cache-control')).toBe('no-store');
  return response;
}

function allKinds(mock: Awaited<ReturnType<typeof setup>>) {
  mock.apps.listNamespacedDeployment.mockResolvedValue({ items: [consumerWorkload('web')] });
  mock.apps.listNamespacedStatefulSet.mockResolvedValue({ items: [statefulConsumer('database')] });
  mock.apps.listNamespacedDaemonSet.mockResolvedValue({ items: [consumerWorkload('agent')] });
}

function audit() {
  const events = vi.mocked(console.log).mock.calls.map(([value]) => JSON.parse(value));
  expect(events).toHaveLength(1);
  expect(events[0]).toMatchObject({ action: 'secret.restart', user: user.email, namespace, name });
  return { ...events[0], detail: events[0].detail ? JSON.parse(events[0].detail) : undefined };
}

function expectSanitized(body: unknown) {
  const serialized = JSON.stringify([
    body,
    vi.mocked(console.log).mock.calls,
    vi.mocked(console.warn).mock.calls,
    vi.mocked(console.error).mock.calls,
  ]);
  expect(serialized).not.toContain(privateConsumerMarker);
  expect(serialized).not.toContain(Buffer.from(privateConsumerMarker).toString('base64'));
  expect(serialized).not.toContain('authorization');
}

beforeEach(() => {
  process.env.K8STON_RESTART_ENABLED = 'true';
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('result and audit contracts', () => {
  it('reports acknowledged requests with 200 without claiming readiness or completion', async () => {
    const mock = await setup();
    allKinds(mock);
    const response = await invoke();
    const body: RestartResult = await response.json();
    expect(response.status).toBe(200);
    expect(body).toMatchObject({ status: 'requested', matched: 3, failures: [], discoveryFailures: [] });
    expect(body.requested).toEqual([
      { kind: 'Deployment', name: 'web' },
      { kind: 'StatefulSet', name: 'database' },
      { kind: 'DaemonSet', name: 'agent' },
    ]);
    expect(body.message).toBe('Rollout requested for 3 workloads.');
    expect(body.note).toContain('Rollout completion, readiness, and credential uptake are not verified');
    expect(audit()).toMatchObject({
      result: 'allow',
      detail: { status: 'requested', matched: 3, requested: body.requested, failures: [] },
    });
    expectSanitized(body);
  });

  it('returns 207 and an error audit for mixed patch outcomes', async () => {
    const mock = await setup();
    allKinds(mock);
    mock.apps.patchNamespacedStatefulSet.mockRejectedValue(consumerApiError(403));
    const response = await invoke();
    const body: RestartResult = await response.json();
    expect(response.status).toBe(207);
    expect(body).toMatchObject({
      status: 'partial',
      matched: 3,
      discoveryFailures: [],
      failures: [{ kind: 'StatefulSet', name: 'database', code: 'forbidden', httpStatus: 403 }],
    });
    expect(body.requested).toEqual([
      { kind: 'Deployment', name: 'web' },
      { kind: 'DaemonSet', name: 'agent' },
    ]);
    expect(body.message).toContain('Rollout requested for 2 of 3 matched workloads. 1 patch request failed.');
    expect(audit()).toMatchObject({
      result: 'error',
      detail: { status: 'partial', requested: body.requested, failures: body.failures },
    });
    expectSanitized(body);
  });

  it('returns 503 and retains every workload failure when no patch is acknowledged', async () => {
    const mock = await setup();
    allKinds(mock);
    for (const patch of [
      mock.apps.patchNamespacedDeployment,
      mock.apps.patchNamespacedStatefulSet,
      mock.apps.patchNamespacedDaemonSet,
    ]) {
      patch.mockRejectedValue(consumerApiError(500));
    }
    const response = await invoke();
    const body = await response.json();
    expect(response.status).toBe(503);
    expect(body).toMatchObject({
      status: 'failed',
      matched: 3,
      requested: [],
      discoveryFailures: [],
      error: 'No rollout requests were confirmed. 3 patch requests failed.',
    });
    expect(body.failures).toHaveLength(3);
    expect(audit()).toMatchObject({
      result: 'error',
      detail: { status: 'failed', requested: [], failures: body.failures },
    });
    expectSanitized(body);
  });

  it('reports no_targets only after all three inventories succeed', async () => {
    const mock = await setup();
    const response = await invoke();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      status: 'no_targets',
      matched: 0,
      requested: [],
      failures: [],
      discoveryFailures: [],
    });
    for (const list of [
      mock.apps.listNamespacedDeployment,
      mock.apps.listNamespacedStatefulSet,
      mock.apps.listNamespacedDaemonSet,
    ])
      expect(list).toHaveBeenCalledTimes(1);
    for (const patch of [
      mock.apps.patchNamespacedDeployment,
      mock.apps.patchNamespacedStatefulSet,
      mock.apps.patchNamespacedDaemonSet,
    ])
      expect(patch).not.toHaveBeenCalled();
    expect(audit()).toMatchObject({ result: 'allow', detail: { status: 'no_targets', matched: 0, requested: [] } });
    expectSanitized(body);
  });
});

describe.each(kinds)('%s inventory failure', (kind) => {
  it.each([false, true])(
    'cannot become no_targets or full success (other kinds have consumers=%s)',
    async (hasConsumers) => {
      const mock = await setup();
      if (hasConsumers) allKinds(mock);
      const list = {
        Deployment: mock.apps.listNamespacedDeployment,
        StatefulSet: mock.apps.listNamespacedStatefulSet,
        DaemonSet: mock.apps.listNamespacedDaemonSet,
      }[kind];
      list.mockRejectedValue(consumerApiError(403));
      const response = await invoke();
      const body = await response.json();
      expect(response.status).toBe(hasConsumers ? 207 : 503);
      expect(body).toMatchObject({
        status: hasConsumers ? 'partial' : 'failed',
        matched: hasConsumers ? 2 : 0,
        failures: [],
        discoveryFailures: [{ kind, code: 'forbidden', httpStatus: 403 }],
      });
      expect(body.requested).toHaveLength(hasConsumers ? 2 : 0);
      expect(body.requested.some((workload: { kind: string }) => workload.kind === kind)).toBe(false);
      expect(body.message).toContain('Discovery incomplete: 1 workload kind could not be listed');
      const patch = {
        Deployment: mock.apps.patchNamespacedDeployment,
        StatefulSet: mock.apps.patchNamespacedStatefulSet,
        DaemonSet: mock.apps.patchNamespacedDaemonSet,
      }[kind];
      expect(patch).not.toHaveBeenCalled();
      expect(audit()).toMatchObject({
        result: 'error',
        detail: {
          status: hasConsumers ? 'partial' : 'failed',
          requested: body.requested,
          discoveryFailures: body.discoveryFailures,
        },
      });
      expectSanitized(body);
    },
  );
});

it('reports every failed list when all discovery fails, with no mutation', async () => {
  const mock = await setup();
  for (const list of [
    mock.apps.listNamespacedDeployment,
    mock.apps.listNamespacedStatefulSet,
    mock.apps.listNamespacedDaemonSet,
  ])
    list.mockRejectedValue(consumerApiError(503));
  const response = await invoke();
  const body = await response.json();
  expect(response.status).toBe(503);
  expect(body).toMatchObject({ status: 'failed', matched: 0, requested: [], failures: [] });
  expect(body.discoveryFailures.map(({ kind }: { kind: string }) => kind)).toEqual(kinds);
  for (const patch of [
    mock.apps.patchNamespacedDeployment,
    mock.apps.patchNamespacedStatefulSet,
    mock.apps.patchNamespacedDaemonSet,
  ])
    expect(patch).not.toHaveBeenCalled();
  expect(audit()).toMatchObject({ result: 'error', detail: { discoveryFailures: body.discoveryFailures } });
  expectSanitized(body);
});

it('waits for discovery to settle, then preserves both list and patch failures', async () => {
  const mock = await setup();
  allKinds(mock);
  let rejectList!: (error: unknown) => void;
  mock.apps.listNamespacedStatefulSet.mockReturnValue(
    new Promise((_, reject) => {
      rejectList = reject;
    }),
  );
  mock.apps.patchNamespacedDeployment.mockRejectedValue(consumerApiError(409));
  mock.apps.patchNamespacedDaemonSet.mockRejectedValue(consumerApiError(429));
  const operation = invoke();
  await vi.waitFor(() => expect(mock.apps.listNamespacedDaemonSet).toHaveBeenCalled());
  for (const patch of [
    mock.apps.patchNamespacedDeployment,
    mock.apps.patchNamespacedStatefulSet,
    mock.apps.patchNamespacedDaemonSet,
  ])
    expect(patch).not.toHaveBeenCalled();
  rejectList(consumerApiError(403));
  const response = await operation;
  const body = await response.json();
  expect(response.status).toBe(503);
  expect(body).toMatchObject({
    status: 'failed',
    matched: 2,
    requested: [],
    discoveryFailures: [{ kind: 'StatefulSet' }],
    failures: [
      { kind: 'Deployment', code: 'conflict' },
      { kind: 'DaemonSet', code: 'rate_limited' },
    ],
  });
  expect(audit()).toMatchObject({
    result: 'error',
    detail: { requested: [], discoveryFailures: body.discoveryFailures, failures: body.failures },
  });
  expectSanitized(body);
});

it.each([undefined, 'false'])('enforces opt-in before Kubernetes access (flag=%s)', async (flag) => {
  if (flag === undefined) delete process.env.K8STON_RESTART_ENABLED;
  else process.env.K8STON_RESTART_ENABLED = flag;
  const mock = await setup();
  const response = await invoke();
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({ error: 'Restarting apps is disabled on this deployment' });
  expect(mock.getCoreApi).not.toHaveBeenCalled();
  expect(mock.getAppsApi).not.toHaveBeenCalled();
  expect(audit().result).toBe('deny');
});

it('requires a session before workload discovery', async () => {
  const mock = await setup(false);
  const response = await invoke();
  expect(response.status).toBe(401);
  expect(await response.json()).toEqual({ error: 'Authentication required' });
  expect(mock.getCoreApi).not.toHaveBeenCalled();
  expect(mock.getAppsApi).not.toHaveBeenCalled();
});

it('denies a revoked live ACL before workload discovery', async () => {
  const mock = await setup();
  mock.core.readNamespacedSecret.mockResolvedValue({
    metadata: {
      annotations: {
        'k8ston.io/managed-by': 'k8ston',
        'k8ston.io/allowed-users': 'new-owner@example.test',
      },
    },
  });
  const response = await invoke();
  expect(response.status).toBe(403);
  expect(mock.getAppsApi).not.toHaveBeenCalled();
  expect(audit().result).toBe('deny');
});

it.each([403, 500])('sanitizes an initial live-Secret API failure (%i) before discovery', async (status) => {
  const mock = await setup();
  mock.core.readNamespacedSecret.mockRejectedValue(consumerApiError(status));
  const response = await invoke();
  const body = await response.json();
  expect(response.status).toBe(status);
  expect(body).toEqual({ error: expect.any(String) });
  expect(mock.getAppsApi).not.toHaveBeenCalled();
  expectSanitized(body);
});

it('sanitizes and audits client preparation failures without inventing a discovery result', async () => {
  const mock = await setup();
  mock.getAppsApi.mockImplementation(() => {
    throw new Error(privateConsumerMarker);
  });
  const response = await invoke();
  const body = await response.json();
  expect(response.status).toBe(500);
  expect(body).toEqual({ error: expect.any(String) });
  expect(audit()).toMatchObject({ result: 'error', detail: { stage: 'prepare', code: 'unconfirmed' } });
  expectSanitized(body);
});
