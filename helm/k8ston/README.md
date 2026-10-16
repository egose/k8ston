# k8ston Helm chart

Deploys the k8ston Next.js app (Kubernetes-native secret manager UI + API): Deployment, Service, RBAC (namespace or
cluster scope), and optional Ingress / OpenShift Route / Gateway API HTTPRoute.

The release workflow publishes this chart to `oci://ghcr.io/egose/charts/k8ston`
on `v*.*.*` tags, setting chart `version` and `appVersion` from the tag.
**Chart metadata does not pin the app image:** [values.yaml](values.yaml) defaults
`image.tag` to `latest`. Pin both the chart version and `image.tag` explicitly.
Choose a published stable `X.Y.Z` version from the
[releases](https://github.com/egose/k8ston/releases), without the leading `v`.

## Use as a dependency

```yaml
# Chart.yaml
dependencies:
  - name: k8ston
    version: '<published-X.Y.Z-version>'
    repository: oci://ghcr.io/egose/charts
    condition: k8ston.enabled
```

```yaml
# values.yaml
k8ston:
  enabled: true
  image:
    tag: '<published-X.Y.Z-version>'
  envSecretName: k8ston-oidc
  rbac:
    scope: namespace
```

Replace both version placeholders, then run `helm dependency update`. If the
package is private, use `helm registry login ghcr.io` first. Add the authentication,
access-policy, and exposure settings described below under `k8ston:` when using
the chart as a dependency.

## Install directly

Provision an existing `k8ston-oidc` Secret in the release namespace with a fresh
random `SESSION_SECRET` of at least 32 characters and the provider's
`OIDC_CLIENT_SECRET` when required. Never reuse sandbox credentials or put these
values in Git. See the [root deployment guide](../../README.md#deploy-to-kubernetes--openshift)
for private env-file provisioning.

For namespace `k8ston`, save the following as `k8ston-values.yaml`, replacing the
URLs, client ID, and groups with your real settings. These are direct-chart values,
without a `k8ston:` wrapper:

```yaml
envSecretName: k8ston-oidc
rbac:
  scope: namespace
env:
  AUTH_DISABLED: 'false'
  APP_URL: https://k8ston.example.com
  OIDC_ISSUER: https://keycloak.example.com/realms/company
  OIDC_CLIENT_ID: k8ston
  K8STON_ADMIN_GROUPS: k8ston-admin
accessConfig:
  enabled: true
  data:
    k8ston:
      groups: [secret-operators]
      users: []
```

Register `https://<your-host>/api/auth/callback` with the provider and configure
one of `ingress`, `route`, or `httpRoute` with suitable TLS/exposure settings.
All three are disabled by default. Then install with an explicit image pin:

```bash
RELEASE_VERSION='<published-X.Y.Z-version>'
helm upgrade --install k8ston oci://ghcr.io/egose/charts/k8ston \
  --version "$RELEASE_VERSION" \
  --namespace k8ston --create-namespace \
  --values k8ston-values.yaml \
  --set-string image.tag="$RELEASE_VERSION" \
  --wait
```

The defaults are not a complete authentication or access-policy configuration:
leaving both admin lists empty makes every authenticated user an admin, and absent or
empty namespace policy leaves fallback access open. Configure both deliberately.
`APP_URL` is the server runtime URL; a conflicting build-time `NEXT_PUBLIC_APP_URL`
takes precedence and cannot be corrected by changing `APP_URL` alone.

The `/api/config` readiness probe does not verify Kubernetes or OIDC connectivity.
Check real sign-in, authorized operations, and a denied user before production use.
Replicas must share the signing key and consistent annotation/retention settings.

## Values

See [values.yaml](values.yaml) for the full reference. Key settings:

| Key                              | Default                           | Description                                                                                                     |
| -------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `image.repository` / `image.tag` | `ghcr.io/egose/k8ston` / `latest` | Container image; chart version alone does not pin the image.                                                    |
| `env` / `envSecretName`          | `{}` / `''`                       | Non-secret env inline; credentials in an existing Secret. See [app/.env.example](../../app/.env.example).       |
| `rbac.scope`                     | `namespace`                       | `namespace` (own namespace only) or `cluster` (centralized multi-namespace dashboard).                          |
| `rbac.extraNamespaces`           | `[]`                              | Curated extra namespaces (namespace scope only): Roles plus a derived allowlist; namespaces must already exist. |
| `restartEnabled`                 | `false`                           | Enable the "restart apps" feature (`K8STON_RESTART_ENABLED` + `apps` RBAC rule).                                |
| `accessConfig.enabled`           | `false`                           | Render the namespace ownership fallback ConfigMap (`access.json`, incl. `teams`).                               |
| `ingress.enabled`                | `false`                           | Expose via Ingress.                                                                                             |
| `route.enabled`                  | `false`                           | Expose via OpenShift Route.                                                                                     |
| `httpRoute.enabled`              | `false`                           | Expose via Gateway API HTTPRoute.                                                                               |

The [local umbrella chart](../main/) adds a NetworkPolicy; this direct chart does
not. Its app values are nested under `k8ston:`, unlike the direct-install example.

## Effective configuration

One helper (`k8ston.effectiveConfig` in `templates/_helpers.tpl`) derives the
chart-managed runtime env from the RBAC/feature values, so the rendered
Deployment env, Role/ClusterRole scope, subjects, and `apps` permissions
always agree. Local `env` wins over `global.env` per key; unrelated
`extraEnv`/custom settings are preserved (but `extraEnv` must not set managed
keys — it renders last and would shadow them).

| Chart value(s)                                             | Derived env default                                              | Rendered RBAC                                                                          |
| ---------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `rbac.scope: namespace` (default)                          | `K8STON_SCOPE=namespace`                                         | Role + RoleBinding in the release namespace                                            |
| `rbac.scope: namespace` + `rbac.extraNamespaces: [team-a]` | `K8STON_SCOPE=cluster`, `K8STON_NAMESPACES=<release-ns>,team-a`  | Namespaced Role + RoleBinding in the release namespace and each extra (no ClusterRole) |
| `rbac.scope: cluster`                                      | `K8STON_SCOPE=cluster` (`K8STON_NAMESPACES` stays explicit-only) | ClusterRole + ClusterRoleBinding                                                       |
| `restartEnabled`                                           | `K8STON_RESTART_ENABLED=<same value>`                            | `apps` rule (deployments/statefulsets/daemonsets) iff enabled                          |
| `accessConfig.enabled: true`                               | `K8STON_ACCESS_CONFIGMAP=<accessConfig.name>`                    | The access ConfigMap (`access.json` key, hardcoded by the runtime reader)              |

An application allowlist does not narrow a ClusterRole's Kubernetes permissions.
Use `rbac.extraNamespaces` with namespace scope for curated access without a
ClusterRole, and keep the ServiceAccount token mounted for in-cluster API access.

An explicit `env`/`global.env` entry for a managed key must equal the derived
effective value (case-insensitive for scope, runtime truthy strings
`1/true/yes/on` for restart); contradictions fail rendering with actionable
guidance instead of silently deploying disagreeing runtime/RBAC behavior. With
`rbac.create: false`, RBAC is managed out-of-band: set `K8STON_SCOPE` /
`K8STON_NAMESPACES` in `env` yourself (`rbac.scope`/`extraNamespaces` are
then ignored), and grant the `apps` permissions yourself to match
`restartEnabled`.

Rendered-object regressions live in `tests/render-regressions.sh` (run in the
_Helm_ CI workflow): default, cluster, curated namespaces, local/global
conflicts, false overrides, external RBAC, custom access config, and every
contradiction error.

## Upgrade notes

- `env` now wins over `global.env` per key (previously globals won). If you
  relied on a global entry overriding a local one, remove the local entry.
- `K8STON_SCOPE` is now injected from `rbac.scope` by default; explicit
  entries that already matched keep rendering identically, mismatched ones now
  fail fast with guidance instead of deploying broken permissions.
- `rbac.extraNamespaces` now additionally derives `K8STON_SCOPE=cluster` with
  a bounded `K8STON_NAMESPACES` allowlist (release namespace plus extras).
  Previously the extra Roles were unusable because the namespace runtime scope
  only exposed the pod namespace; curated namespaces now work with namespaced
  Roles only (no ClusterRole). Remove the entries to stay single-namespace.
- `K8STON_RESTART_ENABLED` and the `apps` RBAC rule now come from the single
  `restartEnabled` value. A previously silent split (e.g. env `true` with the
  flag `false`, granting no permissions) now fails rendering: set
  `restartEnabled: true` instead.
- With `accessConfig.enabled: true`, `K8STON_ACCESS_CONFIGMAP` is now derived
  from `accessConfig.name`, and `accessConfig.key` must be `access.json` (the
  runtime reader hardcodes it) — a custom key now fails rendering.
- Namespace entries accept an optional `teams` array (up to 64 teams, unique
  DNS-label names); secrets opt in via the `k8ston.io/team` annotation.
  Deploy the app before adding `teams` — older releases reject the unknown
  field as invalid policy.
