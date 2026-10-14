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
 *   k8ston.io/allowed-groups: "dev-team, database-admins"
 *   k8ston.io/allowed-users:  "alice@company.com, bob@company.com"
 *   k8ston.io/team: "team1" (single team; missing/blank = unassigned)
 *
 * Namespace fallback lives in ConfigMap <app-namespace>/k8ston-access,
 * key "access.json":
 *   { "<namespace>": { "groups": [...], "users": [...],
 *     "teams": [{ "name": "team1", "groups": [...], "users": [...] }] } }
 *
 * Decision order: admins → per-secret ACL → team/namespace policy → open.
 * Namespace groups/users see ALL secrets (every team + unassigned); team
 * members see only their team's secrets. Unassigned secrets use namespace
 * rules only (teams never restrict them). Empty team rules grant nothing
 * (unlike empty namespace rules, which are open). Unknown teams fail closed
 * unless the namespace is completely unrestricted. Default when NO rules
 * exist anywhere: allow all authenticated users. Policy failures are
 * unavailable, never absent.
 */

export function isAdmin(user: SessionUser): boolean {
  if (config.authDisabled) return true;
  if (config.adminUsers.includes(user.email.toLowerCase())) return true;
  if (user.groups.some((g) => config.adminGroups.includes(g))) return true;
  // bootstrap: no admins configured at all → every authenticated user is admin
  // until the operator sets K8STON_ADMIN_GROUPS/USERS. Documented in README.
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
  console.warn('[k8ston] namespace access policy unavailable', { reason, ...(status ? { status } : {}) });
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

/** Single-team assignment; missing/blank/whitespace-only = unassigned. */
export function secretTeam(secret: V1Secret): string | undefined {
  const raw = secret.metadata?.annotations?.[ANNOTATIONS.team];
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed ? trimmed : undefined;
}

function hasRules(groups: string[], users: string[]): boolean {
  return groups.length > 0 || users.length > 0;
}

type NamespaceRules = NonNullable<NamespaceAccessMap[string]>;

/** True when the namespace has no restrictions at all (no ns rules, no team with rules). */
function isUnrestricted(nsRules: NamespaceRules): boolean {
  if (hasRules(nsRules.groups, nsRules.users)) return false;
  return !nsRules.teams.some((t) => hasRules(t.groups, t.users));
}

/** Shared assigned-secret/team-creation decision (namespace already failed or is open). */
function teamDecision(user: SessionUser, nsRules: NamespaceRules, team: string, nsMatched: boolean): boolean {
  if (nsMatched) return true;
  const nsHas = hasRules(nsRules.groups, nsRules.users);
  const teamRule = nsRules.teams.find((t) => t.name === team);
  if (!teamRule) {
    // Unknown team fails closed unless the namespace is completely unrestricted.
    return isUnrestricted(nsRules);
  }
  if (!hasRules(teamRule.groups, teamRule.users)) {
    // Empty team rules grant nothing; open only when the namespace is also open.
    return !nsHas;
  }
  return userMatches(user, teamRule.groups, teamRule.users);
}

/** Can `user` read (and therefore manage) this secret? */
export async function canAccessSecret(user: SessionUser, namespace: string, secret: V1Secret): Promise<boolean> {
  if (isAdmin(user)) return true;
  const rules = secretRules(secret);
  const hasSecretRules = rules.groups.length > 0 || rules.users.length > 0;
  if (hasSecretRules) return userMatches(user, rules.groups, rules.users);

  const team = secretTeam(secret);
  const nsMap = await getNamespaceAccessMap();
  const nsRules = Object.hasOwn(nsMap, namespace) ? nsMap[namespace] : undefined;
  // No namespace entry → open to all authenticated users.
  if (!nsRules) return true;
  const nsHas = hasRules(nsRules.groups, nsRules.users);
  const nsMatched = nsHas && userMatches(user, nsRules.groups, nsRules.users);

  // Unassigned secrets use namespace rules only; teams never restrict them.
  if (!team) {
    if (nsHas) return nsMatched;
    return true;
  }
  // Assigned: namespace sees all, else the secret's team decides.
  return teamDecision(user, nsRules, team, nsMatched);
}

/**
 * Can `user` create secrets in `namespace`?
 * - Unassigned (`team` omitted/blank): namespace rules only (team membership
 *   never grants it; open when the namespace has no rules).
 * - Assigned: namespace match (sees all) OR the target team's rules match.
 */
export async function canCreateInNamespace(user: SessionUser, namespace: string, team?: string): Promise<boolean> {
  if (isAdmin(user)) return true;
  const normalized = team?.trim() ? team.trim() : undefined;
  const nsMap = await getNamespaceAccessMap();
  const nsRules = Object.hasOwn(nsMap, namespace) ? nsMap[namespace] : undefined;
  if (!nsRules) return true;
  const nsHas = hasRules(nsRules.groups, nsRules.users);
  const nsMatched = nsHas && userMatches(user, nsRules.groups, nsRules.users);

  if (!normalized) {
    if (nsHas) return nsMatched;
    return true;
  }
  return teamDecision(user, nsRules, normalized, nsMatched);
}

/** Team names defined in the namespace policy (for dropdowns; membership still enforced server-side). */
export async function listNamespaceTeams(namespace: string): Promise<string[]> {
  const nsMap = await getNamespaceAccessMap();
  const nsRules = Object.hasOwn(nsMap, namespace) ? nsMap[namespace] : undefined;
  return nsRules ? nsRules.teams.map((t) => t.name) : [];
}

/** Teams `user` may create assigned secrets in (namespace match = all teams). */
export async function listCreatableTeams(user: SessionUser, namespace: string): Promise<string[]> {
  if (isAdmin(user)) return listNamespaceTeams(namespace);
  const nsMap = await getNamespaceAccessMap();
  const nsRules = Object.hasOwn(nsMap, namespace) ? nsMap[namespace] : undefined;
  if (!nsRules) return [];
  const nsHas = hasRules(nsRules.groups, nsRules.users);
  // Namespace match sees all teams; unrestricted namespaces need no team grant.
  if (nsHas && userMatches(user, nsRules.groups, nsRules.users)) return nsRules.teams.map((t) => t.name);
  if (!nsHas && isUnrestricted(nsRules)) return nsRules.teams.map((t) => t.name);
  // Mirrors canCreateInNamespace per team: empty teams are creatable iff the
  // namespace itself is open, otherwise only on explicit team membership.
  return nsRules.teams
    .filter((t) => (hasRules(t.groups, t.users) ? userMatches(user, t.groups, t.users) : !nsHas))
    .map((t) => t.name);
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
