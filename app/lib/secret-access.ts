import type { V1Secret } from '@kubernetes/client-node';
import type { SessionUser } from './auth';
import { canAccessSecret } from './authz';
import { HttpError } from './http';
import { getCoreApi, requestOptions } from './k8s';
import { isHistorySnapshot, isVisibleLiveSecret } from './secrets';
import { auditLog } from './validation';

const accessVerbs = {
  'secret.read': 'view',
  'secret.update': 'modify',
  'secret.delete': 'delete',
  'secret.history': 'view',
  'secret.restore': 'modify',
  'secret.restart': 'modify',
} as const;

/**
 * Named-secret boundary, called after authentication and namespace enforcement.
 * Always authorize the current live object before reading history or mutating.
 * A snapshot's copied ACL must never authorize direct access to that snapshot.
 */
export async function loadAuthorizedLiveSecret(
  action: keyof typeof accessVerbs,
  user: SessionUser,
  namespace: string,
  name: string,
): Promise<V1Secret> {
  const live = await getCoreApi().readNamespacedSecret({ namespace, name }, requestOptions(user));
  if (!isVisibleLiveSecret(live)) {
    auditLog({
      action,
      user: user.email,
      namespace,
      name,
      result: 'deny',
      detail: isHistorySnapshot(live)
        ? 'history snapshot hidden'
        : 'unmanaged secret hidden (KRYPTON_MANAGED_ONLY=true)',
    });
    throw new HttpError(404, `Secret "${name}" not found in "${namespace}"`);
  }
  if (!(await canAccessSecret(user, namespace, live))) {
    auditLog({ action, user: user.email, namespace, name, result: 'deny' });
    throw new HttpError(403, `You are not allowed to ${accessVerbs[action]} this secret`);
  }
  return live;
}
