# K8ston — Kubernetes-native secret manager

Lightweight secret manager UI and API backed **directly by Kubernetes Secret objects**.
K8ston adds OIDC sign-in, application access rules, editing, and retained history
without a separate application database or persistent volume.

[Documentation](https://k8ston.pages.dev/) · [Application reference](app/README.md) ·
[Releases](https://github.com/egose/k8ston/releases) · [Issues](https://github.com/egose/k8ston/issues)

The checkout's version is recorded in [VERSION](VERSION) and [package.json](package.json).
Use published releases, rather than assuming the checkout's version is available in the registries.

## Contents

- [How it works](#how-it-works) and [key features](#key-features)
- [Quick start](#quick-start)
- [Deployment](#deploy-to-kubernetes--openshift)
- [Configuration](#configuration-reference)
- [Security](#security-model-read-before-production) and [access control](#access-control-summary)
- [History, restarts, and API limits](#versioning-restarts-and-api-budgets-summary)
- [Development and testing](#development-and-testing)
- [Troubleshooting](#troubleshooting)

## How it works

```text
Browser ──SSO login──▶ K8ston (Next.js)
                            │  ServiceAccount token (auto-mounted in-cluster)
                            │  In-cluster Kubernetes API
                            ▼
                    Kubernetes API ──▶ live Secrets, history Secrets,
                                       and an optional access ConfigMap
```

- **State:** live values and snapshots are native `Secret` objects. Kubernetes
  tooling and backups can operate on them; K8ston does not replace cluster RBAC,
  audit configuration, or network controls.
- **Auth:** users sign in through an OpenID Connect provider, such as Keycloak or
  Dex. An OAuth-only provider is not sufficient. In the default hybrid mode,
  users do **not** need Kubernetes identities or cluster credentials.
- **Authz (hybrid):** SSO proves _who you are_; per-secret annotations and one
  namespace-level ConfigMap decide _what you may manage_. The app ServiceAccount
  executes Kubernetes calls. Optional impersonation additionally applies human RBAC.
- **History:** K8s overwrites in place, so K8ston snapshots the previous state
  into an immutable Secret bound to the live object's UID and resourceVersion
  before an update or restore. These are pre-write captures, not an atomic backup log.
- **Stateless application:** replicas share Kubernetes state, not a local database.
  Use the same session signing key, annotation prefix, and retention configuration
  across replicas. Namespace access policy has a separate 60-second cache per process.

K8ston is **not an encryption layer, credential rotation engine, or tamper-proof
backup service**. Enable Kubernetes encryption at rest and maintain independent backups.

## Key features

- Create, read, update, and delete supported Secrets with masked values,
  syntax-highlighted previews, bulk `KEY=value` import, and byte-preserving handling
  of native data. Binary values are viewable as base64, not editable as plaintext.
- Per-secret ACL annotations + namespace fallback ConfigMap + team scoping.
- Versioned history with conflict-checked restores, retention (`K8STON_HISTORY_LIMIT`),
  and reviewed legacy-recovery path.
- Opt-in **Restart apps** for Deployments/StatefulSets/DaemonSets with
  explicit secret references.
- Native type validation (`Opaque`, `kubernetes.io/basic-auth`, `kubernetes.io/ssh-auth`,
  `kubernetes.io/tls`, `kubernetes.io/dockerconfigjson`, `kubernetes.io/dockercfg`), immutable-secret support,
  1 MiB per-object guard (client + server).
- Bounded inventories, paginated lists, `no-store` responses, redacted audit/error
  diagnostics, and an etcd-encryption warning banner.
- Namespace scope (least privilege) or cluster scope (central dashboard).

See the [application reference](app/README.md) for detailed contracts and upgrade notes.

## Repository layout

```text
.
├── app/                  # Next.js app + API + k8s manifests + tests
│   ├── k8s/              # raw manifests: namespace, SA, Role/ClusterRole,
│   │                     #   configmap-access/app, secret-oidc, deployment
│   ├── lib/              # k8s client, OIDC/session, authz, snapshots, validation
│   ├── components/       # dashboard, tables, forms, masked values, history
│   ├── .env.example      # full env reference for local dev
│   └── README.md         # deep dive: authz, versioning, restarts, budgets, SSO
├── sandbox/              # kind + Dex + fixtures local E2E environment
│   ├── app.env.sandbox   # ready-made app/.env for sandbox mode
│   ├── dex/config.yaml   # throwaway OIDC provider (in-memory)
│   ├── kind/             # cluster definition + fixtures
│   └── README.md         # quickstart, visibility matrix, scenarios
├── helm/
│   ├── k8ston/           # publishable subchart (Deployment/Service/RBAC/
│   │                     #   Ingress/Route/HTTPRoute) → OCI on release tags
│   └── main/             # local umbrella chart (k8ston + NetworkPolicy)
├── website/              # Docusaurus docs (About/Guides/API), standalone pnpm project
│   └── docs/             # about/, guides/, api/
├── Dockerfile            # prod image: ghcr.io/egose/k8ston:<tag>
├── Makefile              # sandbox lifecycle: up/down/destroy/seed/verify-sandbox
├── pnpm-workspace.yaml   # workspace: app only (website is separate)
└── VERSION               # checkout's release version
```

Start here by concern:

| Want to…                                                | Read                                                                                   |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Understand authorization, history, restarts, and limits | [Application reference](app/README.md)                                                 |
| Run kind and real SSO locally                           | [Sandbox guide](sandbox/README.md), [Makefile](Makefile)                               |
| Deploy with Helm                                        | [Chart reference](helm/k8ston/README.md), [chart values](helm/k8ston/values.yaml)      |
| Deploy with raw manifests                               | [Manifests](app/k8s/), [deployment guide](website/docs/guides/deploy-kubernetes.mdx)   |
| Use the API                                             | [API overview](website/docs/api/overview.mdx)                                          |
| Browse all guides                                       | [Documentation source](website/docs/), [documentation site](https://k8ston.pages.dev/) |

## Prerequisites

- **Node.js:** use the developer/CI version in [.tool-versions](.tool-versions), or
  Node 22.22 as used by the [Dockerfile](Dockerfile). Node 20 is insufficient for
  current dependencies: `undici` requires Node 22.19 or newer.
- **pnpm:** use the version selected by `packageManager` in [package.json](package.json)
  (currently `11.24.0`). With Corepack installed, `corepack enable` enables its shims.
  `.tool-versions` currently lists a different pnpm version; ensure repository
  commands honor `packageManager`.
- **Local app:** a kubeconfig selected by `KUBECONFIG`, or `~/.kube/config`.
  Use a development cluster and credentials allowed to manage Secrets in your chosen namespace.
- **Sandbox:** Docker with Compose v2, [kind](https://kind.sigs.k8s.io/docs/user/quick-start/),
  `kubectl`, `curl`, GNU Make, and Bash.
- **Deployment:** a reachable Kubernetes cluster, `kubectl`, an OIDC provider,
  and Helm with OCI support if using the published chart.
- **Offline manifest checks:** Python 3 with PyYAML, in addition to Docker Compose.
- **Browser tests:** Playwright Chromium; installation commands are below.

## Quick start

Unless a section says otherwise, run commands **from the repository root**.

```bash
git clone https://github.com/egose/k8ston.git
cd k8ston
pnpm install --frozen-lockfile
```

Choose one configuration path below. `cp -n` preserves an existing `app/.env`;
if you already have one, update it deliberately to match the chosen path.

### Path A: local dev with mock admin (fastest)

```bash
cp -n app/.env.example app/.env
# Set K8STON_NAMESPACE in app/.env to your development namespace.
pnpm --dir app dev --hostname 127.0.0.1
```

Open http://localhost:3000. The example selects the `default` namespace and
`AUTH_DISABLED=true`, which gives every request the mock admin `dev@k8ston.local`.
It still performs real Kubernetes writes. Keep it loopback-bound and never use
this configuration in production. Managed-only mode hides existing unmanaged
Secrets; create a Secret through K8ston to try the default workflow.

For real SSO locally, set a fresh `SESSION_SECRET` (`openssl rand -hex 32`),
`AUTH_DISABLED=false`, and your `OIDC_*` settings. Register
`http://localhost:3000/api/auth/callback` in your provider.

### Path B: full sandbox with real SSO (recommended)

```bash
make up
cp -n sandbox/app.env.sandbox app/.env
pnpm --dir app dev --hostname 127.0.0.1
```

`make up` creates/selects `kind-k8ston-sandbox`, starts Dex, and applies fixtures.
The app runs on the host, **not** in Docker Compose. Open http://localhost:3000
and sign in with password `password` (throwaway local accounts only):

| User                | Groups          | Expected access                                                    |
| ------------------- | --------------- | ------------------------------------------------------------------ |
| `alice@company.com` | `dev-team`      | can manage `database-credentials` in `k8ston-test`                 |
| `bob@company.com`   | `other-team`    | denied `database-credentials`; can manage open fixtures            |
| `carol@company.com` | `frontend-team` | can manage namespace-fallback Secrets in `frontend-ns`             |
| `admin@company.com` | `k8ston-admin`  | bypasses application ACLs, not scope/visibility or Kubernetes RBAC |

Dex binds to `127.0.0.1:5556`; the command above binds the app to `127.0.0.1:3000`.
Kind selects a host API port recorded in its kubeconfig; do not assume host port `6443`.
The sandbox deliberately enables unmanaged-Secret adoption and workload restarts,
which are disabled by the production defaults. Never reuse its signing key or credentials.

| Command                                    | Effect                                                                           |
| ------------------------------------------ | -------------------------------------------------------------------------------- |
| `make down`                                | Stops Dex; keeps the kind cluster and its data.                                  |
| `make destroy`                             | Removes Dex volumes and deletes the kind cluster, including its Secrets/history. |
| `make reset`                               | Destroys and recreates the sandbox; discards its cluster data.                   |
| `make seed`                                | Reapplies fixtures to the sandbox context; can overwrite fixture edits.          |
| `make logs`, `make logs-follow`, `make ps` | Inspect Dex logs or Compose services.                                            |

See the [sandbox guide](sandbox/README.md) for fixtures and integration scenarios.
Per-user session checks require `AUTH_DISABLED=false`; bypass mode ignores minted
session cookies and always uses the mock admin.

## Deploy to Kubernetes / OpenShift

Before deploying:

1. Configure an OIDC client, its issuer, supported scopes/claims, and the exact
   callback `https://<your-host>/api/auth/callback`. Both the browser and K8ston
   must reach the provider. Expose K8ston through TLS; production cookies are secure.
2. Keep `AUTH_DISABLED=false`, configure explicit admin groups/users, and define
   access rules for every namespace you intend to restrict. **An absent namespace
   policy is open, not deny-all.**
3. Enable cluster encryption at rest, apply least-privilege RBAC, and arrange
   independent backups. `K8STON_ETCD_ENCRYPTED=true` only acknowledges encryption;
   it does not enable it.

The examples use namespace `k8ston`. First provision `k8ston-oidc` using your normal
secret-management workflow. For a manual initial setup, create a private env file
outside the repository (permissions `0600`) with these two keys:

```dotenv
OIDC_CLIENT_SECRET=<your-provider-client-secret>
SESSION_SECRET=<fresh-output-from-openssl-rand-hex-32>
```

Replace both placeholders; do not use sandbox values or commit the file.
Loading from a file avoids putting the actual client secret in shell command history:

```bash
kubectl apply -f app/k8s/namespace.yaml
kubectl -n k8ston create secret generic k8ston-oidc \
  --from-env-file=/secure/path/k8ston-oidc.env
```

### Option 1: raw manifests (`app/k8s/`)

Customize the examples **before** applying them:

- [configmap-app.yaml](app/k8s/configmap-app.yaml): replace the sample URL/provider
  settings and configure admins. For a reusable container image, use runtime
  `APP_URL` instead of an unwanted `NEXT_PUBLIC_APP_URL` entry (see configuration below).
- [configmap-access.yaml](app/k8s/configmap-access.yaml): add rules for your actual
  namespaces. The supplied example has no `k8ston` entry, so that namespace is open.
- [deployment.yaml](app/k8s/deployment.yaml): replace `latest` with a published image tag.

After provisioning the namespace and Secret above, apply the namespace-scoped resources:

```bash
kubectl apply -f app/k8s/serviceaccount.yaml -f app/k8s/role.yaml
kubectl apply -f app/k8s/configmap-access.yaml -f app/k8s/configmap-app.yaml
kubectl apply -f app/k8s/deployment.yaml
kubectl -n k8ston rollout status deployment/k8ston
```

Do not apply the whole `app/k8s/` directory indiscriminately: it also contains
broader cluster RBAC and an OIDC Secret template with placeholder values.
Add a TLS Ingress or OpenShift Route separately; the manifests provide a ClusterIP Service.

For a centralized dashboard, set `K8STON_SCOPE=cluster` and grant the corresponding
permissions, for example with [clusterrole.yaml](app/k8s/clusterrole.yaml).
`K8STON_NAMESPACES="team-a,team-b"` limits the application scope, **not** the
ServiceAccount's ClusterRole permissions. For curated namespaces with only
namespaced Roles, prefer the Helm `rbac.extraNamespaces` option.

To enable workload restarts, set `K8STON_RESTART_ENABLED=true` **and** enable the
`apps` rule for Deployments, StatefulSets, and DaemonSets in the chosen Role/ClusterRole.

### Option 2: published Helm chart

Save the following as `k8ston-values.yaml`, replacing the provider URL, public URL,
and group names with your own. These are **direct-chart values**, not wrapped in `k8ston:`:

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

Configure `ingress`, `route`, or `httpRoute` for your platform and TLS setup as well;
none is enabled by default. Choose a published stable `X.Y.Z` version without a leading `v`:

```bash
RELEASE_VERSION='<published-X.Y.Z-version>'
helm upgrade --install k8ston oci://ghcr.io/egose/charts/k8ston \
  --version "$RELEASE_VERSION" \
  --namespace k8ston \
  --values k8ston-values.yaml \
  --set-string image.tag="$RELEASE_VERSION" \
  --wait
```

**Pin both chart and image.** Publishing stamps chart `version` and `appVersion`
from the release tag, but the checked-in image default is still `latest`.
`--version` alone does **not** pin the deployed app. If the registry requires
authentication, use `helm registry login ghcr.io` before pulling the chart.

| Key                                                     | Default                           | Notes                                                                                                              |
| ------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `image.repository` / `image.tag`                        | `ghcr.io/egose/k8ston` / `latest` | Explicitly pin the app image.                                                                                      |
| `env` / `envSecretName`                                 | `{}` / `''`                       | Non-secret configuration inline; signing/provider secrets in an existing Secret.                                   |
| `rbac.scope`                                            | `namespace`                       | Own namespace, or `cluster` for cluster-wide RBAC.                                                                 |
| `rbac.extraNamespaces`                                  | `[]`                              | With namespace scope: extra Roles/RoleBindings and a derived application allowlist; namespaces must already exist. |
| `restartEnabled`                                        | `false`                           | Drives the runtime flag and workload RBAC together.                                                                |
| `accessConfig.enabled`                                  | `false`                           | Creates the `access.json` ConfigMap; configure its `data` explicitly.                                              |
| `ingress.enabled`, `route.enabled`, `httpRoute.enabled` | `false`                           | Ingress, OpenShift Route, or Gateway API HTTPRoute.                                                                |

The chart derives managed environment settings from RBAC, restart, and access-config
values. Conflicting overrides fail rendering. Local `env` wins over `global.env`;
do not shadow managed settings with `extraEnv` or the referenced Secret.
With `rbac.create=false`, you must supply matching permissions yourself.

Only [helm/k8ston](helm/k8ston/) is published to OCI. The local
[helm/main](helm/main/) umbrella chart adds a NetworkPolicy and nests app values
under `k8ston:`; its `networkPolicy` settings remain at the top level.
See the [umbrella defaults](helm/main/values.yaml), [example](helm/main/values-example.yaml),
and [production example](helm/main/values-k8s-prod.example.yaml).
With the umbrella's NetworkPolicy enabled, OpenShift Routes need
`networkPolicy.allowOpenShiftIngress=true`; other ingress controllers need appropriate
ingress allowances. The direct chart and raw manifests do not include that NetworkPolicy.

For values, dependency usage, and upgrade notes, see the [chart reference](helm/k8ston/README.md).

For either deployment path, keep the ServiceAccount token mounted. The `/api/config`
probe does not check Kubernetes connectivity or OIDC discovery: verify a real login,
allowed Secret operations, and an unauthorized-user denial before production use.
Changes to environment values in ConfigMaps/Secrets require an app rollout; changing
the signing key invalidates existing sessions.

## Configuration reference

These are **runtime defaults from [config.ts](app/lib/config.ts) and [k8s.ts](app/lib/k8s.ts)**, not values
from the development examples. See [.env.example](app/.env.example) and the
[configuration guide](website/docs/guides/configuration.mdx) for more context.

| Variable                                    | Default                          | Purpose                                                                                                      |
| ------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `K8STON_SCOPE`                              | `namespace`                      | Own namespace, or `cluster` for multi-namespace application scope.                                           |
| `POD_NAMESPACE`, `K8STON_NAMESPACE`         | `k8ston` fallback                | App namespace; mounted ServiceAccount namespace takes precedence in-cluster, then these env values in order. |
| `K8STON_NAMESPACES`                         | Empty                            | Comma-separated allowlist for cluster scope; empty requires namespace discovery permissions.                 |
| `K8STON_HISTORY_LIMIT`                      | `20`                             | Retained eligible snapshots per live UID; integer 1–100. Invalid settings fail with 503.                     |
| `K8STON_MANAGED_ONLY`                       | `true`                           | Hides live Secrets lacking the `k8ston.io/managed-by=k8ston` annotation (with the default prefix).           |
| `K8STON_ANNOTATION_PREFIX`                  | `k8ston.io`                      | Metadata key prefix; keep consistent across writer replicas and upgrades.                                    |
| `K8STON_ACCESS_CONFIGMAP`                   | `k8ston-access`                  | Policy ConfigMap in the app namespace, using key `access.json`.                                              |
| `K8STON_ADMIN_GROUPS`, `K8STON_ADMIN_USERS` | Empty                            | Comma-separated admin groups/emails; **leaving both empty makes every authenticated user an admin**.         |
| `K8STON_ETCD_ENCRYPTED`                     | `false`                          | Acknowledges independently configured encryption at rest; controls the warning.                              |
| `K8STON_IMPERSONATION`                      | `false`                          | Adds Kubernetes authorization as the human identity; needs impersonation grants.                             |
| `K8STON_RESTART_ENABLED`                    | `false`                          | Enables workload rollout requests; needs `list`/`patch` on all three supported `apps` resources.             |
| `AUTH_DISABLED`                             | `false`                          | Mock-admin authentication bypass; development only.                                                          |
| `SESSION_SECRET`                            | None                             | Required with auth: fresh random signing key, at least 32 characters.                                        |
| `SESSION_MAX_AGE`                           | `28800`                          | Session lifetime in seconds (8 hours).                                                                       |
| `OIDC_ISSUER`                               | None                             | Provider issuer identifier, **not** its discovery-document URL.                                              |
| `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`      | None                             | Registered client ID and provider-dependent client secret.                                                   |
| `OIDC_ALLOW_HTTP`                           | `false`                          | HTTP issuers only on loopback, with explicit opt-in and outside production.                                  |
| `OIDC_SCOPES`                               | `openid profile email groups`    | Requested scopes; adjust to your provider's supported scopes.                                                |
| `OIDC_GROUPS_CLAIM`                         | `groups`                         | Group claim path; dotted paths supported, with documented fallback claims.                                   |
| `OIDC_USERNAME_CLAIM`, `OIDC_NAME_CLAIM`    | `email`, `name`                  | Identity and display-name claim mapping.                                                                     |
| `APP_URL`, `NEXT_PUBLIC_APP_URL`            | `http://localhost:3000` fallback | Public base URL used for authentication redirects; precedence explained below.                               |
| `OIDC_REDIRECT_URI`                         | `<app-url>/api/auth/callback`    | Explicit callback override; must match provider registration exactly.                                        |

**Build versus runtime URL:** `NEXT_PUBLIC_APP_URL` takes precedence over `APP_URL`
and can be baked into the build by Next.js. For an image promoted between environments,
prefer runtime `APP_URL` and do not bake in a conflicting `NEXT_PUBLIC_APP_URL`.
The `.env.example` uses `NEXT_PUBLIC_APP_URL` for local development.

An explicit namespace allowlist avoids namespace-list calls but neither proves that
namespaces exist nor grants Kubernetes access to them. Namespace discovery failures
are errors, not a fallback to the pod namespace.

## Security model (read before production)

Base64 is **encoding, not encryption**. Confirm your cluster's encryption-at-rest
configuration for Secrets and backups before storing production credentials.
Setting `K8STON_ETCD_ENCRYPTED=true` only dismisses the warning.

K8ston masks values visually, avoids Secret values in audit/error diagnostics,
and applies request/data-size guards. Masking is not an authorization boundary:
an authorized browser receives the Secret data. Application rules also do not
restrict direct Kubernetes clients; Kubernetes RBAC remains essential.

Use TLS, explicit admins and namespace policies, scoped ServiceAccount permissions,
consistent random session keys, pinned images, and suitable network controls.
Ensure network policies permit DNS, Kubernetes API access, and your OIDC provider;
the umbrella's default API-port egress allowance is not an IdP-specific allowlist.
Keep signing keys and OIDC credentials out of Git, shell history, and logs.

See the [security model](website/docs/about/security-model.mdx) for assumptions and hardening.

## Access control (summary)

Within application scope and live-object visibility, decisions are:
**admin → nonempty per-Secret ACL → namespace/team fallback**.

- A grant permits reading **and managing** a Secret; K8ston ACLs are not separate
  read-only roles. Admins bypass those ACLs, not scope, visibility, native constraints,
  or Kubernetes RBAC.
- `k8ston.io/allowed-groups` and `k8ston.io/allowed-users` annotations override
  namespace/team rules for non-admins when either is nonempty. Group matching is exact;
  email matching ignores case. API entries must be comma-free and nonblank;
  `[]` clears a field, while omitted update fields keep stored values.
- Without a per-Secret ACL, namespace members can manage all teams; unassigned
  Secrets use namespace rules alone. Team assignment uses `k8ston.io/team` and
  the policy's optional `teams` list (up to 64 unique DNS-label names per namespace).
  Creation and team moves require rights in the chosen namespace/team; proposed
  per-Secret ACLs do not grant permission to create.
- Missing ConfigMap (`Kubernetes 404`), valid `access.json: '{}'`, and an omitted
  namespace entry intentionally leave fallback access open to authenticated users.
  An existing ConfigMap with missing/blank `access.json`, invalid policy, or a failed
  read returns **503** when policy is needed. Non-admin lists also need policy for creation hints.
- Valid policy and confirmed absence are cached for 60 seconds per process.
  Failed refreshes do not reuse expired policy. Policy reads use the ServiceAccount
  even when human operations are impersonated.
- Managed-only mode hides unmanaged live Secrets even from admins. Set
  `K8STON_MANAGED_ONLY=false` only deliberately: saving an eligible external Secret
  adopts it by stamping K8ston metadata. History objects are always hidden from
  direct named-Secret access; read/restore them through the authorized live Secret.
- Impersonation requires ServiceAccount permission to impersonate the session email
  and **all** its groups, plus matching human RBAC. Application authorization still applies.
  `AUTH_DISABLED=true` bypasses impersonation as well as per-user authentication.

See the [authorization guide](website/docs/guides/authorization.mdx) and
[application reference](app/README.md) for complete team rules and upgrade behavior.

## Versioning, restarts, and API budgets (summary)

- Created Secrets start at `k8ston.io/version=1`. Update and restore capture prior
  native bytes in immutable `k8ston-h-<hash>-vN` snapshots, then replace the live
  object using its Kubernetes revision. Updates, restores, and deletes require the
  caller's expected `resourceVersion`; stale revisions return 409. Reload and review
  before retrying rather than silently overwriting someone else's edit.
- History is bound to one live UID. Deleting/recreating a name does not attach old
  history to the replacement. Legacy unbound snapshots remain quarantined for
  operator-reviewed recovery. Retention runs on update/restore attempts, not in a
  background job. Multi-object writes and cleanup are **not transactional**; a snapshot
  may survive a failed live write, and retained history is not an independent backup.
- Create/update text maps are plaintext, not base64. Detail/history responses split
  text `data` from read-only base64 `binaryData`. Binary-containing Secrets accept
  metadata-only edits, and immutable Secrets cannot change bytes. Service-account
  token create/update/restore operations are unsupported; use Kubernetes token tooling.
- Restart requests discover explicit same-namespace references in Deployments,
  StatefulSets, and DaemonSets, then send revision-tested patches with at most four
  in flight per request. They do not discover Jobs/CronJobs or arbitrary runtime consumers.
  Acknowledgement means **rollout requested**, not completed or healthy. Clients must
  inspect `requested`, `no_targets`, `partial` (207), or `failed` (503) results.
- JSON API responses and auth redirects send `Cache-Control: no-store`. Create,
  update, and restore bodies have a 16 MiB JSON-envelope limit **in addition to** the 1 MiB Secret
  data guard. Lists are paginated with fixed collection budgets; incomplete inventories
  return errors rather than silently truncated success. Authenticated APIs use the
  `k8ston_session` cookie established by OIDC sign-in.

For request/response details, see the [API overview](website/docs/api/overview.mdx),
[Secret API](website/docs/api/secrets.mdx), [history guide](website/docs/guides/versioning-history.mdx),
and [consumer-restart guide](website/docs/guides/consumer-restarts.mdx).

## Docs site

The [website](website/) is a separate Docusaurus project for About, Guides, and API
documentation. Its configured public URL is https://k8ston.pages.dev/.

```bash
pnpm --dir website install --frozen-lockfile
pnpm --dir website start --port 3001
pnpm --dir website build
```

The separate port avoids the app's port `3000`. The root workspace includes only
`app`, so root `pnpm install` does not install website dependencies.
Website build output goes to `website/build`; CI builds on `main` and deploys that
output to the `cf-pages` branch.

## Development and testing

Install root workspace dependencies if you have not already, then run backend tests:

```bash
pnpm install --frozen-lockfile
pnpm test:unit
pnpm test:unit app/tests/auth-oidc.test.ts
```

Unit tests use synthetic fixtures, disable `.env` loading, and block Kubernetes
credential loaders; no cluster or identity provider is required.
The app uses Next.js App Router and React; see [app/package.json](app/package.json)
for current dependency versions.

```bash
pnpm --dir app dev --hostname 127.0.0.1
pnpm --dir app lint
pnpm --dir app build
pnpm --dir app start --hostname 127.0.0.1
```

Browser verification needs a production build and Chromium. Playwright starts its
server on port `3100` and mocks Kubernetes-backed HTTP APIs: these tests are not
proof of real cluster RBAC or end-to-end OIDC integration. Use the sandbox for that.

```bash
pnpm --dir app exec playwright install chromium
pnpm --dir app e2e
```

On Linux, missing browser system dependencies may require Playwright's
`install --with-deps chromium` instead.

For a focused build/browser check **without loading developer `.env` files**:

```bash
mkdir -p app/tests/.runtime
TMPDIR="$PWD/app/tests/.runtime" \
  NODE_OPTIONS="--require=$PWD/app/tests/helpers/offline-runtime.cjs" \
  pnpm --dir app build
CI=1 TMPDIR="$PWD/app/tests/.runtime" \
  NODE_OPTIONS="--require=$PWD/app/tests/helpers/offline-runtime.cjs" \
  pnpm --dir app e2e --project=chromium-dark --workers=2 secret-data.spec.ts
```

The preload supplies synthetic test settings, not deployment configuration.
Reports/build output stay under `app/`, and browser temporary files under `app/tests/.runtime/`.

Additional static checks:

```bash
pnpm exec prettier --check README.md
make verify-sandbox
helm lint helm/k8ston
helm/k8ston/tests/render-regressions.sh
```

`make verify-sandbox` checks Compose configuration and manifest structure without
a cluster; it requires Python/PyYAML and does not replace server-side Kubernetes validation.
For contributions, keep changes focused, add relevant regressions, and follow the
repository's [Conventional Commit configuration](commitlint.config.mjs).

## CI/CD and releases

Workflows in [.github/workflows](.github/workflows/):

- [test.yml](.github/workflows/test.yml) — backend tests, app lint/build, and Chromium
  browser tests; Markdown-only changes are excluded by its path filter.
- [helm.yml](.github/workflows/helm.yml) — lint/template both charts and assert rendered regressions.
- [pre-commit.yml](.github/workflows/pre-commit.yml) — repository hooks, including formatting and secret scanning.
- [docusaurus.yml](.github/workflows/docusaurus.yml) — build/deploy documentation on `main`.
- [publish.yml](.github/workflows/publish.yml) — on `v*.*.*` tags, build/scan/publish
  `ghcr.io/egose/k8ston`: `latest`, full version, and stable major/minor aliases.
- [publish-helm.yml](.github/workflows/publish-helm.yml) — on `v*.*.*` tags, stamp
  chart metadata, lint/package/push to `oci://ghcr.io/egose/charts/k8ston`, and verify a pull.
- [release-tag-changelog.yml](.github/workflows/release-tag-changelog.yml) — manually
  dispatched release-tag workflow with an optional version input.

Local release configuration is in [.release-it.json](.release-it.json);
[release-artifact.config.json](release-artifact.config.json) configures repo-toolkit artifacts.
Formatting, secret scanning, and commit-message hooks are defined in
[.pre-commit-config.yaml](.pre-commit-config.yaml).

Docker (context: repo root):

```bash
docker build -t k8ston:sandbox -f Dockerfile .
```

The [Dockerfile](Dockerfile) builds a standalone Next server and runs it at
`app/server.js` as UID `65532` on port `3000`. The Helm chart uses a read-only root
filesystem and a writable `/tmp` `emptyDir`. Container images do not contain a
database, and need Kubernetes connectivity and runtime auth configuration.

## Troubleshooting

- **Empty list or 404 for an existing Secret:** check application scope and
  `K8STON_MANAGED_ONLY`; unmanaged Secrets and direct history-object access are hidden even from admins.
- **503 namespace policy unavailable:** check ServiceAccount ConfigMap permissions,
  the `access.json` key, and policy validity. A read failure is not an intentionally absent policy.
- **Cluster scope without namespace-list permission:** configure an explicit
  `K8STON_NAMESPACES` allowlist and matching Secret permissions; there is no automatic namespace fallback.
- **403 on Secret operations or restarts:** check both application rules and
  Kubernetes permissions. In impersonation mode, check all impersonation grants
  and human RBAC. Restart discovery/patches need permissions for all three workload kinds.
- **Login errors:** validate the random `SESSION_SECRET`, issuer identifier,
  supported scopes, and exact callback URL. Start a new login after callback failure.
  HTTP Dex is supported only for loopback development with `OIDC_ALLOW_HTTP=true`, never production.
- **Sandbox context/provider issues:** `make kind-up` selects the sandbox context;
  `make logs` shows Dex logs. Check
  `http://localhost:5556/dex/.well-known/openid-configuration` and restart the app
  after changing OIDC settings or restarting Dex (discovery is cached per process).
- **In-cluster sandbox auth:** a pod's `localhost` is not host-side Dex.
  Auth-disabled runs can validate ServiceAccount access, but **cannot** validate
  per-user ACLs. Use auth-enabled session fixtures for headless authorization
  checks, or a mutually reachable HTTPS provider for real in-cluster SSO.

See the [troubleshooting guide](website/docs/guides/troubleshooting.mdx).
When [reporting an issue](https://github.com/egose/k8ston/issues), include reproduction
steps, deployment scope, and sanitized status codes; never attach Secret values,
session cookies, kubeconfigs, or provider credentials.

## License

Package metadata declares **Apache-2.0**; see [package.json](package.json).
