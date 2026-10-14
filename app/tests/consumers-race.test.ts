import type { V1PodTemplateSpec } from '@kubernetes/client-node';
import { describe, expect, it } from 'vitest';
import {
  consumerNamespace,
  consumerSecret,
  consumerTemplate,
  consumerUser,
  consumerWorkload,
  mockConsumers,
  consumerApiError,
} from './helpers/consumers';

async function restart() {
  const { restartConsumers } = await import('@/lib/consumers');
  return restartConsumers(consumerNamespace, consumerSecret, consumerUser);
}

type PatchOp = { op: string; path: string; value?: unknown };

function opsOf(body: unknown): PatchOp[] {
  expect(Array.isArray(body)).toBe(true);
  return body as PatchOp[];
}

/** Synthetic cluster state: the mock server applies the annotation only if both tests pass. */
function currentWorkload(uid: string, resourceVersion: string, template?: V1PodTemplateSpec) {
  return {
    uid,
    resourceVersion,
    template:
      template ??
      consumerTemplate({
        containers: [{ name: 'app', envFrom: [{ secretRef: { name: consumerSecret } }] }],
      }),
    annotations: {} as Record<string, string>,
  };
}

describe('inspected-revision binding', () => {
  it('rejects a replaced UID without touching the newer workload or retrying', async () => {
    const { apps } = await mockConsumers();
    const listed = consumerWorkload('web');
    listed.metadata!.uid = 'kry14-listed-uid';
    listed.metadata!.resourceVersion = 'kry14-rv-1';
    apps.listNamespacedDeployment.mockResolvedValue({ items: [listed] });
    // Same name, replaced identity (delete/recreate) after the list.
    const current = currentWorkload('kry14-replacement-uid', 'kry14-rv-2');
    apps.patchNamespacedDeployment.mockImplementation(async ({ body }) => {
      const ops = opsOf(body);
      const uid = ops.find((op) => op.path === '/metadata/uid')?.value;
      const rv = ops.find((op) => op.path === '/metadata/resourceVersion')?.value;
      if (uid !== current.uid || rv !== current.resourceVersion) throw consumerApiError(409);
      current.annotations['k8ston.io/restarted-at'] = 'applied';
      return {};
    });
    const result = await restart();
    expect(result).toMatchObject({
      status: 'failed',
      matched: 1,
      requested: [],
      failures: [{ kind: 'Deployment', name: 'web', code: 'conflict', httpStatus: 409 }],
    });
    expect(apps.patchNamespacedDeployment).toHaveBeenCalledTimes(1);
    expect(current.annotations).toEqual({});
    const sent = opsOf(apps.patchNamespacedDeployment.mock.calls[0][0].body);
    expect(sent[0]).toEqual({ op: 'test', path: '/metadata/uid', value: 'kry14-listed-uid' });
    expect(sent[1]).toEqual({ op: 'test', path: '/metadata/resourceVersion', value: 'kry14-rv-1' });
    expect(JSON.stringify(result)).not.toContain('kry14-listed-uid');
    expect(JSON.stringify(result)).not.toContain('kry14-replacement-uid');
  });

  it('rejects an in-flight revision change without restarting the edited workload', async () => {
    const { apps } = await mockConsumers();
    const listed = consumerWorkload('web');
    listed.metadata!.uid = 'kry14-stable-uid';
    listed.metadata!.resourceVersion = 'kry14-rv-1';
    apps.listNamespacedDeployment.mockResolvedValue({ items: [listed] });
    // Same object, edited after the list: the Secret reference is gone.
    const current = currentWorkload(
      'kry14-stable-uid',
      'kry14-rv-2',
      consumerTemplate({
        containers: [{ name: 'app', env: [{ name: 'OTHER', value: 'literal' }] }],
      }),
    );
    apps.patchNamespacedDeployment.mockImplementation(async ({ body }) => {
      const ops = opsOf(body);
      if (ops.find((op) => op.path === '/metadata/resourceVersion')?.value !== current.resourceVersion) {
        throw consumerApiError(409);
      }
      current.annotations['k8ston.io/restarted-at'] = 'applied';
      return {};
    });
    const result = await restart();
    expect(result).toMatchObject({
      status: 'failed',
      matched: 1,
      requested: [],
      failures: [{ kind: 'Deployment', name: 'web', code: 'conflict', httpStatus: 409 }],
    });
    expect(apps.patchNamespacedDeployment).toHaveBeenCalledTimes(1);
    expect(current.annotations).toEqual({});
  });

  it('treats a rejected precondition as truthful even when the server reports 422', async () => {
    const { apps } = await mockConsumers();
    apps.listNamespacedStatefulSet.mockResolvedValue({ items: [consumerWorkload('worker')] });
    apps.patchNamespacedStatefulSet.mockRejectedValue(consumerApiError(422));
    const result = await restart();
    expect(result).toMatchObject({
      status: 'failed',
      matched: 1,
      requested: [],
      failures: [{ kind: 'StatefulSet', name: 'worker', code: 'invalid_request', httpStatus: 422 }],
    });
    expect(apps.patchNamespacedStatefulSet).toHaveBeenCalledTimes(1);
  });

  it('never blind-retries a conflicted patch against the changed revision', async () => {
    const { apps } = await mockConsumers();
    apps.listNamespacedDaemonSet.mockResolvedValue({ items: [consumerWorkload('agent')] });
    let calls = 0;
    apps.patchNamespacedDaemonSet.mockImplementation(async () => {
      if (++calls === 1) throw consumerApiError(409);
      return {}; // A retry would hit the changed revision; it must never run.
    });
    const result = await restart();
    expect(calls).toBe(1);
    expect(result).toMatchObject({ status: 'failed', matched: 1, requested: [], discoveryFailures: [] });
    expect(result.failures).toEqual([
      { kind: 'DaemonSet', name: 'agent', code: 'conflict', httpStatus: 409, message: expect.any(String) },
    ]);
  });

  it('reports missing/malformed identity as incomplete targets without name-only patches', async () => {
    const { apps } = await mockConsumers();
    const noUid = consumerWorkload('no-uid');
    delete noUid.metadata!.uid;
    const noRv = consumerWorkload('no-rv');
    delete noRv.metadata!.resourceVersion;
    const blankUid = consumerWorkload('blank-uid');
    blankUid.metadata!.uid = '';
    const numericRv = consumerWorkload('numeric-rv');
    (numericRv.metadata as unknown as Record<string, unknown>).resourceVersion = 1001;
    const ok = consumerWorkload('ok');
    apps.listNamespacedDeployment.mockResolvedValue({ items: [noUid, noRv, blankUid, numericRv, ok] });
    const result = await restart();
    expect(apps.patchNamespacedDeployment.mock.calls.map(([args]) => args.name)).toEqual(['ok']);
    expect(result).toMatchObject({ status: 'partial', matched: 5, discoveryFailures: [] });
    expect(result.requested).toEqual([{ kind: 'Deployment', name: 'ok' }]);
    expect(result.failures).toEqual(
      ['blank-uid', 'no-rv', 'no-uid', 'numeric-rv'].map((name) => ({
        kind: 'Deployment',
        name,
        code: 'incomplete_list',
        httpStatus: 503,
        message: 'A matching workload has no usable UID/resourceVersion. No patch was attempted for this workload.',
      })),
    );
    expect(result.message).toContain('Rollout requested for 1 of 5 matched workloads. 4 patch requests failed.');
    expect(JSON.stringify(result)).not.toContain('synthetic-uid-ok');
  });

  it('reports malformed template metadata without patching', async () => {
    const { apps } = await mockConsumers();
    const secretSpec = { containers: [{ name: 'app', envFrom: [{ secretRef: { name: consumerSecret } }] }] };
    const badAnnotations = consumerWorkload('bad-annotations', {
      ...consumerTemplate(secretSpec),
      metadata: { annotations: 'not-an-object' as unknown as Record<string, string> },
    });
    const badMetadata = consumerWorkload('bad-metadata');
    (badMetadata.spec as unknown as Record<string, unknown>).template = {
      ...(badMetadata.spec!.template as object),
      metadata: 'not-an-object',
    };
    apps.listNamespacedDaemonSet.mockResolvedValue({ items: [badAnnotations, badMetadata] });
    const result = await restart();
    expect(apps.patchNamespacedDaemonSet).not.toHaveBeenCalled();
    expect(result).toMatchObject({ status: 'failed', matched: 2, requested: [], discoveryFailures: [] });
    expect(result.failures.map(({ name }) => name).sort()).toEqual(['bad-annotations', 'bad-metadata']);
    for (const failure of result.failures) expect(failure.code).toBe('incomplete_list');
  });

  it('shapes the annotation add by the inspected template metadata', async () => {
    const { apps } = await mockConsumers();
    const bodies: unknown[] = [];
    apps.patchNamespacedDeployment.mockImplementation(async ({ body }) => {
      bodies.push(body);
      return {};
    });
    const secretSpec = { containers: [{ name: 'app', envFrom: [{ secretRef: { name: consumerSecret } }] }] };
    apps.listNamespacedDeployment.mockResolvedValue({
      items: [
        consumerWorkload('no-meta'),
        consumerWorkload('meta-no-ann', { ...consumerTemplate(secretSpec), metadata: { labels: { keep: 'me' } } }),
        consumerWorkload('with-ann', {
          ...consumerTemplate(secretSpec),
          metadata: { annotations: { existing: 'keep', 'k8ston.io/restarted-at': 'old' } },
        }),
      ],
    });
    const result = await restart();
    expect(result).toMatchObject({ status: 'requested', matched: 3, failures: [], discoveryFailures: [] });
    expect(bodies).toHaveLength(3);
    const byName = new Map(apps.patchNamespacedDeployment.mock.calls.map(([args], i) => [args.name, opsOf(bodies[i])]));
    for (const [name, ops] of byName) {
      expect(ops[0]).toEqual({ op: 'test', path: '/metadata/uid', value: `synthetic-uid-${name}` });
      expect(ops[1]).toEqual({ op: 'test', path: '/metadata/resourceVersion', value: '1001' });
      expect(ops).toHaveLength(3);
    }
    expect(byName.get('no-meta')![2]).toEqual({
      op: 'add',
      path: '/spec/template/metadata',
      value: {
        annotations: {
          'k8ston.io/restarted-at': expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        },
      },
    });
    expect(byName.get('meta-no-ann')![2]).toEqual({
      op: 'add',
      path: '/spec/template/metadata/annotations',
      value: {
        'k8ston.io/restarted-at': expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      },
    });
    expect(byName.get('with-ann')![2]).toEqual({
      op: 'add',
      path: '/spec/template/metadata/annotations/k8ston.io~1restarted-at',
      value: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    });
  });

  it('keeps native workload identity out of the public result', async () => {
    const { apps } = await mockConsumers();
    const listed = consumerWorkload('web');
    listed.metadata!.uid = 'kry14-internal-uid';
    listed.metadata!.resourceVersion = 'kry14-internal-rv';
    apps.listNamespacedDeployment.mockResolvedValue({ items: [listed] });
    const result = await restart();
    expect(result).toMatchObject({ status: 'requested', matched: 1 });
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('kry14-internal-uid');
    expect(serialized).not.toContain('kry14-internal-rv');
    expect(result.requested).toEqual([{ kind: 'Deployment', name: 'web' }]);
  });
});
