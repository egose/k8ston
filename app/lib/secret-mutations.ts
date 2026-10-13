import type { V1Secret } from '@kubernetes/client-node';
import type { SessionUser } from './auth';
import { HttpError } from './http';
import { getCoreApi, requestOptions, toK8sError } from './k8s';
import type { DeleteSecretResult } from './secrets';
import { deleteSnapshots } from './snapshot-store';

/** Call after live authorization and before any history reads or side effects. */
export function assertExpectedResourceVersion(live: V1Secret, expected: string): void {
  if (!live.metadata?.uid || !live.metadata.resourceVersion || live.metadata.resourceVersion !== expected) {
    throw new HttpError(409, 'This secret changed since you loaded it (resourceVersion mismatch). Reload and retry.');
  }
}

/**
 * Check the exact object that supplied authorization, not a freshly authorized
 * same-name replacement. This narrows cross-object races; it is NOT a lock.
 * The final live write/delete must still use native UID/resourceVersion CAS.
 */
export async function recheckLiveSecret(namespace: string, live: V1Secret, user: SessionUser): Promise<void> {
  const meta = live.metadata;
  if (!meta?.name || !meta.uid || !meta.resourceVersion || meta.namespace !== namespace) {
    throw new HttpError(409, 'A current live Secret identity is required. Reload and retry.');
  }
  let current: V1Secret;
  try {
    current = await getCoreApi().readNamespacedSecret({ namespace, name: meta.name }, requestOptions(user));
  } catch (err) {
    if (toK8sError(err).status !== 404) {
      throw new HttpError(
        503,
        'The live Secret revision could not be rechecked. No further mutation was attempted; reload and retry.',
      );
    }
    throw liveChanged();
  }
  if (current.metadata?.uid !== meta.uid || current.metadata?.resourceVersion !== meta.resourceVersion)
    throw liveChanged();
}

function liveChanged(): HttpError {
  return new HttpError(
    409,
    'The secret changed or was replaced during this operation. Earlier history changes are not rolled back. Reload and retry.',
  );
}

/**
 * Cleanup first so our cleanup failures leave the live authorization object
 * available for a retry. Kubernetes has no transaction spanning these objects:
 * cleanup may survive a later conflict, and concurrent writers can add history
 * even after the final inventory check. Never describe this as atomic erasure.
 */
export async function deleteLiveSecret(
  namespace: string,
  live: V1Secret,
  user: SessionUser,
  keepHistory = false,
): Promise<DeleteSecretResult> {
  const check = () => recheckLiveSecret(namespace, live, user);
  if (!keepHistory) await deleteSnapshots(namespace, live, user, check);
  await check();

  const { name, uid, resourceVersion } = live.metadata!;
  const core = getCoreApi();
  try {
    await core.deleteNamespacedSecret(
      {
        namespace,
        name: name!,
        body: { preconditions: { uid, resourceVersion } },
      },
      requestOptions(user),
    );
  } catch (err) {
    const { status } = toK8sError(err);
    if (status === 409 || status === 404) throw liveChanged();
    throw new HttpError(
      status,
      'Live deletion failed or could not be confirmed. Earlier history cleanup is not rolled back; reload before retrying.',
    );
  }

  const result = { name: name!, uid: uid!, history: keepHistory ? ('retained' as const) : ('cleaned' as const) };
  let current: V1Secret;
  try {
    // DELETE may return Status OR a terminating Secret. Only a subsequent 404
    // confirms absence; a successful DELETE alone does not finish finalizers.
    current = await core.readNamespacedSecret({ namespace, name: name! }, requestOptions(user));
  } catch (err) {
    if (toK8sError(err).status === 404) return { ...result, status: 'deleted', deleted: name! };
    throw new HttpError(
      503,
      'Deletion was requested, but live absence could not be confirmed. Reload to check its status; history cleanup is not rolled back.',
    );
  }
  // A replacement observed after the accepted DELETE is also a conflict, never
  // a success about the name now occupied by another object. Do not touch it.
  if (!current.metadata?.uid || current.metadata.uid !== uid) throw liveChanged();
  if (!current.metadata.resourceVersion) {
    throw new HttpError(
      503,
      'Deletion was requested, but its current revision is unavailable. Reload to check its status.',
    );
  }
  return {
    ...result,
    status: 'pending',
    resourceVersion: current.metadata.resourceVersion,
    deletionTimestamp: current.metadata.deletionTimestamp as unknown as string | undefined,
  };
}
