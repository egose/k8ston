# krypton Helm chart

Deploys the krypton Next.js app (Kubernetes-native secret manager UI + API): Deployment, Service, RBAC (namespace or
cluster scope), and optional Ingress / OpenShift Route / Gateway API HTTPRoute.

Published as an OCI artifact to `oci://ghcr.io/egose/charts/krypton` on every `v*.*.*` tag. Chart `version` and
`appVersion` are both set from the release tag, so chart `1.2.3` deploys app `1.2.3` (`ghcr.io/egose/krypton:1.2.3` by
default — override with `image.tag`).

## Use as a dependency

```yaml
# Chart.yaml
dependencies:
  - name: krypton
    version: '1.2.3'
    repository: oci://ghcr.io/egose/charts
```

```yaml
# values.yaml
krypton:
  enabled: true
  env:
    KRYPTON_SCOPE: namespace
```

Then `helm dependency update`. If the package is private, `helm registry login ghcr.io` first.

## Install directly

```sh
helm install krypton oci://ghcr.io/egose/charts/krypton --version 1.2.3 --namespace krypton --create-namespace
```

## Values

See [values.yaml](values.yaml) for the full reference. Key settings:

| Key                        | Default                 | Description                                                                             |
| -------------------------- | ----------------------- | --------------------------------------------------------------------------------------- |
| `image.repository` / `tag` | `ghcr.io/egose/krypton` | Container image. `tag` defaults to `latest`; pin it to the release in production.       |
| `env` / `envSecretName`    | `{}` / `''`             | Non-secret env vars inline; secret vars via an existing Secret. See `app/.env.example`. |
| `rbac.scope`               | `namespace`             | `namespace` (own namespace only) or `cluster` (centralized multi-namespace dashboard).  |
| `rbac.extraNamespaces`     | `[]`                    | Curated extra namespaces (namespace scope only): Roles plus a derived allowlist.        |
| `restartEnabled`           | `false`                 | Enable the "restart apps" feature (`KRYPTON_RESTART_ENABLED` + `apps` RBAC rule).       |
| `accessConfig.enabled`     | `false`                 | Render the namespace ownership fallback ConfigMap (`access.json`, incl. `teams`).       |
| `ingress.enabled`          | `false`                 | Expose via Ingress.                                                                     |
| `route.enabled`            | `false`                 | Expose via OpenShift Route.                                                             |
| `httpRoute.enabled`        | `false`                 | Expose via Gateway API HTTPRoute.                                                       |

## Effective configuration

One helper (`krypton.effectiveConfig` in `templates/_helpers.tpl`) derives the
chart-managed runtime env from the RBAC/feature values, so the rendered
Deployment env, Role/ClusterRole scope, subjects, and `apps` permissions
always agree. Local `env` wins over `global.env` per key; unrelated
`extraEnv`/custom settings are preserved (but `extraEnv` must not set managed
keys — it renders last and would shadow them).

| Chart value(s)                                             | Derived env default                                                | Rendered RBAC                                                                          |
| ---------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `rbac.scope: namespace` (default)                          | `KRYPTON_SCOPE=namespace`                                          | Role + RoleBinding in the release namespace                                            |
| `rbac.scope: namespace` + `rbac.extraNamespaces: [team-a]` | `KRYPTON_SCOPE=cluster`, `KRYPTON_NAMESPACES=<release-ns>,team-a`  | Namespaced Role + RoleBinding in the release namespace and each extra (no ClusterRole) |
| `rbac.scope: cluster`                                      | `KRYPTON_SCOPE=cluster` (`KRYPTON_NAMESPACES` stays explicit-only) | ClusterRole + ClusterRoleBinding                                                       |
| `restartEnabled`                                           | `KRYPTON_RESTART_ENABLED=<same value>`                             | `apps` rule (deployments/statefulsets/daemonsets) iff enabled                          |
| `accessConfig.enabled: true`                               | `KRYPTON_ACCESS_CONFIGMAP=<accessConfig.name>`                     | The access ConfigMap (`access.json` key, hardcoded by the runtime reader)              |

An explicit `env`/`global.env` entry for a managed key must equal the derived
effective value (case-insensitive for scope, runtime truthy strings
`1/true/yes/on` for restart); contradictions fail rendering with actionable
guidance instead of silently deploying disagreeing runtime/RBAC behavior. With
`rbac.create: false`, RBAC is managed out-of-band: set `KRYPTON_SCOPE` /
`KRYPTON_NAMESPACES` in `env` yourself (`rbac.scope`/`extraNamespaces` are
then ignored), and grant the `apps` permissions yourself to match
`restartEnabled`.

Rendered-object regressions live in `tests/render-regressions.sh` (run in the
_Helm_ CI workflow): default, cluster, curated namespaces, local/global
conflicts, false overrides, external RBAC, custom access config, and every
contradiction error.

## Upgrade notes

- `env` now wins over `global.env` per key (previously globals won). If you
  relied on a global entry overriding a local one, remove the local entry.
- `KRYPTON_SCOPE` is now injected from `rbac.scope` by default; explicit
  entries that already matched keep rendering identically, mismatched ones now
  fail fast with guidance instead of deploying broken permissions.
- `rbac.extraNamespaces` now additionally derives `KRYPTON_SCOPE=cluster` with
  a bounded `KRYPTON_NAMESPACES` allowlist (release namespace plus extras).
  Previously the extra Roles were unusable because the namespace runtime scope
  only exposed the pod namespace; curated namespaces now work with namespaced
  Roles only (no ClusterRole). Remove the entries to stay single-namespace.
- `KRYPTON_RESTART_ENABLED` and the `apps` RBAC rule now come from the single
  `restartEnabled` value. A previously silent split (e.g. env `true` with the
  flag `false`, granting no permissions) now fails rendering: set
  `restartEnabled: true` instead.
- With `accessConfig.enabled: true`, `KRYPTON_ACCESS_CONFIGMAP` is now derived
  from `accessConfig.name`, and `accessConfig.key` must be `access.json` (the
  runtime reader hardcodes it) — a custom key now fails rendering.
- Namespace entries accept an optional `teams` array (up to 64 teams, unique
  DNS-label names); secrets opt in via the `krypton.io/team` annotation.
  Deploy the app before adding `teams` — older releases reject the unknown
  field as invalid policy.
