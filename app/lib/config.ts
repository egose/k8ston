import { HttpError } from './errors';

/**
 * K8ston — centralized configuration from environment.
 *
 * No database: all state lives in Kubernetes Secret objects (and one
 * optional ConfigMap for namespace-level access rules).
 */

function csv(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function bool(value: string | undefined, fallback = false): boolean {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

export type K8stonScope = 'namespace' | 'cluster';

export const HISTORY_LIMIT_MAX = 100;

export const config = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'http://localhost:3000',
  /** namespace the app itself runs in (injected via downward API in k8s/) */
  appNamespace: process.env.POD_NAMESPACE ?? process.env.K8STON_NAMESPACE ?? 'k8ston',
  scope: ((process.env.K8STON_SCOPE ?? 'namespace').toLowerCase() === 'cluster'
    ? 'cluster'
    : 'namespace') as K8stonScope,
  /** allowlist for cluster scope; empty = all namespaces readable by the SA */
  allowedNamespaces: csv(process.env.K8STON_NAMESPACES),

  annotationPrefix: process.env.K8STON_ANNOTATION_PREFIX ?? 'k8ston.io',
  accessConfigMap: process.env.K8STON_ACCESS_CONFIGMAP ?? 'k8ston-access',

  adminGroups: csv(process.env.K8STON_ADMIN_GROUPS),
  adminUsers: csv(process.env.K8STON_ADMIN_USERS).map((s) => s.toLowerCase()),

  /** Positive, bounded retention per live UID. Validate before any history write. */
  get historyLimit() {
    const value = process.env.K8STON_HISTORY_LIMIT ?? '20';
    const limit = Number(value);
    if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(limit) || limit > HISTORY_LIMIT_MAX) {
      throw new HttpError(503, `K8STON_HISTORY_LIMIT must be an integer from 1 to ${HISTORY_LIMIT_MAX}`);
    }
    return limit;
  },

  /**
   * When true (default), secrets WITHOUT the k8ston.io/managed-by=k8ston
   * annotation are hidden entirely (excluded from lists, 404 on direct
   * access) so K8s-level secrets created outside K8ston can't be edited or
   * deleted by accident. Set false to restore the legacy adopt-on-edit flow.
   */
  managedOnly: bool(process.env.K8STON_MANAGED_ONLY, true),

  /** set true when etcd encryption-at-rest (e.g. aescbc) is enabled; else show warning */
  etcdEncrypted: bool(process.env.K8STON_ETCD_ENCRYPTED, false),

  /**
   * Forward the session email and all groups so K8s RBAC authorizes the human.
   * Subjects must match cluster RBAC; the SA needs impersonate permission.
   * Application access-policy reads still use the SA and its shared cache.
   * Default false = hybrid mode (SSO auth + annotation/ConfigMap authz).
   */
  impersonation: bool(process.env.K8STON_IMPERSONATION, false),

  /**
   * When true, the "Restart apps" feature is enabled: the UI shows the
   * button + hint and the restart-consumers API rolls workloads.
   * Default false (least privilege): the button + hint are hidden, the API
   * returns 403, and the ServiceAccount needs no `apps` permissions (drop
   * the deployments/statefulsets/daemonsets rule from the Role/ClusterRole).
   */
  restartEnabled: bool(process.env.K8STON_RESTART_ENABLED, false),

  authDisabled: bool(process.env.AUTH_DISABLED, false),
  /** Validated lazily by auth.ts: builds and explicit auth bypass need no key. */
  sessionSecret: process.env.SESSION_SECRET ?? '',
  sessionMaxAgeSec: Number.parseInt(process.env.SESSION_MAX_AGE ?? '28800', 10) || 28800, // 8h

  oidc: {
    issuer: process.env.OIDC_ISSUER ?? '',
    clientId: process.env.OIDC_CLIENT_ID ?? '',
    clientSecret: process.env.OIDC_CLIENT_SECRET ?? '',
    scopes: process.env.OIDC_SCOPES ?? 'openid profile email groups',
    /**
     * Allow http:// OIDC issuers (sandbox Dex). Honored ONLY for loopback
     * issuers outside production — see lib/auth.ts enforcement. Default false.
     */
    allowHttp: bool(process.env.OIDC_ALLOW_HTTP, false),
    groupsClaim: process.env.OIDC_GROUPS_CLAIM ?? 'groups',
    usernameClaim: process.env.OIDC_USERNAME_CLAIM ?? 'email',
    nameClaim: process.env.OIDC_NAME_CLAIM ?? 'name',
    // resolved lazily via discovery; redirect derived from appUrl
    get redirectUri() {
      return process.env.OIDC_REDIRECT_URI ?? `${config.appUrl.replace(/\/$/, '')}/api/auth/callback`;
    },
  },
} as const;

export const ANNOTATIONS = {
  get allowedGroups() {
    return `${config.annotationPrefix}/allowed-groups`;
  },
  get allowedUsers() {
    return `${config.annotationPrefix}/allowed-users`;
  },
  /** Single-team assignment; missing/blank = unassigned (namespace default). */
  get team() {
    return `${config.annotationPrefix}/team`;
  },
  /** monotonically increasing app-level version counter */
  get version() {
    return `${config.annotationPrefix}/version`;
  },
  get managedBy() {
    return `${config.annotationPrefix}/managed-by`;
  },
  get description() {
    return `${config.annotationPrefix}/description`;
  },
  get lastModifiedBy() {
    return `${config.annotationPrefix}/last-modified-by`;
  },
  /** on snapshot secrets: original name */
  get historyOf() {
    return `${config.annotationPrefix}/history-of`;
  },
  get historyFormat() {
    return `${config.annotationPrefix}/history-format`;
  },
  get sourceUid() {
    return `${config.annotationPrefix}/source-uid`;
  },
  get sourceResourceVersion() {
    return `${config.annotationPrefix}/source-resource-version`;
  },
  get sourceType() {
    return `${config.annotationPrefix}/source-type`;
  },
  get snapshotAt() {
    return `${config.annotationPrefix}/snapshot-at`;
  },
  get snapshotBy() {
    return `${config.annotationPrefix}/snapshot-by`;
  },
} as const;

export const LABELS = {
  get managedBy() {
    return `${config.annotationPrefix}/managed-by`;
  },
  /** Legacy name-only label; never use it to authorize or select history. */
  get historyOf() {
    return `${config.annotationPrefix}/history-of`;
  },
  /** Hashes keep selectors valid even for opaque, long source identities. */
  get sourceUid() {
    return `${config.annotationPrefix}/source-uid`;
  },
  get sourceResourceVersion() {
    return `${config.annotationPrefix}/source-resource-version`;
  },
  /** distinguishes live secrets from historical snapshots */
  get kind() {
    return `${config.annotationPrefix}/kind`;
  },
} as const;

export const MANAGED_BY_VALUE = 'k8ston';

/** K8s enforces ~1MiB per Secret object (data + metadata). */
export const K8S_SECRET_SIZE_LIMIT = 1024 * 1024;
