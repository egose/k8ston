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
| `rbac.extraNamespaces`     | `[]`                    | Extra namespaces to bind the namespaced Role into (namespace scope only).               |
| `restartEnabled`           | `false`                 | Enable the "restart apps" feature (`KRYPTON_RESTART_ENABLED` + `apps` RBAC rule).       |
| `accessConfig.enabled`     | `false`                 | Render the namespace ownership fallback ConfigMap (`access.json`).                      |
| `ingress.enabled`          | `false`                 | Expose via Ingress.                                                                     |
| `route.enabled`            | `false`                 | Expose via OpenShift Route.                                                             |
| `httpRoute.enabled`        | `false`                 | Expose via Gateway API HTTPRoute.                                                       |

`rbac.scope` must match `KRYPTON_SCOPE` in `env`.
