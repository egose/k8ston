import type { V1DaemonSet, V1Deployment, V1PodTemplateSpec, V1StatefulSet } from '@kubernetes/client-node';
import type { SessionUser } from './auth';
import { getAppsApi, jsonPatchOptions, requestOptions } from './k8s';
import { kubernetesFailure } from './errors';
import { COLLECTION_LIMITS, CollectionReadError, readK8sCollection } from './k8s-list';

export type ConsumerKind = 'Deployment' | 'StatefulSet' | 'DaemonSet';

export interface ConsumerWorkload {
  kind: ConsumerKind;
  name: string;
}

export interface ConsumerFailure {
  code:
    | 'unauthenticated'
    | 'forbidden'
    | 'not_found'
    | 'conflict'
    | 'invalid_request'
    | 'rate_limited'
    | 'unavailable'
    | 'unconfirmed'
    | 'incomplete_list';
  /** Fixed application guidance, never a Kubernetes message, body, or header. */
  message: string;
  httpStatus?: number;
}

/** The same metadata-only result is returned for HTTP 200, 207, and 503 attempts. */
export interface RestartResult {
  status: 'requested' | 'no_targets' | 'partial' | 'failed';
  /** Known matches only; not a namespace-wide total when discovery failed. */
  matched: number;
  /** Only patches acknowledged by Kubernetes, not completed/healthy rollouts. */
  requested: ConsumerWorkload[];
  failures: Array<ConsumerWorkload & ConsumerFailure>;
  /** No workloads of these kinds were patched; their inventory is unknown. */
  discoveryFailures: Array<{ kind: ConsumerKind } & ConsumerFailure>;
  message: string;
  note: string;
}

// Per invocation, across all three kinds. No request-global user/client state.
const PATCH_CONCURRENCY = 4;

/** Only explicit, namespace-local Secret references in the workload template. */
function templateReferencesSecret(template: V1PodTemplateSpec | undefined, secretName: string): boolean {
  const spec = template?.spec;
  if (!spec) return false;
  for (const container of [
    ...(spec.containers ?? []),
    ...(spec.initContainers ?? []),
    ...(spec.ephemeralContainers ?? []),
  ]) {
    if (
      container.env?.some((env) => env.valueFrom?.secretKeyRef?.name === secretName) ||
      container.envFrom?.some((env) => env.secretRef?.name === secretName)
    )
      return true;
  }
  return !!(
    spec.volumes?.some(
      (volume) =>
        volume.secret?.secretName === secretName ||
        volume.projected?.sources?.some((source) => source.secret?.name === secretName),
    ) || spec.imagePullSecrets?.some((secret) => secret.name === secretName)
  );
}

/** Preserve the typed attempt result while sharing the safe upstream classifier. */
export function consumerRequestFailure(error: unknown): ConsumerFailure {
  if (error instanceof CollectionReadError) {
    return { code: 'incomplete_list', message: error.message, httpStatus: 503 };
  }
  return kubernetesFailure(error);
}

type Workload = V1Deployment | V1StatefulSet | V1DaemonSet;

/** Inspected revision carried with each target; never exposed in the result. */
interface RestartTarget {
  kind: ConsumerKind;
  name: string;
  uid: string;
  resourceVersion: string;
  hasMetadata: boolean;
  hasAnnotations: boolean;
}

interface ConsumerSource {
  kind: ConsumerKind;
  list: () => Promise<Workload[]>;
  patch: (name: string, body: unknown) => Promise<unknown>;
}

const RESTART_ANNOTATION = 'k8ston.io/restarted-at';
// JSON Pointer escape (`~1` for `/`) for the annotation key above.
const RESTART_POINTER = 'k8ston.io~1restarted-at';

/**
 * RFC 6902 patch bound to the inspected revision. The API server evaluates
 * operations in order, so a UID replacement or any revision change (including
 * reference removal) fails a `test` before the annotation mutation runs.
 * Strategic-merge bodies have no test semantics and cannot express this.
 * The annotation `add` is shaped by the inspected template: `add` replaces an
 * existing leaf but requires its parent object to exist. A concurrent metadata
 * change alters the revision, so the earlier `test` already failed in that case.
 */
function restartPatch(target: RestartTarget, timestamp: string): Array<Record<string, unknown>> {
  const patch: Array<Record<string, unknown>> = [
    { op: 'test', path: '/metadata/uid', value: target.uid },
    { op: 'test', path: '/metadata/resourceVersion', value: target.resourceVersion },
  ];
  if (target.hasAnnotations) {
    patch.push({ op: 'add', path: `/spec/template/metadata/annotations/${RESTART_POINTER}`, value: timestamp });
  } else if (target.hasMetadata) {
    patch.push({ op: 'add', path: '/spec/template/metadata/annotations', value: { [RESTART_ANNOTATION]: timestamp } });
  } else {
    patch.push({
      op: 'add',
      path: '/spec/template/metadata',
      value: { annotations: { [RESTART_ANNOTATION]: timestamp } },
    });
  }
  return patch;
}

/** Call only after feature-flag, namespace, and current live-Secret authorization. */
export async function restartConsumers(
  namespace: string,
  secretName: string,
  user: SessionUser,
): Promise<RestartResult> {
  const apps = getAppsApi();
  const listOpts = requestOptions(user);
  const patchOpts = jsonPatchOptions(user);
  const timestamp = new Date().toISOString();
  // All pages must finish before any mutation. Each kind has its own aggregate
  // bound and failure isolation; selectors/options are retained on every page.
  const sources: ConsumerSource[] = [
    {
      kind: 'Deployment',
      list: () =>
        readK8sCollection(
          (page) => apps.listNamespacedDeployment({ namespace, ...page }, listOpts),
          COLLECTION_LIMITS.workloads,
          (workload) => workload,
        ),
      patch: (name, body) => apps.patchNamespacedDeployment({ namespace, name, body }, patchOpts),
    },
    {
      kind: 'StatefulSet',
      list: () =>
        readK8sCollection(
          (page) => apps.listNamespacedStatefulSet({ namespace, ...page }, listOpts),
          COLLECTION_LIMITS.workloads,
          (workload) => workload,
        ),
      patch: (name, body) => apps.patchNamespacedStatefulSet({ namespace, name, body }, patchOpts),
    },
    {
      kind: 'DaemonSet',
      list: () =>
        readK8sCollection(
          (page) => apps.listNamespacedDaemonSet({ namespace, ...page }, listOpts),
          COLLECTION_LIMITS.workloads,
          (workload) => workload,
        ),
      patch: (name, body) => apps.patchNamespacedDaemonSet({ namespace, name, body }, patchOpts),
    },
  ];
  const discoveries = await Promise.all(
    sources.map(async (source) => {
      try {
        const list = await source.list();
        const matches = list.filter((workload) => templateReferencesSecret(workload.spec?.template, secretName));
        if (matches.some((workload) => !workload.metadata?.name)) {
          return {
            source,
            targets: [],
            identityFailures: [],
            failure: {
              code: 'incomplete_list' as const,
              message: 'A matching workload had no name. No workloads of this kind were patched.',
            },
          };
        }
        const seen = new Map<string, RestartTarget>();
        const targets: RestartTarget[] = [];
        const identityFailures: Array<ConsumerWorkload & ConsumerFailure> = [];
        for (const workload of matches) {
          const name = workload.metadata!.name!;
          const failIdentity = () =>
            identityFailures.push({
              kind: source.kind,
              name,
              code: 'incomplete_list',
              httpStatus: 503,
              message:
                'A matching workload has no usable UID/resourceVersion. No patch was attempted for this workload.',
            });
          const uid = workload.metadata?.uid;
          const resourceVersion = workload.metadata?.resourceVersion;
          // Missing/malformed identity is an explicit per-target failure. Never
          // downgrade to a name-only patch against a possibly replaced workload.
          if (typeof uid !== 'string' || !uid || typeof resourceVersion !== 'string' || !resourceVersion) {
            failIdentity();
            continue;
          }
          const templateMeta = workload.spec?.template?.metadata;
          const annotations = templateMeta?.annotations;
          if (
            (templateMeta !== undefined &&
              (typeof templateMeta !== 'object' || templateMeta === null || Array.isArray(templateMeta))) ||
            (annotations !== undefined &&
              (typeof annotations !== 'object' || annotations === null || Array.isArray(annotations)))
          ) {
            failIdentity();
            continue;
          }
          const target: RestartTarget = {
            kind: source.kind,
            name,
            uid,
            resourceVersion,
            hasMetadata: templateMeta !== undefined,
            hasAnnotations: annotations !== undefined,
          };
          const previous = seen.get(name);
          if (previous) {
            if (
              previous.uid !== target.uid ||
              previous.resourceVersion !== target.resourceVersion ||
              previous.hasMetadata !== target.hasMetadata ||
              previous.hasAnnotations !== target.hasAnnotations
            ) {
              // readK8sCollection already rejects conflicting duplicates; this is
              // a defensive second boundary so inconsistent names never patch.
              return {
                source,
                targets: [],
                identityFailures: [],
                failure: {
                  code: 'incomplete_list' as const,
                  message:
                    'A matching workload appeared with conflicting revisions. No workloads of this kind were patched.',
                },
              };
            }
            continue;
          }
          seen.set(name, target);
          targets.push(target);
        }
        targets.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
        identityFailures.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
        return { source, targets, identityFailures };
      } catch (error) {
        return { source, targets: [], identityFailures: [], failure: consumerRequestFailure(error) };
      }
    }),
  );

  const discoveryFailures = discoveries.flatMap(({ source, failure }) =>
    failure ? [{ kind: source.kind, ...failure }] : [],
  );
  const targets = discoveries.flatMap(({ source, targets }) => targets.map((target) => ({ source, target })));
  const identityFailures = discoveries.flatMap(({ identityFailures }) => identityFailures ?? []);
  const outcomes: Array<{ workload: ConsumerWorkload; failure?: ConsumerFailure }> = new Array(targets.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(PATCH_CONCURRENCY, targets.length) }, async () => {
      while (next < targets.length) {
        const index = next++;
        const { source, target } = targets[index];
        const workload = { kind: source.kind, name: target.name };
        try {
          // Single attempt per inspected revision. A 409/422 means the workload
          // changed or was replaced; never blind-retry against the new revision.
          await source.patch(target.name, restartPatch(target, timestamp));
          outcomes[index] = { workload };
        } catch (error) {
          outcomes[index] = { workload, failure: consumerRequestFailure(error) };
        }
      }
    }),
  );

  const requested = outcomes.filter(({ failure }) => !failure).map(({ workload }) => workload);
  const failures = [
    ...outcomes.flatMap(({ workload, failure }) => (failure ? [{ ...workload, ...failure }] : [])),
    ...identityFailures,
  ];
  const matched = targets.length + identityFailures.length;
  const hasFailures = failures.length > 0 || discoveryFailures.length > 0;
  const status = hasFailures
    ? requested.length > 0
      ? 'partial'
      : 'failed'
    : requested.length > 0
      ? 'requested'
      : 'no_targets';
  const discoveryNote =
    discoveryFailures.length > 0
      ? ` Discovery incomplete: ${discoveryFailures.length} workload kind${discoveryFailures.length === 1 ? '' : 's'} could not be listed.`
      : '';
  const failureNote =
    failures.length > 0 ? ` ${failures.length} patch request${failures.length === 1 ? '' : 's'} failed.` : '';
  const workloadCount = status === 'partial' ? matched : requested.length;
  const message =
    status === 'no_targets'
      ? 'No matching workloads found. No rollout requested.'
      : status === 'failed'
        ? `No rollout requests were confirmed.${failureNote}${discoveryNote}`
        : `Rollout requested for ${requested.length}${status === 'partial' ? ` of ${matched} matched` : ''} workload${workloadCount === 1 ? '' : 's'}.${failureNote}${discoveryNote}`;
  return {
    status,
    matched,
    requested,
    failures,
    discoveryFailures,
    message,
    note: 'Only acknowledged pod-template patches are reported as requested. Rollout completion, readiness, and credential uptake are not verified.',
  };
}
