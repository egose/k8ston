import type { V1ConfigMap, V1Secret } from '@kubernetes/client-node';
import { ANNOTATIONS, config } from './config';
import { getCoreApi, getPodNamespace } from './k8s';
import type { SessionUser } from './auth';
import { namespaceAccessSchema, type NamespaceAccessMap } from './validation';
import { HttpError } from './http';
import { isVisibleLiveSecret } from './secrets';
import { errorStatus } from './errors';

/**
 * Hybrid authorization (for SSO users that do NOT exist in the cluster):
 * - authentication: OIDC SSO (see lib/auth.ts)
 * - authorization: per-Secret annotations + one namespace-level ConfigMap
 *
 * Annotations on a Secret:
 *   krypton.io/allowed-groups: "dev-team, database-admins"
 *   krypton.io/allowed-users:  "alice@company.com, bob@company.com"
 *
 * Namespace fallback lives in ConfigMap <app-namespace>/krypton-access,
 * key "access.json": { "<namespace>": { "groups": [...], "users": [...] } }
 *
 * Default when NO rules exist anywhere: allow all authenticated users
 * (open by default, restricted once rules are added). Policy failures are
 * unavailable, never absent. Admins and explicit Secret ACLs take precedence.
 */

export function isAdmin(user: SessionUser): boolean {
  if (config.authDisabled) return true;
  if (config.adminUsers.includes(user.email.toLowerCase())) return true;
  if (user.groups.some((g) => config.adminGroups.includes(g))) return true;
  // bootstrap: no admins configured at all → every authenticated user is admin
  // until the operator sets KRYPTON_ADMIN_GROUPS/USERS. Documented in README.
  if (config.adminGroups.length === 0 && config.adminUsers.length === 0) return true;
  return false;
}

function csvList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function userMatches(user: SessionUser, groups: string[], users: string[]): boolean {
  const email = user.email.toLowerCase();
  if (users.some((u) => u.toLowerCase() === email)) return true;
  if (user.groups.some((g) => groups.includes(g))) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Namespace-level rules (ConfigMap cache, 60s TTL — still no DB/disk)
// ---------------------------------------------------------------------------

let cache: { expiresAt: number; data: NamespaceAccessMap } | null = null;
let pendingRead: Promise<NamespaceAccessMap> | null = null;
const CACHE_TTL_MS = 60_000;

function policyUnavailable(
  reason: 'read_failed' | 'missing_data' | 'invalid_json' | 'invalid_schema',
  status?: number,
): HttpError {
  // SDK errors can embed response headers, credentials, and policy contents.
  // Log only our classification and a validated numeric HTTP status.
  console.warn('[krypton] namespace access policy unavailable', { reason, ...(status ? { status } : {}) });
  return new HttpError(503, 'Namespace access policy is unavailable');
}

async function readNamespaceAccessMap(): Promise<NamespaceAccessMap> {
  let res: V1ConfigMap;
  try {
    // Application policy is read as the ServiceAccount, even in impersonation
    // mode. This shared cache must not depend on an individual human's RBAC.
    res = await getCoreApi().readNamespacedConfigMap({
      namespace: getPodNamespace(),
      name: config.accessConfigMap,
    });
  } catch (err: unknown) {
    // client-node ApiException.code carries the HTTP status. Only an actual
    // not-found read is intentional absence; never inspect the error payload.
    const status = errorStatus(err);
    if (status === 404) return {};
    throw policyUnavailable('read_failed', status);
  }

  const raw = res?.data?.['access.json'];
  if (typeof raw !== 'string' || !raw.trim()) throw policyUnavailable('missing_data');
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw policyUnavailable('invalid_json');
  }
  const parsed = namespaceAccessSchema.safeParse(value);
  if (!parsed.success) throw policyUnavailable('invalid_schema');
  return parsed.data;
}

/**
 * Cache valid policy (including confirmed absence) for 60s from completion.
 * Misses share one read. An expired map is never served during/after a failed
 * refresh, and failures are retried on the next request instead of cached.
 */
export async function getNamespaceAccessMap(): Promise<NamespaceAccessMap> {
  if (cache && Date.now() < cache.expiresAt) return cache.data;
  if (!pendingRead) {
    cache = null;
    pendingRead = readNamespaceAccessMap()
      .then((data) => {
        cache = { expiresAt: Date.now() + CACHE_TTL_MS, data };
        return data;
      })
      .finally(() => {
        pendingRead = null;
      });
  }
  return pendingRead;
}

export function secretRules(secret: V1Secret): { groups: string[]; users: string[] } {
  const ann = secret.metadata?.annotations ?? {};
  return {
    groups: csvList(ann[ANNOTATIONS.allowedGroups]),
    users: csvList(ann[ANNOTATIONS.allowedUsers]),
  };
}

/** Can `user` read (and therefore manage) this secret? */
export async function canAccessSecret(user: SessionUser, namespace: string, secret: V1Secret): Promise<boolean> {
  if (isAdmin(user)) return true;
  const rules = secretRules(secret);
  const hasSecretRules = rules.groups.length > 0 || rules.users.length > 0;
  if (hasSecretRules) return userMatches(user, rules.groups, rules.users);

  const nsMap = await getNamespaceAccessMap();
  const nsRules = Object.hasOwn(nsMap, namespace) ? nsMap[namespace] : undefined;
  if (nsRules && (nsRules.groups.length > 0 || nsRules.users.length > 0)) {
    return userMatches(user, nsRules.groups, nsRules.users);
  }
  // No rules anywhere → open to all authenticated users.
  return true;
}

/** Can `user` create secrets in `namespace` (namespace rules only)? */
export async function canCreateInNamespace(user: SessionUser, namespace: string): Promise<boolean> {
  if (isAdmin(user)) return true;
  const nsMap = await getNamespaceAccessMap();
  const nsRules = Object.hasOwn(nsMap, namespace) ? nsMap[namespace] : undefined;
  if (!nsRules || (nsRules.groups.length === 0 && nsRules.users.length === 0)) return true;
  return userMatches(user, nsRules.groups, nsRules.users);
}

/** Filter a secret list down to what `user` may see. */
export async function filterVisibleSecrets(
  user: SessionUser,
  namespace: string,
  secrets: V1Secret[],
): Promise<V1Secret[]> {
  const live = secrets.filter(isVisibleLiveSecret);
  if (isAdmin(user)) return live;
  const out: V1Secret[] = [];
  for (const s of live) {
    if (await canAccessSecret(user, namespace, s)) out.push(s);
  }
  return out;
}
