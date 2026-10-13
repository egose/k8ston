import { config } from './config';
import { getCoreApi, getPodNamespace, requestOptions } from './k8s';
import type { SessionUser } from './auth';
import { HttpError } from './errors';
import { COLLECTION_LIMITS, readK8sCollection } from './k8s-list';

/**
 * Namespaces visible to the app:
 * - `namespace` scope: only the pod's own namespace (Role + RoleBinding).
 * - `cluster` scope: a configured allowlist requires no namespace-list permission;
 *   otherwise a complete bounded cluster inventory is required.
 */
export async function listAllowedNamespaces(user: SessionUser): Promise<string[]> {
  if (config.scope === 'namespace') return [getPodNamespace()];
  if (config.allowedNamespaces.length > 0) return [...new Set(config.allowedNamespaces)].sort();
  const core = getCoreApi();
  const opts = requestOptions(user);
  return (
    await readK8sCollection(
      (page) => core.listNamespace(page, opts),
      COLLECTION_LIMITS.namespaces,
      (ns) => ns.metadata!.name!,
    )
  ).sort();
}

export async function assertNamespaceAllowed(namespace: string, user: SessionUser): Promise<void> {
  const allowed = await listAllowedNamespaces(user);
  if (!allowed.includes(namespace)) {
    throw new HttpError(403, 'Namespace is outside the configured application scope');
  }
}
