import type { V1PodSpec, V1PodTemplateSpec } from '@kubernetes/client-node';
import { describe, expect, it, vi } from 'vitest';
import {
  consumerApiError,
  consumerNamespace,
  consumerSecret,
  consumerTemplate,
  consumerUser,
  consumerWorkload,
  mockConsumers,
  privateConsumerMarker,
  statefulConsumer,
} from './helpers/consumers';

async function restart() {
  const { restartConsumers } = await import('@/lib/consumers');
  return restartConsumers(consumerNamespace, consumerSecret, consumerUser);
}

const references: Array<{ label: string; spec: (name: string) => Partial<V1PodSpec> }> = [
  {
    label: 'container env',
    spec: (name) => ({
      containers: [
        { name: 'app', env: [{ name: 'VALUE', valueFrom: { secretKeyRef: { key: 'value', name, optional: true } } }] },
      ],
    }),
  },
  {
    label: 'container envFrom',
    spec: (name) => ({
      containers: [{ name: 'app', envFrom: [{ prefix: 'PREFIX_', secretRef: { name, optional: true } }] }],
    }),
  },
  {
    label: 'init env',
    spec: (name) => ({
      initContainers: [{ name: 'init', env: [{ name: 'VALUE', valueFrom: { secretKeyRef: { key: 'value', name } } }] }],
    }),
  },
  {
    label: 'init envFrom',
    spec: (name) => ({ initContainers: [{ name: 'init', envFrom: [{ secretRef: { name } }] }] }),
  },
  {
    label: 'ephemeral env',
    spec: (name) => ({
      ephemeralContainers: [
        { name: 'debug', env: [{ name: 'VALUE', valueFrom: { secretKeyRef: { key: 'value', name } } }] },
      ],
    }),
  },
  {
    label: 'ephemeral envFrom',
    spec: (name) => ({ ephemeralContainers: [{ name: 'debug', envFrom: [{ secretRef: { name } }] }] }),
  },
  {
    label: 'Secret volume',
    spec: (name) => ({
      volumes: [
        {
          name: 'mounted',
          secret: { secretName: name, optional: true, items: [{ key: 'value', path: 'mounted-value' }] },
        },
      ],
    }),
  },
  {
    label: 'projected-only Secret volume',
    spec: (name) => ({
      volumes: [
        {
          name: 'projected',
          projected: { sources: [{ configMap: { name: 'unrelated' } }, { secret: { name, optional: true } }] },
        },
      ],
    }),
  },
  { label: 'imagePullSecrets', spec: (name) => ({ imagePullSecrets: [{ name: 'other-registry' }, { name }] }) },
];

/** Reorder serialized manifests, without knowing anything about Secret fields. */
function reverseProperties<T>(value: T): T {
  if (Array.isArray(value)) return value.map(reverseProperties) as T;
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .reverse()
        .map(([key, entry]) => [key, reverseProperties(entry)]),
    ) as T;
  return value;
}

describe.each([false, true])('exact manifest references (reversed properties=%s)', (reversed) => {
  it.each(references)('requests only the exact $label consumer', async ({ spec }) => {
    const { apps } = await mockConsumers();
    const manifests = [
      consumerWorkload('exact', consumerTemplate(spec(consumerSecret))),
      consumerWorkload('longer-name', consumerTemplate(spec(`${consumerSecret}-old`))),
      consumerWorkload('different-name', consumerTemplate(spec('different'))),
    ];
    apps.listNamespacedDeployment.mockResolvedValue({ items: reversed ? reverseProperties(manifests) : manifests });
    const result = await restart();
    expect(result).toMatchObject({
      status: 'requested',
      matched: 1,
      requested: [{ kind: 'Deployment', name: 'exact' }],
      failures: [],
      discoveryFailures: [],
    });
    expect(apps.patchNamespacedDeployment.mock.calls.map(([args]) => args.name)).toEqual(['exact']);
    expect(apps.patchNamespacedStatefulSet).not.toHaveBeenCalled();
    expect(apps.patchNamespacedDaemonSet).not.toHaveBeenCalled();
  });

  it('does not infer Secret use from names, values, ConfigMaps, or serialized lookalikes', async () => {
    const { apps } = await mockConsumers();
    // The unrelated key-first Secret ref activated the old JSON fallback. None
    // of the otherwise exact strings below is a reference to the target Secret.
    const unrelatedEnv = [{ name: 'UNRELATED', valueFrom: { secretKeyRef: { key: 'value', name: 'different' } } }];
    const decoys: V1PodTemplateSpec[] = [
      consumerTemplate({ containers: [{ name: consumerSecret, env: unrelatedEnv }] }),
      consumerTemplate({ containers: [{ name: 'app', env: unrelatedEnv, args: [consumerSecret] }] }),
      consumerTemplate({
        containers: [{ name: 'app', env: [...unrelatedEnv, { name: 'LITERAL', value: consumerSecret }] }],
      }),
      consumerTemplate({
        containers: [{ name: 'app', env: unrelatedEnv, envFrom: [{ configMapRef: { name: consumerSecret } }] }],
      }),
      consumerTemplate({
        containers: [
          {
            name: 'app',
            env: [
              ...unrelatedEnv,
              { name: 'CONFIG', valueFrom: { configMapKeyRef: { key: 'value', name: consumerSecret } } },
            ],
          },
        ],
      }),
      consumerTemplate({
        containers: [{ name: 'app', env: unrelatedEnv }],
        volumes: [{ name: consumerSecret, configMap: { name: consumerSecret } }],
      }),
      consumerTemplate({
        containers: [{ name: 'app', env: unrelatedEnv }],
        volumes: [{ name: 'projected', projected: { sources: [{ configMap: { name: consumerSecret } }] } }],
      }),
      consumerTemplate({ containers: [{ name: 'app', env: unrelatedEnv }], serviceAccountName: consumerSecret }),
      consumerTemplate({
        containers: [{ name: 'app', env: [{ name: 'JSON', value: `{"secretName":"${consumerSecret}"}` }] }],
      }),
      {
        ...consumerTemplate(),
        metadata: { name: consumerSecret, annotations: { example: `{"secretName":"${consumerSecret}"}` } },
      },
    ];
    const items = decoys.map((template, i) => consumerWorkload(`decoy-${i}`, template));
    apps.listNamespacedDeployment.mockResolvedValue({ items: reversed ? reverseProperties(items) : items });
    const result = await restart();
    expect(result).toMatchObject({
      status: 'no_targets',
      matched: 0,
      requested: [],
      failures: [],
      discoveryFailures: [],
    });
    expect(result.message).toBe('No matching workloads found. No rollout requested.');
    expect(apps.patchNamespacedDeployment).not.toHaveBeenCalled();
  });
});

it('patches each kind once per workload despite multiple references and duplicate inventory entries', async () => {
  const { apps } = await mockConsumers();
  const template = consumerTemplate({
    containers: [
      { name: 'app', envFrom: [{ secretRef: { name: consumerSecret } }, { secretRef: { name: consumerSecret } }] },
    ],
    volumes: [{ name: 'also-mounted', secret: { secretName: consumerSecret } }],
  });
  apps.listNamespacedDeployment.mockResolvedValue({
    items: [consumerWorkload('same-name', template), consumerWorkload('same-name', template)],
  });
  apps.listNamespacedStatefulSet.mockResolvedValue({ items: [statefulConsumer('same-name', template)] });
  apps.listNamespacedDaemonSet.mockResolvedValue({ items: [consumerWorkload('same-name', template)] });
  const result = await restart();
  expect(result.requested).toEqual([
    { kind: 'Deployment', name: 'same-name' },
    { kind: 'StatefulSet', name: 'same-name' },
    { kind: 'DaemonSet', name: 'same-name' },
  ]);
  expect(result.matched).toBe(3);
  for (const patch of [
    apps.patchNamespacedDeployment,
    apps.patchNamespacedStatefulSet,
    apps.patchNamespacedDaemonSet,
  ]) {
    expect(patch).toHaveBeenCalledTimes(1);
    expect(patch.mock.calls[0][0]).toEqual({
      namespace: consumerNamespace,
      name: 'same-name',
      body: [
        { op: 'test', path: '/metadata/uid', value: 'synthetic-uid-same-name' },
        { op: 'test', path: '/metadata/resourceVersion', value: '1001' },
        {
          op: 'add',
          path: '/spec/template/metadata',
          value: {
            annotations: {
              'k8ston.io/restarted-at': expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
            },
          },
        },
      ],
    });
  }
});

it.each([
  [401, 'unauthenticated'],
  [403, 'forbidden'],
  [404, 'not_found'],
  [409, 'conflict'],
  [400, 'invalid_request'],
  [422, 'invalid_request'],
  [429, 'rate_limited'],
  [500, 'unavailable'],
  [503, 'unavailable'],
] as const)('retains only acknowledged successes and safely classifies HTTP %i', async (status, code) => {
  const { apps } = await mockConsumers();
  apps.listNamespacedDeployment.mockResolvedValue({
    items: [consumerWorkload('rejected'), consumerWorkload('accepted')],
  });
  apps.patchNamespacedDeployment.mockImplementation(async ({ name }) => {
    if (name === 'rejected') throw consumerApiError(status);
    return {};
  });
  const result = await restart();
  expect(result).toMatchObject({
    status: 'partial',
    matched: 2,
    requested: [{ kind: 'Deployment', name: 'accepted' }],
    discoveryFailures: [],
  });
  expect(result.failures).toEqual([
    { kind: 'Deployment', name: 'rejected', code, httpStatus: status, message: expect.any(String) },
  ]);
  expect(JSON.stringify(result)).not.toContain(privateConsumerMarker);
});

it('reports an unacknowledged transport outcome without claiming the patch did not happen', async () => {
  const { apps } = await mockConsumers();
  apps.listNamespacedDeployment.mockResolvedValue({ items: [consumerWorkload('unknown')] });
  apps.patchNamespacedDeployment.mockRejectedValue(
    Object.assign(new Error(privateConsumerMarker), { code: 'ECONNRESET', headers: privateConsumerMarker }),
  );
  const result = await restart();
  expect(result).toMatchObject({
    status: 'failed',
    matched: 1,
    requested: [],
    failures: [{ code: 'unconfirmed', name: 'unknown' }],
  });
  expect(result.message).toContain('No rollout requests were confirmed');
  expect(result.failures[0].message).toContain('Check resource state before retrying');
  expect(result.failures[0]).not.toHaveProperty('httpStatus');
  expect(JSON.stringify(result)).not.toContain(privateConsumerMarker);
});

it.each(['continuation', 'missing items', 'missing matching name'] as const)(
  'treats %s as incomplete discovery before mutating that kind',
  async (problem) => {
    const { apps } = await mockConsumers();
    const workload = consumerWorkload('hidden-by-incomplete-list');
    if (problem === 'missing matching name') delete workload.metadata!.name;
    apps.listNamespacedDeployment.mockResolvedValue({
      items: problem === 'missing items' ? undefined! : [workload],
      ...(problem === 'continuation' ? { metadata: { _continue: 'synthetic-continuation' } } : {}),
    });
    apps.listNamespacedDaemonSet.mockResolvedValue({ items: [consumerWorkload('known')] });
    const result = await restart();
    expect(result).toMatchObject({
      status: 'partial',
      matched: 1,
      requested: [{ kind: 'DaemonSet', name: 'known' }],
      failures: [],
      discoveryFailures: [{ kind: 'Deployment', code: 'incomplete_list' }],
    });
    expect(apps.patchNamespacedDeployment).not.toHaveBeenCalled();
    expect(result.message).toContain('Discovery incomplete');
  },
);

it('limits delayed patches to four in flight across all kinds and drains the queue after failures', async () => {
  const { apps } = await mockConsumers();
  apps.listNamespacedDeployment.mockResolvedValue({
    items: Array.from({ length: 6 }, (_, i) => consumerWorkload(`deploy-${i}`)),
  });
  apps.listNamespacedStatefulSet.mockResolvedValue({
    items: Array.from({ length: 6 }, (_, i) => statefulConsumer(`stateful-${i}`)),
  });
  apps.listNamespacedDaemonSet.mockResolvedValue({
    items: Array.from({ length: 6 }, (_, i) => consumerWorkload(`daemon-${i}`)),
  });
  const { restartConsumers } = await import('@/lib/consumers');
  vi.useFakeTimers();
  let active = 0;
  let peak = 0;
  const started: string[] = [];
  const acknowledged: string[] = [];
  const rejected = new Set(['deploy-1', 'stateful-2', 'daemon-5']);
  async function delayedPatch({ name }: { name: string }) {
    started.push(name);
    peak = Math.max(peak, ++active);
    await new Promise<void>((resolve) => setTimeout(resolve, 25));
    active--;
    if (rejected.has(name)) throw consumerApiError(403);
    acknowledged.push(name);
    return {};
  }
  apps.patchNamespacedDeployment.mockImplementation(delayedPatch);
  apps.patchNamespacedStatefulSet.mockImplementation(delayedPatch);
  apps.patchNamespacedDaemonSet.mockImplementation(delayedPatch);
  let finished = false;
  const operation = restartConsumers(consumerNamespace, consumerSecret, consumerUser).then((result) => {
    finished = true;
    return result;
  });
  await vi.advanceTimersByTimeAsync(0);
  expect(started).toHaveLength(4);
  expect(active).toBe(4);
  await vi.advanceTimersByTimeAsync(24);
  expect(started).toHaveLength(4);
  expect(acknowledged).toHaveLength(0);
  expect(finished).toBe(false);
  await vi.advanceTimersByTimeAsync(1);
  expect(started).toHaveLength(8);
  expect(active).toBe(4);
  expect(finished).toBe(false);
  await vi.runAllTimersAsync();
  const result = await operation;
  expect(started).toHaveLength(18);
  expect(new Set(started).size).toBe(18);
  expect(peak).toBe(4);
  expect(active).toBe(0);
  expect(result).toMatchObject({ status: 'partial', matched: 18, discoveryFailures: [] });
  expect(result.requested.map(({ name }) => name).sort()).toEqual(acknowledged.sort());
  expect(result.requested).toHaveLength(15);
  expect(result.failures.map(({ name }) => name).sort()).toEqual([...rejected].sort());
});
