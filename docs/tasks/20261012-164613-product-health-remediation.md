# K8ston product-health review and remediation

Created: 2026-10-12 16:46:13 (repository-local timestamp)

## Objective and business context

K8ston is a lightweight, stateless secret-management UI/API over native Kubernetes
Secrets. Its users need to create and rotate credentials, restrict team access,
recover earlier values, and restart consumers without learning cluster credentials.
Kubernetes remains the system of record: ownership, optimistic concurrency, RBAC,
and native data must survive operations through K8ston.

This plan closes evidenced security/correctness gaps and improves operator recovery,
bounded resource use, deployment usability, and testable subsystem boundaries. It
follows the requested `task-as-you-go` skill. Every numbered task is authorized for
implementation, with a fresh isolated sub-agent executing each task sequentially.

## Scope, analysis coverage, and constraints

- Inspected: `app/README.md`, package metadata, all API routes, authentication,
  authorization, Kubernetes transport, namespace policy, secret validation/history,
  main CRUD/history/value-preview components, browser tests, relevant website guides
  and API contracts, Helm deployment/RBAC templates, Dockerfile, and CI commands.
- No existing `docs/tasks` backlog or roadmap/review task files were found to duplicate.
- The backend review traced guards and callers; three synthetic probes additionally
  confirmed repeated-header replacement, lossy data conversion, and missing-cookie
  OIDC exchange behavior. These were not live-cluster or deployed-IdP security tests.
- Baseline worktree was clean. Private credentials and environment files were not
  inspected. Live Kubernetes/OIDC deployments, full dependency auditing, and production
  load measurements are outside this review's evidence. Do not imply exhaustive coverage.
- Work, temporary fixtures, generated reports, and commands must remain repo-scoped.
  All commands below run from `<repo-root>` unless stated otherwise. Never record
  machine-specific absolute paths or actual secret values in this document.
- Do not change `CHANGELOG.md`, commit, publish, deploy, change real credentials, or
  modify an existing cluster. Use synthetic Kubernetes/OIDC fixtures.
- Read `app/AGENTS.md` and the relevant installed guides under
  `app/node_modules/next/dist/docs/` before app changes. Next.js 16.4 conventions apply.
- Preserve the documented bootstrap/open-policy behavior for intentionally absent
  rules, explicit per-secret ACL precedence, managed-only default, opt-in restarts,
  and database-free architecture. Errors must not be confused with absent policy.
- Public contract changes require accompanying API/guide updates and upgrade notes
  in `app/README.md` or website guides, never in `CHANGELOG.md`.

## Baseline verification

Actually run before implementation:

- `git status --short`: clean.
- `node --version`: v26.11.1; `pnpm --version`: 11.24.0.
- `pnpm --dir app lint`: passed.
- `pnpm --dir app exec tsc --noEmit --incremental false`: passed.
- `pnpm exec vitest --version`: 5.0.3 available; root already declares Vitest.
- `helm version --short`: v4.3.0 available.

Not run at planning time: app production build, browser suite, website checks, Helm
render matrix, and artifact smoke. They are required at the relevant task/integration
stage. Existing Playwright tests mostly mock API results; they do not verify backend
authorization, Kubernetes preconditions, or historical-data integrity.

## Priorities and execution protocol

- **P1:** access-boundary or stored-secret integrity failures; address first.
- **P2:** operational correctness, recoverability, bounded work, and usable workflows.
- **P3:** independently valuable polish; none is promoted without concrete evidence.

Execution order is KRY-01 through KRY-08, the discovered ACL-boundary follow-up
KRY-15, KRY-09 through KRY-11, documentation follow-up KRY-13, rollout-precondition
follow-up KRY-14, then independent review KRY-12, strictly one sub-agent at a time.
Dependencies
below name behavioral prerequisites; the sequential order also protects shared files
(`secrets.ts`, route handlers, public DTOs, README, tests, and build output). Do not
spawn child agents or run concurrent builds. The coordinator marks a task
`in_progress` before dispatch; its assigned agent updates only that task's status and
completion evidence after verification. The final reviewer is a fresh agent that did
not implement prior tasks. Independent findings get a new task ID before work starts.

### Shared verification

- **U (introduced by KRY-01):** `pnpm test:unit` runs Node-only backend regressions
  through `app/vitest.config.ts`; individual files can be passed for focused runs.
- **A:** `pnpm --dir app lint` and
  `pnpm --dir app exec tsc --noEmit --incremental false`.
- **B:** `pnpm --dir app build`, then
  `pnpm --dir app e2e --project=chromium-dark <affected-spec>` for UI changes.
  Tests use mocked APIs, an available Chromium installation, and local port 3100.
- **W:** `pnpm --dir website typecheck` and `pnpm --dir website build`.
- **H:** `helm lint helm/k8ston`, the regression render checks introduced in KRY-11,
  and the umbrella chart lint/template commands from `.github/workflows/helm.yml`.
- Run focused tests with each fix; run the combined full checks once at integration.
  Never mark completion based only on writing code. Record exact commands/results;
  if a required prerequisite is missing, mark `blocked` with the prerequisite.

## Executable tasks

### Task KRY-01: Fail closed on invalid sessions and incomplete OIDC transactions

Status: completed

Kind: defect

Priority: P1 — a public fallback signing key can authenticate forged identities when misconfigured.

Suggested agent: authentication and backend-test engineer

Dependencies: none

Primary ownership: `app/lib/auth.ts`, authentication settings in `app/lib/config.ts`,
`app/vitest.config.ts`, `app/tests/auth*.test.ts`, root test script, CI unit-test step,
authentication docs and example configuration.

Finding: `sessionKey()` accepts the source-visible development signing key when
`SESSION_SECRET` is absent. OIDC callback cookies can be undefined during token
exchange, UserInfo uses `skipSubjectCheck`, and normal nested Keycloak realm roles
are omitted from automatic fallback. Existing browser mocks do not exercise these.

References: `app/lib/config.ts:70-72`; `app/lib/auth.ts` (`sessionKey`,
`verifySessionToken`, `extractGroups`, `handleOidcCallback`, lines 18-55, 141-160,
196-250); `package.json:29-41`; `.github/workflows/test.yml`.

Requirements:

1. Add a minimal Node-only Vitest setup with the app alias and synthetic cookies,
   OIDC, and Kubernetes seams; integrate its root script into CI. Keep tests with fixes.
2. With auth enabled, require an explicit signing key of at least 32 characters and
   reject the known development fallback. Keep build-time import and explicit local
   auth bypass usable. Validate HS256 session claims and expiry without leaking keys.
3. Require all transaction cookies before exchange, consume them once, and bind
   UserInfo to the verified ID-token subject. Preserve public redirect normalization
   and legitimate ID-token-only providers; mismatched identity claims never merge.
4. Resolve nested realm roles while preserving configured group-claim precedence.
5. Document the fail-closed configuration/upgrade behavior without changing changelog.

Acceptance criteria:

- Missing, empty, short, and known fallback keys cannot authenticate/create sessions
  with auth enabled; valid, expired, wrong-algorithm, and forged JWT cases are tested.
- Missing transaction cookies prevent token exchange; state/nonce/PKCE validation,
  subject mismatch, ID-token-only fallback, redirect normalization, and realm roles
  have meaningful regressions.
- Unit tests run offline with synthetic data, and CI invokes them.

Verification: focused U authentication tests and A; inspect updated docs against code.

Completion evidence:

- Changed auth/runtime contracts in `app/lib/auth.ts`, `app/lib/config.ts`, and
  `app/app/api/auth/login/route.ts`: lazy fail-closed signing-key validation,
  HS256/required claims/expiry checks, keyless explicit bypass, complete consumed
  OIDC transactions, subject-bound UserInfo, and nested realm-role fallback.
- Added `app/vitest.config.ts`, `app/tests/auth-session.test.ts`,
  `app/tests/auth-oidc.test.ts`, `app/tests/setup.ts`, and helpers under
  `app/tests/helpers/`. Root `package.json` and `.github/workflows/test.yml`
  invoke the installed Vitest. Environment, cookies, and provider HTTP are synthetic;
  `.env` loading is disabled and Kubernetes credential loaders are blocked.
- Updated and checked contracts/upgrade guidance in `app/.env.example`,
  `app/README.md`, `website/docs/guides/authentication.mdx`,
  `website/docs/guides/configuration.mdx`, and `website/docs/api/auth.mdx`.
- Verified `pnpm test:unit app/tests/auth-session.test.ts app/tests/auth-oidc.test.ts`
  (69 passed); after adding two callback-route regressions, final `pnpm test:unit`
  passed **71 tests in 2 files** (31 session, 40 OIDC).
- `pnpm --dir app lint`,
  `pnpm --dir app exec tsc --noEmit --incremental false`, and
  `git diff --check` passed. Diff/status review found only intended task files;
  `git diff --exit-code -- CHANGELOG.md` passed (untouched).
- Limits: no live Kubernetes/IdP or real credential access; build-time imports were
  tested, not a production build. Browser, website-build, and artifact verification
  remain for integration. Installed Vite emits a non-failing future native-loader
  warning for the required `.ts` config in the CommonJS app package.
- Coordinator triage: existing `app/app/api/auth/callback/route.ts` logs raw IdP
  `error_description` (`idpDescription`); consider redaction in KRY-08 or a follow-up.
  Auth API documentation now reflects that behavior; production logging was not
  expanded. New signing-key and UserInfo subject-mismatch errors omit secret/claim values.

### Task KRY-02: Preserve authorization during policy failures and hide direct snapshots

Status: completed

Kind: defect

Priority: P1 — policy failures become unrestricted access; historical ACLs can bypass revocation.

Suggested agent: authorization-boundary engineer

Dependencies: KRY-01

Primary ownership: `app/lib/authz.ts`, a focused shared live-secret access boundary,
named-secret/action routes, `app/tests/authz*.test.ts`, authorization docs.

Finding: failed/invalid ConfigMap reads are cached as `{}` and interpreted as open
access. `assertManagedVisible()` allows direct history-object access when legacy
mode is enabled; snapshots retain old ACLs. Repeated route guards risk drift.

References: `app/lib/authz.ts` (`getNamespaceAccessMap`, `assertManagedVisible`,
`canAccessSecret`, lines 54-138); all five named-secret/action route files.

Requirements:

1. Separate intentional policy absence (404) from invalid/missing payload or failed
   reads. Return controlled unavailable/denied results for the latter; never cache
   an error-derived allow-all map. Preserve documented admin/explicit-ACL precedence.
2. Coalesce concurrent cache misses; make expiry/refetch behavior testable. Log only
   sanitized metadata, not raw Kubernetes error objects or policy payloads.
3. Reject history objects at the shared live-secret boundary in both managed-only
   modes, including GET/PUT/DELETE/history/restore/restart entry paths. Consolidate
   repeated live-object authorization where it removes guard duplication.

Acceptance criteria:

- Non-admin reads/creation cannot open on JSON/schema errors, missing policy data,
  403, timeout, or refresh failure; a truly absent ConfigMap remains intentionally open.
- Concurrent misses issue one policy read, with tested TTL and retry behavior.
- A user removed from a live ACL cannot obtain or mutate snapshots via direct paths;
  tests cover both visibility modes and all named-secret action paths.

Verification: focused U policy/route tests and A; docs agree on absence versus failure.

Completion evidence:

- `app/lib/authz.ts` and `app/lib/validation.ts` now distinguish confirmed
  ConfigMap 404 absence from missing/blank payload, JSON/schema errors (including
  unknown rule fields), and failed reads. Required-policy failures return a
  sanitized 503; admin/bootstrap and explicit live ACL precedence remain intact.
  The process-local 60s cache starts at successful read completion, coalesces
  concurrent misses, discards expired policy before refresh, and retries failed
  reads on the next request. Logs contain only classified reason/numeric status.
- Added `app/lib/secret-access.ts` and shared live visibility in
  `app/lib/secrets.ts`. Wired the boundary into
  `app/app/api/namespaces/[namespace]/secrets/[name]/route.ts`,
  `app/app/api/namespaces/[namespace]/secrets/[name]/versions/route.ts`,
  `app/app/api/namespaces/[namespace]/secrets/[name]/restore/route.ts`, and
  `app/app/api/namespaces/[namespace]/secrets/[name]/restart-consumers/route.ts`.
  GET/PUT/DELETE/history/restore/restart reject direct history objects with 404
  in both visibility modes, including for admins and managed-stamped snapshots.
  Current live rules are checked before history reads or any side effects;
  authentication, namespace gates, and restart opt-in remain enforced.
- `app/app/api/namespaces/[namespace]/secrets/route.ts` uses shared list visibility.
  Non-admin list/creation policy failures return 503, including empty lists and
  explicit-ACL-only lists whose `canCreate` hint still requires namespace policy.
- Added `app/tests/authz-policy.test.ts`, `app/tests/authz-routes.test.ts`, and
  `app/tests/helpers/kubernetes.ts`, reusing KRY-01's environment/cookie isolation
  and blocked credential loaders. Real handlers exercise synthetic Core/Apps
  clients, live ACL revocation/direct snapshots, all named operations in both
  modes, authorization precedence, namespace/authentication gates, sanitized
  failures, exact TTL boundaries, concurrent refresh, and immediate repair retry.
- Updated contract/upgrade guidance in `app/README.md`,
  `website/docs/guides/authorization.mdx`,
  `website/docs/about/architecture.mdx`,
  `website/docs/about/security-model.mdx`,
  `website/docs/api/overview.mdx`, `website/docs/api/secrets.mdx`,
  `website/docs/api/versions.mdx`, and
  `website/docs/guides/versioning-history.mdx`; reviewed against the handlers.
- `pnpm test:unit app/tests/authz-policy.test.ts app/tests/authz-routes.test.ts`
  passed **114 tests in 2 files** (43 policy, 71 route). Final `pnpm test:unit`
  passed **185 tests in 4 files**, including all 71 earlier authentication tests.
  `pnpm --dir app lint`,
  `pnpm --dir app exec tsc --noEmit --incremental false`, and
  `git diff --check` passed. Diff/status review and
  `git diff --exit-code -- CHANGELOG.md` confirmed the changelog is untouched.
- Limits: synthetic offline handler/client tests, no live Kubernetes/IdP or
  credential access. Production/browser/website-build verification remains for
  integration. The existing non-failing Vite native-loader warning persists.
  Policy propagation retains a per-process 60s TTL. Snapshot UID/lifetime binding
  remains KRY-05's work and mutation concurrency/contracts remain KRY-06's work;
  this task changes neither. Only KRY-02's status was updated.

### Task KRY-03: Carry the complete impersonated identity to every Kubernetes request

Status: completed

Kind: defect

Priority: P1 — optional human-RBAC mode can execute with an incomplete or bypassed identity.

Suggested agent: Kubernetes transport engineer

Dependencies: KRY-01, KRY-02

Primary ownership: `app/lib/k8s.ts`, workload-list request options,
`app/tests/impersonation*.test.ts`, impersonation documentation.

Finding: repeated `setHeaderOptions` overwrites earlier groups; a real OIDC email
matching the development user bypasses impersonation; workload lists omit options.

References: `app/lib/k8s.ts` (`impersonationHeaders`, `requestOptions`, `patchOptions`,
lines 59-85); `app/lib/secrets.ts:315-319`; installed client-node transport APIs.

Requirements:

1. Use the installed SDK's supported transport extension to send distinct repeated
   Impersonate-Group headers, preserving all supported groups or failing explicitly
   on a documented bound rather than silently truncating authorization identity.
2. Tie the local bypass to explicit auth-disabled mode, not an email string.
3. Apply options to workload lists and patches and preserve TLS, auth, and patch
   content type. Avoid global mutable user state or cross-request identity leakage.

Acceptance criteria:

- A synthetic loopback transport capture sees every group as a distinct group value,
  the correct user, and strategic-merge content type; two users stay isolated.
- A real session with the development email is impersonated. Workload operations
  all carry identity; explicit local bypass and hybrid mode remain usable.

Verification: focused U transport/call-site tests and A; no real kubeconfig/cluster use.

Completion evidence:

- `app/lib/k8s.ts` uses client-node v2's supported per-call `httpApi` override
  (`wrapHttpLibrary`/`ResponseContext`) and Undici raw header pairs. Every group
  is sent separately; the request captures its own email/group copy and retains
  SDK-applied authentication, TLS dispatcher, request body/signal, and patch
  middleware. `app/package.json` and `pnpm-lock.yaml` declare the already-installed
  Undici 8.11.2 directly. No SDK internals or global human-identity state are mutated.
- Bypass now depends on `AUTH_DISABLED`, not the development email. All three
  workload lists in `app/lib/secrets.ts` receive identity options, as do their
  strategic-merge patches. Traced namespace, live-access, CRUD, and history callers
  retain their existing per-user options. `app/lib/authz.ts` explicitly documents
  the intentional ServiceAccount policy read and its existing shared cache;
  `app/lib/config.ts` clarifies the impersonation contract.
- Added `app/tests/impersonation-transport.test.ts`,
  `app/tests/impersonation-callsites.test.ts`, and
  `app/tests/helpers/kubernetes-transport.ts`, reusing the isolated unit setup and
  client-acquisition helper. Real generated Core/Apps clients send to loopback
  HTTP/HTTPS servers with synthetic configuration; assertions inspect HTTP
  `rawHeaders`, not mocked options or coalesced header maps.
- Wire captures verify **0, 1, 33, and 256 groups**, including a literal-comma
  group; two overlapping users on one client; defensive identity copies; the
  correct user, ServiceAccount bearer token, and strategic-merge content type.
  HTTPS checks verify custom CA/server-name handling, fresh configured auth, and
  rejection of untrusted certificates/wrong names. Nine real handler paths use a
  signed `dev@k8ston.local` session with **36 groups**, covering namespace/secret
  operations, history creation/list/pruning/deletion/restore, and all six workload
  list/patch calls. Hybrid/local bypass work; two humans coalesce one service-policy
  read and receive their own authorization decisions from the shared cache.
- Updated impersonation/upgrade contracts in `app/README.md`,
  `website/docs/guides/authorization.mdx`,
  `website/docs/guides/configuration.mdx`,
  `website/docs/about/architecture.mdx`, and
  `website/docs/about/security-model.mdx`; reviewed against implementation.
  No application group-count cap remains. Empty, non-printable/non-ASCII, or
  surrounding-whitespace identity fields explicitly fail with 400; upstream
  header-size limits can reject whole requests. Impersonated requests do not
  follow redirects. These transport limits and complete-group RBAC requirements
  are documented rather than silently altering identity.
- Initial `pnpm test:unit app/tests/impersonation-transport.test.ts app/tests/impersonation-callsites.test.ts`
  passed **32 tests in 2 files** (20 transport, 12 callsite). Final
  `pnpm test:unit app/tests/impersonation-transport.test.ts app/tests/impersonation-callsites.test.ts app/tests/authz-policy.test.ts app/tests/authz-routes.test.ts`
  passed **146 tests in 4 files**, including 43 policy and 71 prior route regressions.
  `pnpm --dir app lint`,
  `pnpm --dir app exec tsc --noEmit --incremental false`, and
  `git diff --check` passed. Diff/status review preserved the existing KRY-01/02
  work; `git diff --exit-code -- CHANGELOG.md` passed (untouched).
- Limits: no actual credential, kubeconfig, cluster, or IdP access; TLS material is
  explicitly synthetic test data. Proxy/mTLS deployments and production builds,
  browser, website, and artifact checks remain integration/deployment verification.
  Workload matching/result collection remains KRY-07. Only KRY-03's status changed.
  The existing non-failing Vite config-loader warning persists. Initial parallel
  pnpm checks raced automatic dependency relinking (`ENOENT` for `lightningcss`);
  subsequent checks ran serially and passed after fixing the reported type errors.
- Coordinator triage: existing `app/lib/k8s.ts` `toK8sError()` always attributes a
  403 to missing app RBAC, including human-RBAC/impersonation denials. Consider
  correcting that diagnostic in KRY-08; transport status/error decoding is preserved.

### Task KRY-04: Preserve native Secret bytes, keys, and lifecycle metadata

Status: completed

Kind: defect

Priority: P1 — current conversions and replacements can silently lose stored data or ownership.

Suggested agent: secret-data and validation engineer

Dependencies: KRY-01, KRY-02

Primary ownership: data/DTO/building functions in `app/lib/secrets.ts`,
`app/lib/validation.ts`, create/update/restore validation, affected form/detail
components, `app/tests/secret-data*.test.ts`, data-contract documentation.

Finding: UTF-8 decode/re-encode corrupts arbitrary binary history, plain-object
assignment/Zod can discard `__proto__`, and replacement omits ownerReferences,
finalizers, and immutable. UI duplicate checks also reject inherited property names.

References: `app/lib/secrets.ts` (`decodeData`, `encodeData`, `buildLiveSecret`,
lines 42-57, 198-238); `app/lib/validation.ts:31-54`;
`app/components/secret-form.ts:192-213`; restore handler's decoded-data construction.

Requirements:

1. Preserve raw base64 bytes during restore. Distinguish unsupported binary text
   values in DTO/UI from empty or replacement-character text; prevent lossy text
   edits before snapshots/writes and provide an actionable operator message.
2. Handle own keys safely end-to-end, including `__proto__`, `constructor`, and
   `toString`; if a valid key cannot be supported, explicitly reject it before any
   parser strips it, with docs/tests. Prefer preservation.
3. Preserve native lifecycle metadata and immutable status. Metadata-only immutable
   updates remain possible; forbidden data edits fail before side effects.
4. Share key/type validation where practical; enforce required built-in type keys
   server-side and reject unsupported controller-owned token creation/editing
   explicitly rather than relying on a broken snapshot. Preserve custom types.

Acceptance criteria:

- Binary fixtures restore byte-for-byte; Unicode and special-key values round-trip
  without silent loss, with appropriate binary editing UI behavior.
- Ownership/finalizers/immutable survive updates/restores; rejected immutable or
  controller-owned data edits create no snapshot or live mutation.
- API and UI key/type validation agree on supported data.

Verification: focused U data/route tests, A, and B for changed data-edit/view behavior.

Completion evidence:

- `app/lib/secrets.ts` now separates lossless text `data` from original-base64
  `binaryData`, with names-only `binaryKeys` and summary `immutable`. The narrowly
  named `buildRawRestoreSecret` copies native snapshot data byte-for-byte. PUT and
  restore build/validate replacements before snapshots, retaining live UID, owner
  references, finalizers, immutable state, type, and other lifecycle metadata.
  Omitted PUT `data` preserves all bytes; unchanged immutable data is allowed,
  while changed immutable data and binary plaintext replacements fail before writes.
- Shared `app/lib/secret-rules.ts` / `app/lib/validation.ts` preserve own keys
  before Zod can strip `__proto__`, reject lossy text inputs, and enforce native
  built-in semantics (basic-auth username OR password; nonempty SSH key; TLS key
  presence; Docker JSON object/null). Custom types retain their native semantics
  and lose the UI-only 64-character cap. Service-account token create/update/restore
  explicitly return 422. Response-only `binaryData` writes and create-only
  `stringData` on PUT return 400 instead of silently ignoring intended values.
- Additional in-scope loss points were found in client-node's map codec and React
  Query's structural-sharing clone. `app/lib/k8s-secret-codec.ts` uses the SDK's
  factory/response-processor injection seam, wired by `app/lib/k8s.ts`, to preserve
  own Secret maps over real HTTP without changing global prototypes or transport
  identity. `app/components/providers.tsx` disables structural sharing specifically
  for secret/history queries. Existing KRY-01/02/03 work and tests were preserved.
- Updated `app/components/secret-form.tsx`, `secret-detail.tsx`,
  `version-history.tsx`, `reveal-value.tsx`, new `binary-value-dialog.tsx`, and
  `app/lib/api-client.ts`: masked, copyable base64 views; metadata-only binary and
  immutable forms; controller-token guidance; own-key forms and cache refreshes.
  DTO fixtures in `app/e2e/helpers.ts` and `cache-invalidation.spec.ts` use shared
  types. `app/README.md`, `website/docs/api/{overview,secrets,versions,restore}.mdx`,
  and `website/docs/guides/versioning-history.mdx` document contracts and upgrades.
- Added three `app/tests/secret-data*.test.ts` files, reusing existing environment,
  Kubernetes, and loopback helpers plus `app/tests/helpers/secret-data.ts`.
  Initial `pnpm test:unit app/tests/secret-data.test.ts app/tests/secret-data-routes.test.ts app/tests/secret-data-transport.test.ts`
  passed **92 tests**. After three input-boundary regressions, final
  `pnpm test:unit` passed **312 tests in 9 files**, including **95 KRY-04 tests**.
  Fixtures cover all 256 byte values, invalid UTF-8/control bytes, empty/replacement
  text, BOM/Unicode, special keys, native lifecycle/type boundaries, no-side-effect
  rejections, and real SDK read/list/create/replace/restore HTTP paths.
- `pnpm --dir app lint` and
  `pnpm --dir app exec tsc --noEmit --incremental false` passed. Read
  `app/AGENTS.md` and installed Next 16.4 route/component/form/environment/testing
  guides before code. The verification preload
  `app/tests/helpers/offline-runtime.cjs` supplies synthetic runtime configuration,
  disables Next env-file loading (probe: **0 files loaded**), and blocks credential
  reads. `app/tests/.runtime/.gitignore` and `app/eslint.config.mjs` keep generated
  browser profiles/transform caches repo-scoped and out of source linting.
- Verified output parents with
  `ls -d app app/tests/.runtime app/playwright-report app/test-results`, then ran:

  ```bash
  TMPDIR="$PWD/app/tests/.runtime" NODE_OPTIONS="--require=$PWD/app/tests/helpers/offline-runtime.cjs" pnpm --dir app build
  CI=1 TMPDIR="$PWD/app/tests/.runtime" NODE_OPTIONS="--require=$PWD/app/tests/helpers/offline-runtime.cjs" pnpm --dir app e2e --project=chromium-dark --workers=2 secret-data.spec.ts value-dialog.spec.ts cache-invalidation.spec.ts visual.spec.ts
  ```

  Production build passed (Next 16.4/Turbopack, **14/14** static pages). The final
  affected Chromium-dark run passed **25/25 tests in 4 specs**, including **8 new**
  binary/immutable/special-key/controller/native-type cases. Browser HTTP was
  mocked; the existing Chromium installation was used. Initial selector/time-budget
  and generated-cache lint failures were resolved before these final passing runs.

- Final diff/status review, `git diff --check`, and
  `git diff --exit-code -- CHANGELOG.md` passed; the changelog is untouched. Only
  KRY-04's task status changed. Limits: no real credential/cluster/IdP access;
  standalone artifact smoke, website build, and the full browser matrix remain
  integration checks. The existing non-failing Vite config-loader and Next
  standalone/`next start` warnings persist. History identity/snapshot immutability
  remains KRY-05 and mutation CAS remains KRY-06.
- Coordinator triage for KRY-09: Next Activity retains hidden create/edit forms
  during client navigation. Browser diagnostics showed duplicated fixed-ID label
  associations; review unique form IDs/draft lifecycle there. KRY-04 browser
  selectors target the active form.

### Task KRY-05: Bind rollback history to Secret identity and verify snapshot retries

Status: completed

Kind: defect

Priority: P1 — recyclable names can expose predecessors' values and collisions can lose rollback points.

Suggested agent: version-history integrity engineer

Dependencies: KRY-02, KRY-03, KRY-04

Primary ownership: a focused snapshot-store module or history section of
`app/lib/secrets.ts`, history identity settings in `config.ts`, history/restore
callers, `app/tests/history*.test.ts`, history architecture and upgrade docs.

Finding: selectors use only the live name, so retained history crosses delete/recreate
lifetimes. Long names exceed label limits. Any snapshot-create 409 is accepted, even
for unrelated contents. Adoption reuses v1 and loses the next rollback point. Pruning
decodes values only to obtain deletion names and ignores cleanup failures.

References: `app/lib/secrets.ts` (`snapshotName`, `nextVersion`, `createSnapshot`,
`pruneSnapshots`, `listVersions`, lines 112-195); history and restore routes;
`app/README.md:86-92`.

Requirements:

1. Bind new snapshots/selectors to immutable source UID and source resourceVersion;
   use bounded valid names/labels for 253-character live names. Preserve readable
   original name/type metadata and make snapshot data immutable.
2. Quarantine unbound legacy history from automatic user access/restore. Explain
   operator-reviewed legacy recovery and the migration limitation; never infer UID
   ownership from a recycled name alone.
3. Accept only verified same-source idempotent snapshot retries. An unrelated or
   changed-source collision must prevent replacing the live object.
4. Define a consistent adoption version baseline, maintain distinct consecutive
   rollback states, and isolate list/restore/prune/delete operations by live UID.
5. Separate internal raw/metadata snapshot records from user-facing decoded DTOs.
   Enforce the configured positive bounded retention policy and surface pruning
   failures accurately; do not silently claim all cleanup succeeded.

Acceptance criteria:

- Same name/different UID never sees or restores old history, including retained
  history; 64- and 253-character names are updateable with valid metadata.
- Exact-source retries succeed; unrelated/different-source collisions cannot write.
- Consecutive adoption edits preserve unique prior states. Retention is tested for
  normal, boundary, and failed cleanup cases without unnecessary value decoding.

Verification: focused U snapshot/store/route tests and A; inspect migration docs.

Completion evidence:

- Added `app/lib/snapshot-store.ts`: UID-scoped version slots, full source
  UID/resourceVersion binding, bounded SHA-256-derived names/labels (names ≤60
  characters for 253-character live names), and immutable Opaque raw-data archives
  with original name/type annotations. Creation and 409 retries verify actual
  immutable bytes/own keys and source metadata; different-source/unrelated,
  mutable, terminating, or controller-owned collisions block live replacement.
  Adoption consistently archives v1 → writes v2 → archives v2 → writes v3.
- Internal raw/metadata records are separate from decoded DTOs in
  `app/lib/secrets.ts`. Updated
  `app/app/api/namespaces/[namespace]/secrets/[name]/{route.ts,versions/route.ts,restore/route.ts}`
  to require the authorized live object for every history operation, including
  current DELETE cleanup. Current live ACLs, raw restores, lifecycle preservation,
  impersonation, and KRY-06's existing public request contracts are preserved.
- `app/lib/config.ts` enforces retention 1–100 (unset default 20), surfaced safely
  by `app/app/api/config/route.ts`. Pruning/deletion use metadata-only inventories,
  serial snapshot UID/RV-conditional deletes, and absence confirmation. Failed or
  pending pruning blocks replacement with truthful counts; exact-source retries
  retry cleanup. Legacy/unbound/malformed history has no automatic access,
  restore, prune, delete, or name-based adoption path.
- Added `app/tests/history-{store,routes,transport}.test.ts` and
  `app/tests/helpers/history.ts`, reusing existing environment/Kubernetes/loopback
  helpers. Coverage includes 64/253-character names, retained/recreated lifetimes,
  live ACL revocation, binary/special-key SDK round trips, forged same-source
  contents, external/controller changes, two isolated replica modules sharing
  native CAS, adoption, retention boundaries/failures, and non-decoding cleanup.
  Earlier route/data/impersonation fixtures were updated to valid bound records;
  all **312** KRY-01..04 regressions still pass.
- Reviewed upgrade/recovery and operational contracts against code in
  `app/README.md`, `app/.env.example`,
  `website/docs/guides/{versioning-history,configuration,troubleshooting,sandbox}.mdx`,
  `website/docs/api/{versions,restore,secrets,config,overview}.mdx`, and
  `website/docs/about/{architecture,security-model,overview}.mdx`.
- Exact verification commands (from the repository root):

  ```bash
  TMPDIR="$PWD/app/tests/.runtime" pnpm test:unit app/tests/history-store.test.ts app/tests/history-routes.test.ts app/tests/history-transport.test.ts
  TMPDIR="$PWD/app/tests/.runtime" pnpm test:unit app/tests/history-store.test.ts app/tests/history-routes.test.ts app/tests/history-transport.test.ts app/tests/secret-data.test.ts app/tests/secret-data-routes.test.ts app/tests/secret-data-transport.test.ts app/tests/authz-policy.test.ts app/tests/authz-routes.test.ts app/tests/impersonation-callsites.test.ts app/tests/impersonation-transport.test.ts app/tests/auth-session.test.ts app/tests/auth-oidc.test.ts
  TMPDIR="$PWD/app/tests/.runtime" pnpm --dir app lint
  TMPDIR="$PWD/app/tests/.runtime" pnpm --dir app exec tsc --noEmit --incremental false
  git diff --check
  git diff --exit-code -- CHANGELOG.md
  ```

  Focused history: **119 passed** (90 store, 23 route, 6 SDK transport). Final
  combined run: **431 passed in 12 files**. Lint, typecheck, and diff checks passed;
  changelog untouched. Read `app/AGENTS.md` and installed Next route-handler,
  route-reference, and Vitest guides before changes. All fixtures/outputs stayed
  repo-scoped; no actual credentials, kubeconfig, cluster, or IdP were accessed.

- Material limits: no automatic legacy migration; provenance-reviewed native
  recovery and explicit cleanup are required for quarantined/kept predecessor
  copies. Upgrade writers together with consistent prefix/retention settings.
  History is pre-write captures, not an external-change watcher or commit log;
  saved snapshots/pruning can survive a failed live CAS. An external revision
  change in an occupied version slot requires reviewed counter recovery. Failed
  cleanup may exceed retention until repaired; no background sweeper is added.
- Triage: KRY-06 still owns caller revision contracts, live-delete preconditions,
  retryable ordering, and live finalizer semantics. Current DELETE can remove the
  live authorization object before reported cleanup failure, requiring operator
  cleanup; this limitation is documented and tested, not silently waived. No
  independent blocker arose. Backend/docs-only work: production/browser/website/
  chart/artifact integration remains KRY-12. The existing non-failing Vite loader
  warning persists. Only KRY-05's status was changed.

### Task KRY-06: Make restore and deletion concurrency-safe and cleanup retryable

Status: completed

Kind: defect

Priority: P2 — stale operators can overwrite/delete newer state and deletion can falsely promise erasure.

Suggested agent: destructive-operation and client-contract engineer

Dependencies: KRY-04, KRY-05

Primary ownership: DELETE and restore routes/shared mutation helpers,
`app/lib/api-client.ts`, `secret-detail.tsx`, `version-history.tsx`, focused unit
and browser tests, secrets/restore API docs.

Finding: restore lacks the browser's expected live resourceVersion; delete is by
name without preconditions. Live deletion precedes best-effort historical cleanup,
so failures leave copies behind while reporting success or make retries impossible.

References: named-secret route `DELETE`, lines 95-118; restore handler, lines 12-58;
`app/lib/api-client.ts:89-101`; detail delete mutation and history restore mutation.

Requirements:

1. Require an expected live resourceVersion for restore and delete. Send it from
   current UI state; reject missing/stale inputs before snapshots/cleanup/mutation.
2. Use live UID and resourceVersion Kubernetes delete preconditions and conditional
   snapshot cleanup. Keep cleanup failures retryable with the live authorization
   object available; only report complete deletion after required cleanup succeeds.
3. Preserve intentional keepHistory behavior with UID isolation. Be truthful about
   Kubernetes deletion pending on finalizers rather than claiming immediate erasure.
4. Surface conflicts with a working reload path, keep failed-operation state visible,
   and invalidate/remove relevant cached secrets/history only on appropriate success.
5. Document the new request contract and non-atomic Kubernetes cleanup semantics.

Acceptance criteria:

- Stale restore/delete cause no writes; in-flight replacement or ACL changes are
  protected by Kubernetes CAS, and a same-name replacement is never deleted.
- History list/delete failures never claim full erasure and can be retried;
  keepHistory and deletion-pending paths are tested.
- Browser requests carry the loaded version and conflicts offer actual fresh data.

Verification: focused U destructive-operation tests, A, B for conflict/delete/restore
browser regressions, and updated contract evidence.

Completion evidence:

- Added `app/lib/secret-mutations.ts`; updated DELETE/restore handlers,
  `app/lib/{snapshot-store,secrets,validation}.ts`. DELETE requires an opaque
  `resourceVersion` query parameter; restore requires it in JSON alongside
  `version`. Stale inputs reject before history access/writes. Live revision
  rechecks, native live UID/RV CAS, per-snapshot UID/RV cleanup, absence checks,
  and a final inventory protect races and keep cleanup failures retryable with
  the live authorization object available. Keep-history remains UID-isolated.
  Confirmed absence is 200 `deleted`; still-present live objects are 202 `pending`,
  with optional `deletionTimestamp` also exposed by GET/list DTOs.
- `app/lib/api-client.ts`, new `app/lib/secret-queries.ts` and
  `app/components/secret-mutation-error.tsx`, plus `secret-detail.tsx` and
  `version-history.tsx`, carry typed requests/results end to end. Confirmations
  capture the loaded revision; restore success installs the returned revision.
  Conflict reloads fetch real live/history data, preserve failures, and require
  review before retry. Confirmed deletion cancels/removes detail/history caches;
  pending deletion refreshes them and stays visible across reloads. The delete
  dialog supports keep-history and describes partial/pending operations truthfully.
- Added `app/tests/secret-mutations.test.ts`, `secret-mutations-transport.test.ts`,
  `secret-query-recovery.test.ts`, and `app/e2e/secret-mutations.spec.ts`. Updated
  affected history/data/authz/impersonation fixtures and browser mocks while
  retaining prior behavioral coverage. Regressions exercise stale/missing inputs,
  valid opaque revisions, ACL/data/UID races at multiple stages, real SDK wire
  preconditions/identity, partial cleanup retries, finalizers, kept lifetimes,
  uncertain confirmation, late history writes, and cache/reload recovery.
- Reviewed contracts/upgrade notes in `app/README.md`,
  `website/docs/api/{secrets,restore,overview}.mdx`,
  `website/docs/guides/{versioning-history,troubleshooting}.mdx`,
  `website/docs/about/{architecture,security-model}.mdx`, and
  `website/.samples/rest-lifecycle.sh`. Read `app/AGENTS.md` and installed Next
  16.4 route, component, router, environment, Vitest, and Playwright guides first.
- Actual commands from the repository root:

  ```bash
  TMPDIR="$PWD/app/tests/.runtime" pnpm test:unit app/tests/secret-mutations.test.ts app/tests/secret-mutations-transport.test.ts app/tests/secret-query-recovery.test.ts
  TMPDIR="$PWD/app/tests/.runtime" pnpm test:unit
  TMPDIR="$PWD/app/tests/.runtime" pnpm --dir app lint
  TMPDIR="$PWD/app/tests/.runtime" pnpm --dir app exec tsc --noEmit --incremental false
  TMPDIR="$PWD/app/tests/.runtime" NODE_OPTIONS="--require=$PWD/app/tests/helpers/offline-runtime.cjs" pnpm --dir app build
  CI=1 TMPDIR="$PWD/app/tests/.runtime" NODE_OPTIONS="--require=$PWD/app/tests/helpers/offline-runtime.cjs" pnpm --dir app e2e --project=chromium-dark --workers=2 secret-mutations.spec.ts secret-data.spec.ts cache-invalidation.spec.ts value-dialog.spec.ts visual.spec.ts
  bash -n website/.samples/rest-lifecycle.sh
  git diff --check
  git diff --exit-code -- CHANGELOG.md
  ```

  Focused U passed **78 tests**; after two additional regressions, final full U
  passed **511 tests in 15 files** (**80 new**, all **431 prior**). Lint/typecheck
  passed. Production build passed (**14/14** static pages), followed by **35/35
  Chromium-dark tests in 5 specs**, including **10 new** mutation cases. Used the
  existing Chromium and offline preload (env loading/credential reads disabled),
  with repo-local temporary/output paths. Sample syntax and final diff checks
  passed; no live credential/cluster/IdP access. Changelog untouched; only KRY-06's
  task status changed. Existing Vite-loader and standalone/next-start warnings persist.

- Residual semantics: Kubernetes operations are nontransactional. Earlier history
  changes survive later conflicts/failures; rechecks do not lock authorization
  across objects. `history: cleaned` refers to the checked eligible inventory,
  not atomic erasure: an in-flight writer can add copies after the final check,
  even after live deletion. Such copies, kept/predecessor/quarantined history, and
  uncertain outcomes can require operator recovery/cleanup. No background job.
- Triage: no KRY-06 blocker. KRY-09 can reuse `reloadSecret` for its form recovery.
  Independent coordinator follow-up: the pre-existing create example at
  `website/.samples/rest-lifecycle.sh:20` places an inline comment after a
  backslash, breaking command continuation despite passing `bash -n`; assign
  separate sample-execution coverage/fix. The sample was not executed against a
  cluster/IdP. Website/full-matrix/artifact integration remains KRY-12.

### Task KRY-07: Report accurate, bounded consumer rollouts

Status: completed

Kind: defect

Priority: P2 — credential rotation currently reports failed or unrelated restarts as successful.

Suggested agent: workload-restart engineer

Dependencies: KRY-02, KRY-03, KRY-06

Primary ownership: restart logic (prefer a focused `app/lib/consumers.ts` boundary),
restart route/DTO, detail restart feedback, focused unit/browser tests, restart docs.

Finding: JSON string scanning misses projected-only volumes and matches unrelated
names. Names are recorded before patches finish, and all rejected promises are
ignored. Workload mutation fan-out is unbounded.

References: `app/lib/secrets.ts` (`podTemplateUsesSecret`, `templateReferencesSecret`,
`restartConsumers`, lines 245-350); restart route audit; `secret-detail.tsx:55-65`.

Requirements:

1. Traverse typed env/envFrom, normal/projected volume, init/ephemeral container,
   and relevant image-pull references explicitly; eliminate substring heuristics.
2. Bound in-flight patches. Record only successful patches as successful, include
   sanitized per-workload failures, and distinguish no targets, partial, and total
   failure. The audit and UI must reflect the actual result.
3. Say rollout was requested, not that readiness/credential uptake was verified.
   Preserve feature flag enforcement and impersonation across lists and patches.

Acceptance criteria:

- Projected-only and all supported references match; unrelated substring/name
  matches and property-order variants cannot trigger incorrect restarts.
- Mixed/all failures produce truthful counts, errors, audits, and browser feedback.
- A controlled delayed-patch fixture proves the concurrency bound.

Verification: focused U consumer/route tests, A, B restart feedback tests; API/guide review.

Completion evidence:

- Extracted `app/lib/consumers.ts` from `app/lib/secrets.ts`: typed exact
  env/envFrom references on normal/init/ephemeral containers, normal/projected
  Secret volumes, and imagePullSecrets. ConfigMaps, literal values, name substrings,
  and property order cannot activate the old JSON fallback. Duplicate references
  and inventory entries produce one patch per kind/name.
- Updated `app/app/api/namespaces/[namespace]/secrets/[name]/restart-consumers/route.ts`
  and the shared `RestartResult`: 200 `requested`/`no_targets`, 207 `partial`, and
  503 `failed`; only acknowledged patches appear in `requested`. Structured patch
  failures and separate kind-level `discoveryFailures` use fixed guidance/numeric
  status, never raw upstream payloads. All inventories settle before mutation;
  failed/incomplete kinds are not patched or treated as empty. Mixed/failed attempts
  audit `result: error` with actual acknowledged names and classified failures.
  Feature flag, current live authorization, and complete per-user transport remain.
- `app/lib/api-client.ts` retains typed failed-attempt bodies via its single error
  reader; ordinary preflight errors still throw. `app/components/secret-detail.tsx`
  and new `consumer-restart-feedback.tsx` show pending state, distinct notification
  severity, and persistent request/failure/unknown-inventory details. Language says
  rollout requested, with completion/readiness/credential uptake explicitly unchecked.
- Added `app/tests/consumers{,-routes,-transport}.test.ts`, synthetic helper
  `app/tests/helpers/consumers.ts`, and `app/e2e/consumer-restarts.spec.ts`; updated
  `app/tests/authz-routes.test.ts` and `app/e2e/helpers.ts` for the DTO. Regression
  inputs cover nine reference locations in both property orders, unrelated exact
  names/values/ConfigMaps, mixed/all/none outcomes, every failed workload-list kind,
  incomplete inventories, disabled/unauthorized/preflight paths, and sanitized
  API/audit data. Real SDK loopback traffic preserves two overlapping identities,
  including 36 separately repeated groups and a literal-comma group, on successful
  and rejected lists/patches with strategic-merge content type.
- **Concurrency evidence:** 18 synthetic targets across all three kinds, each
  patch delayed 25ms by the controlled clock. Four start before any settle; no new
  patch starts at 24ms, then four more start at 25ms. Observed peak **4 in flight**,
  final active **0**, all **18** attempted once, **15 acknowledged / 3 failed**.
  Rejections release slots and do not stop the remaining queue. The cap is per
  request, not global across concurrent requests/replicas.
- Reviewed response/upgrade and rollout limits against code in `app/README.md`,
  `website/docs/api/{restart-consumers,overview}.mdx`,
  `website/docs/guides/{consumer-restarts,troubleshooting,sandbox}.mdx`, and
  `website/docs/about/{architecture,overview}.mdx`. Read `app/AGENTS.md` and installed
  Next 16.4 route-handler/reference, component, environment, Vitest, and Playwright
  guides before app edits.
- Exact commands from the repository root:

  ```bash
  ls -d app app/tests/.runtime app/playwright-report app/test-results
  TMPDIR="$PWD/app/tests/.runtime" pnpm test:unit app/tests/consumers.test.ts app/tests/consumers-routes.test.ts app/tests/consumers-transport.test.ts
  TMPDIR="$PWD/app/tests/.runtime" pnpm test:unit
  TMPDIR="$PWD/app/tests/.runtime" pnpm --dir app lint
  TMPDIR="$PWD/app/tests/.runtime" pnpm --dir app exec tsc --noEmit --incremental false
  TMPDIR="$PWD/app/tests/.runtime" NODE_OPTIONS="--require=$PWD/app/tests/helpers/offline-runtime.cjs" pnpm --dir app build
  CI=1 TMPDIR="$PWD/app/tests/.runtime" NODE_OPTIONS="--require=$PWD/app/tests/helpers/offline-runtime.cjs" pnpm --dir app e2e --project=chromium-dark --workers=2 consumer-restarts.spec.ts secret-mutations.spec.ts cache-invalidation.spec.ts visual.spec.ts
  git diff --check
  git diff --exit-code -- CHANGELOG.md
  git diff --cached --exit-code -- CHANGELOG.md
  ```

  Focused U: **55 passed** (35 consumer, 19 route, 1 SDK transport). Full U:
  **566 passed in 18 files**, retaining all **511** earlier tests. Lint/typecheck
  passed, including a final check after the browser-selector adjustment. Production
  build passed (**14/14** static pages). Final Chromium-dark run: **34/34 passed
  in 4 specs**, including **12 new** restart cases; report at
  `app/playwright-report/index.html`. The first browser run passed 33/34; its sole
  failure was a locator following the button's replaced loading label, corrected
  before the final passing run. App code/build did not change for that correction.
  Existing Vite-loader and standalone/next-start warnings persist.

- Reused `app/tests/helpers/offline-runtime.cjs` for build/browser (env loading and
  credential reads blocked), repo-local TMPDIR/output directories, and the existing
  Chromium. No real credentials, cluster, or IdP were accessed. Diff/status review
  and staged/unstaged changelog checks passed; `CHANGELOG.md` is untouched. Only
  KRY-07's status changed. Website/full-browser-matrix/artifact checks remain KRY-12.
- **KRY-08 seam:** replace the three `ConsumerSource.list` adapters with the shared
  complete paginated reader, preserving per-user options and per-kind failure
  isolation. Current lists have no page loop; an unexpected continuation fails that
  inventory explicitly. Consolidate `consumerRequestFailure`'s numeric-only status
  reader with the shared sanitized error boundary; retain the client's typed 503
  result path. No duplicate general pagination/error-parser subsystem was added.
- Limits/triage: scans cover explicit references in the three controller templates,
  not inherited/injected live-Pod references or other workload/storage kinds. A
  transport failure can follow an applied patch; retry rescans and can patch earlier
  successes again. Coordinator follow-up: patches still address workload names
  without listed UID/resourceVersion preconditions (`consumers.ts` list/patch
  adapters); a concurrent template edit or same-name replacement can receive the
  annotation based on the earlier inventory. Workload identity/reference race
  protection warrants a separate conditional-patch regression and task.

### Task KRY-08: Bound API input and Kubernetes collection work at shared boundaries

Status: completed

Kind: improvement

Priority: P2 — malformed input is misclassified and unbounded/history-heavy reads waste resources.

Suggested agent: API robustness and measured-performance engineer

Dependencies: KRY-02, KRY-04, KRY-05, KRY-07

Primary ownership: `app/lib/http.ts`, relevant validation and list helpers,
collection routes, `app/lib/namespaces.ts`, focused HTTP/list tests and API docs.

Finding: malformed `req.json()` becomes 500. Request bodies have no application
streaming bound. Secret listing fetches all histories before filtering; configured
namespace allowlists still cause cluster-wide namespace listing on every operation.
Authenticated Secret JSON lacks an explicit shared no-store policy.

Scope clarification from KRY-01: `app/app/api/auth/callback/route.ts:25-56` also
copies raw provider/query error descriptions into logs and unbounded provider codes
into redirect parameters. Include authentication error serialization in the same
boundary-hardening work; retain useful classified diagnostics without raw payloads.

References: `app/lib/http.ts:20-36`; collection route GET/POST;
`app/lib/namespaces.ts:11-33`; snapshot list/cleanup callers.

Requirements:

1. Add a shared bounded JSON reader with controlled 400/413 responses, including
   streamed bodies without Content-Length. Choose/document an envelope budget that
   accommodates supported Secret JSON escaping; bound user-supplied ACL collections.
2. Keep unexpected errors and validation responses from echoing secret values or
   raw transport headers. Preserve useful safe Kubernetes status/conflict semantics.
   Correct the KRY-03 diagnostic finding: a 403 in impersonation mode can be denied
   human RBAC, so error guidance must not always blame the ServiceAccount's permissions.
   Bound/classify OIDC callback diagnostics and redirect error codes as well; raw
   provider descriptions and authorization response values must not reach logs/URLs.
3. Apply explicit no-store to sensitive API success/error responses.
4. Exclude history at the Kubernetes list selector, paginate bounded batches, and
   keep annotation-based managed visibility and ACL enforcement. Guard malformed or
   repeated continuation tokens without silently truncating results.
5. Resolve configured namespace allowlists without repeated cluster-wide list calls.
   Preserve own-namespace scope and unrestricted-cluster behavior.
   Use own-property namespace policy lookups: the current `nsMap[namespace]` lookup
   in `authz.ts` mistakes inherited `constructor` for a rule even though that is a
   valid namespace name. Empty/absent policy must retain the documented open result.
6. Measure a representative synthetic history-heavy workload: returned bytes/object
   counts and request counts before/after. Report scope honestly, not production speedup.

Acceptance criteria:

- Malformed JSON is 400; oversized header/stream bodies are 413 before mutation;
  valid escaped/Unicode inputs at supported sizes remain accepted.
- Tests prove no secret-value/error-header leakage and no-store on API responses.
- Multi-page listing returns every permitted live object once; selectors, identity,
  continuation guards, and managed-annotation semantics are asserted.
- Completion evidence records the synthetic byte/object/request measurement and
  zero namespace-list calls for configured allowlist checks.

Verification: focused U HTTP/list tests, A, measured fixture results, and API docs.

Completion evidence:

- `app/lib/http.ts` now bounds streamed UTF-8 JSON to **16 MiB**, rejects oversized
  headers/streams with 413 and malformed JSON/UTF-8/lengths with 400, and cancels
  rejected streams before mutation. Escaped/Unicode and overlapping create maps
  retain native data limits and own special keys. `app/lib/validation.ts` bounds
  ACL arrays to **256 entries / 256 UTF-8 bytes each**. Validation replies expose
  at most 20 classified top-level issues, without raw inputs/messages/nested keys.
- Added `app/lib/errors.ts`; application guidance is explicitly trusted via
  `HttpError`, while `toK8sError` and consumer failures share numeric-only status
  extraction and fixed effective-identity guidance. Kubernetes bodies/headers and
  unexpected messages are excluded. API handlers use shared no-store JSON, including
  authenticated success/error and typed restart 207/503 responses; auth redirects
  are also no-store. `app/lib/auth.ts` and auth routes classify IdP codes/descriptions
  (unknown code → `provider_error`, 64-character code input, 2 KiB diagnostics,
  eight causes), omit raw response values/URLs/hostnames, and log redirect-base
  equality only. The KRY-01 and KRY-03 diagnostic findings are addressed.
- Added `app/lib/k8s-list.ts`, wired through collection routes,
  `app/lib/{namespaces,snapshot-store,consumers}.ts`. All live/history/workload and
  unrestricted namespace lists use complete **100-object pages, maximum 100 pages**,
  retaining selectors and full request options. Live selection excludes history
  server-side without requiring a managed label; annotation visibility/ACLs remain.
  Identical projections deduplicate; bad/repeated tokens (maximum 8 KiB), malformed
  pages, conflicting duplicates/revisions, and exhausted budgets fail explicitly.
  No automatic expired-token restart or partial inventory success is returned.
- Aggregate object/JSON budgets: live **5,000 / 32 MiB**; raw UID-bound history
  **1,000 / 160 MiB**; cleanup **1,000 / 8 MiB projected metadata**; workloads
  **2,000 / 32 MiB per kind**; unrestricted namespaces **5,000 / 8 MiB**. Cleanup
  sizing/fingerprints never inspect Secret values. Budgets are per inventory, after
  SDK page decoding, not streaming transport/global limits. Configured namespace
  allowlists resolve/check locally with zero client/list calls; unrestricted
  discovery errors are explicit instead of an own-namespace fallback. `authz.ts`
  uses own-policy-property lookup for `constructor`, preserving absence versus error.
- Added `app/tests/{http-boundaries,collections,collections-transport,collections-measurement,auth-errors}.test.ts`
  and `app/tests/helpers/http.ts`; reused signed sessions, synthetic Kubernetes/OIDC,
  history, consumer, and loopback helpers. Updated history fixtures for real paging,
  earlier status assertions, and split an immutable test's inconsistent reused
  UID/RV fixture into independent native states. Regressions include exact streamed
  bounds, maximum escaped create data, Unicode/special keys, error/header/code privacy,
  authenticated cache policy, complete 205-record history, late failures, 150-record
  pruning, namespace policy/allowlists, and per-page SDK identity/codec preservation.
- Reviewed contracts/budgets/upgrades in `app/README.md`, `website/docs/api/`, and
  affected guides/architecture/security pages. Read `app/AGENTS.md` and installed
  Next 16.4 route-handler/reference, environment, Vitest, and Playwright guidance
  before editing. Added `app/e2e/api-boundaries.spec.ts`; aligned restart browser
  fixtures with classified messages and the shared unexpected-preflight 500.
- Exact commands from the repository root:

  ```bash
  ls -d app app/tests/.runtime app/playwright-report app/test-results
  TMPDIR="$PWD/app/tests/.runtime" pnpm test:unit app/tests/http-boundaries.test.ts app/tests/collections.test.ts app/tests/collections-transport.test.ts app/tests/collections-measurement.test.ts app/tests/auth-errors.test.ts app/tests/history-store.test.ts app/tests/secret-data-routes.test.ts app/tests/impersonation-callsites.test.ts --disableConsoleIntercept
  TMPDIR="$PWD/app/tests/.runtime" pnpm test:unit --disableConsoleIntercept
  TMPDIR="$PWD/app/tests/.runtime" pnpm --dir app lint
  TMPDIR="$PWD/app/tests/.runtime" pnpm --dir app exec tsc --noEmit --incremental false
  TMPDIR="$PWD/app/tests/.runtime" NODE_OPTIONS="--require=$PWD/app/tests/helpers/offline-runtime.cjs" pnpm --dir app build
  CI=1 TMPDIR="$PWD/app/tests/.runtime" NODE_OPTIONS="--require=$PWD/app/tests/helpers/offline-runtime.cjs" pnpm --dir app e2e --project=chromium-dark --workers=2 api-boundaries.spec.ts consumer-restarts.spec.ts secret-mutations.spec.ts secret-data.spec.ts cache-invalidation.spec.ts visual.spec.ts
  CI=1 PLAYWRIGHT_HTML_OUTPUT_DIR="$PWD/app/playwright-report/kry08-consumers" TMPDIR="$PWD/app/tests/.runtime" NODE_OPTIONS="--require=$PWD/app/tests/helpers/offline-runtime.cjs" pnpm --dir app e2e --project=chromium-dark --workers=2 consumer-restarts.spec.ts
  git diff --check
  git diff --exit-code -- CHANGELOG.md
  git diff --cached --exit-code -- CHANGELOG.md
  ```

  Focused U: **283 passed / 8 files**. Final combined U after additional regressions:
  **718 passed / 23 files**, preserving prior task coverage. Final lint/typecheck
  passed cleanly. Production build passed (**14/14** static pages). Affected
  Chromium-dark: **44/44 passed / 6 specs**, including two real offline auth/cache
  checks; after the restart-fixture alignment, its **12/12** cases passed again.
  Reports: `app/playwright-report/index.html` and
  `app/playwright-report/kry08-consumers/index.html`. Earlier fixture/accounting and
  test typing issues were resolved before these passing results.

- **Deterministic measurement:** real SDK loopback, 120 live Secrets + 2,400 bound
  snapshots, each with 8,192 decoded fixture-data bytes and lifecycle/history
  metadata. Original Secret list: **1 request / 2,520 objects / 29,827,466 JSON
  bytes**; filtered paginated list: **2 requests / 120 objects / 1,385,195 bytes**.
  Public summaries are identical (**42,304 bytes**). Allowlist checks: **0 namespace
  list requests**. Measurements include uncompressed fixture response bodies, exclude
  headers/TLS, and expose counts only; no elapsed-time/production speed claim.
- Build/browser used KRY-04's offline preload (env-file loading and credential reads
  blocked), repo TMPDIR, and installed Chromium. Commands and agent-created fixtures,
  build outputs, and browser reports stayed repo-scoped; no live cluster/IdP or real
  credential inputs were used. Harness exception: an oversized diff was automatically
  spooled by the tool to its external tool-output store. Diff/status and staged/
  unstaged changelog checks passed; **CHANGELOG.md is untouched**. Only KRY-08's
  status changed. Existing Vite-loader/standalone warnings persist; full browser,
  website/chart/artifact integration remains KRY-12. Workload UID/RV CAS remains KRY-14.
- Coordinator follow-up: pre-existing ACL CSV joins/splits in
  `app/lib/secrets.ts` / `app/lib/authz.ts` cannot preserve a literal comma in an
  ACL member and can change intended membership. Assign a separate validation/
  versioned-codec task before implementation; the new array/byte ceilings do not
  define new ACL encoding semantics.

### Task KRY-15: Reject ACL entries that change meaning during annotation encoding

Status: completed

Kind: defect

Priority: P1 — accepted ACL arrays can silently broaden access after CSV serialization.

Suggested agent: access-rule contract engineer (fresh isolated session)

Dependencies: KRY-02, KRY-08

Primary ownership: annotation ACL validation in `app/lib/validation.ts`, focused
authorization/create/update tests, and ACL API/upgrade documentation.

Finding: KRY-08 found that accepted API arrays are joined with commas into native
annotations, then split/trimmed by authorization. An entry such as `team-a,team-b`
becomes two identities; a whitespace-only entry disappears and can restore open
namespace fallback. Both currently pass the API's nonempty-string validation.

References: `app/lib/validation.ts` (`aclEntry`, `createSecretSchema`,
`updateSecretSchema`); `app/lib/secrets.ts` (`buildEncodedLiveSecret` ACL joins);
`app/lib/authz.ts` (`csvList`, `secretRules`, `canAccessSecret`).

Requirements:

1. Preserve the documented CSV annotation format by rejecting comma-containing or
   whitespace-only array entries before any create/snapshot/update side effect.
   Define intentional whitespace normalization consistently with the reader.
2. Keep valid entries, empty arrays that explicitly clear annotations, omitted
   update fields, and existing UI comma-separated input behavior coherent.
3. Do not unnecessarily restrict namespace ConfigMap JSON arrays: unlike annotation
   CSV, they can represent a comma-containing identity exactly. Document this
   distinction and the stricter API validation as an upgrade contract.

Acceptance criteria:

- Invalid annotation ACL entries return 400 without creating or updating Secrets
  or snapshots; no accepted array silently becomes a larger/different membership set.
- Valid trimmed entries round-trip through storage and authorization; explicit
  clears and omitted fields retain their documented behavior.
- A comma-containing ConfigMap identity matches only that exact group/user and is
  not split into multiple principals. Regression coverage exercises route boundaries.

Verification: focused U validation/authorization/route tests and A, plus documentation
contract review. Browser behavior is unchanged and covered by final integration.

Completion evidence:

- `app/lib/validation.ts` and `app/lib/secrets.ts` share annotation validation:
  comma/blank entries fail before writes, raw 256-entry/256-byte bounds precede
  trimming, and direct create/update/raw-restore builders enforce the invariant.
  Explicit clears, omitted PUT values, and exact namespace JSON principals remain valid.
- Added `app/tests/acl-annotations.test.ts` and `app/tests/acl-annotations-routes.test.ts`
  using existing signed-session/native-store helpers. Eight old POST/PUT acceptance
  failures were reproduced first; regressions cover membership expansion/open fallback,
  no live/history side effects, safe errors, trim/readback authorization, clears/omits,
  builder bypasses, bounds, and exact comma-containing namespace groups/users.
- Updated/reviewed `app/README.md`, `website/docs/api/secrets.mdx`, and
  `website/docs/guides/authorization.mdx` for the API upgrade and UI comma-list parsing.
- Commands from the repository root; pnpm checks used `TMPDIR="$PWD/app/tests/.runtime"`:

  ```bash
  pnpm test:unit app/tests/acl-annotations.test.ts app/tests/acl-annotations-routes.test.ts
  pnpm test:unit app/tests/authz-policy.test.ts app/tests/authz-routes.test.ts app/tests/secret-data.test.ts app/tests/secret-data-routes.test.ts app/tests/secret-data-transport.test.ts app/tests/http-boundaries.test.ts app/tests/history-routes.test.ts app/tests/secret-mutations.test.ts app/tests/impersonation-callsites.test.ts
  pnpm --dir app lint
  pnpm --dir app exec tsc --noEmit --incremental false
  git diff --check
  git diff --exit-code -- CHANGELOG.md ':(glob)**/CHANGELOG.md'
  git diff --cached --exit-code -- CHANGELOG.md ':(glob)**/CHANGELOG.md'
  ```

  Focused: **65 passed / 2 files**; impacted: **396 passed / 9 files**. Lint,
  nonincremental typecheck, and diff/changelog checks passed; reviewed small per-file
  diffs. Only KRY-15's status changed; prior task work was preserved.

- Limits: synthetic offline verification; browser tests unnecessary for unchanged UI.
  Existing annotations retain CSV read semantics and require review if affected;
  no format migration. The existing non-failing Vite config-loader warning persists.

### Task KRY-09: Make edit recovery, bulk entry, and load failures usable

Status: completed

Kind: defect

Priority: P2 — recovery controls can leave stale data and typing bulk entries can lose values.

Suggested agent: secret-editing UX engineer

Dependencies: KRY-04, KRY-06, KRY-08

Primary ownership: `secret-form.tsx`, `edit-secret-view.tsx`, dashboard/namespace and
history error states, focused data-entry helpers, browser regressions, user docs.

Finding: conflict “Reload latest” only invokes router.refresh, which does not refetch
the React Query data holding initial values/resourceVersion. Bulk input parses on
every keystroke and clears at the first `=`, before a value can be typed. Namespace
and history load errors render as selection/empty states instead of actionable errors.

References: `secret-form.tsx:267-276, 444-471`; `edit-secret-view.tsx:7-19`;
`dashboard.tsx:15-29, 65-70`; `namespace-selector.tsx:19-35`;
`version-history.tsx:32-35, 66-71`; `providers.tsx:13`.

Requirements:

1. Explicit reload must refetch the secret and reset form/resourceVersion on success;
   failed reload retains the draft. Background query refresh must not silently discard
   in-progress edits or replace the revision attached to those edits with a newer
   cache revision. Keep secret drafts and their original revision in memory only.
2. Use a controlled bulk-input draft and explicit import action, validating complete
   lines/keys/duplicates before changing entries. Preserve values containing `=` and
   support CRLF. Do not silently drop a nonempty value whose key is blank.
3. Provide meaningful labels for dynamic key/value controls and show namespace/history
   loading, empty, permission/unavailable, and retry states distinctly. Creation is
   disabled while its namespace authorization hint is unknown or unavailable.
   KRY-04 browser evidence also found hidden forms retained by Next Activity: use
   instance-unique form/control IDs so label associations remain correct after
   client navigation, and include this lifecycle in draft/recovery verification.

Acceptance criteria:

- Browser test: stale PUT → conflict → reload fetches a new version → next save uses
  that version; failed reload and background reconnect do not erase draft values.
- Typing and pasting bulk entries does not mutate rows until explicit import;
  malformed/duplicate imports leave current rows intact and explain the problem.
- Failed namespace/history queries show retry rather than misleading emptiness,
  and retry visibly recovers; loading/error cannot enable unauthorized creation UX.

Verification: focused parser tests if introduced, A, B edit/data-entry/error-state
specs, and existing cache-invalidation browser tests.

Completion evidence:

- `app/components/{secret-form,edit-secret-view}.tsx` pin draft fields, native
  restrictions, and their original resourceVersion together. Explicit recovery uses
  `app/lib/secret-queries.ts` `reloadSecret`; only success resets the full draft and
  revision. Failed reloads and background/Activity query changes retain both. Successful
  saves install the returned baseline; completed create forms reset. Instance-unique
  `useId` label associations work across retained create → edit client navigation.
- Added `app/lib/secret-form-data.ts` and `app/tests/secret-form-data.test.ts`:
  controlled bulk drafts require explicit import, validate all lines/existing rows
  atomically, preserve CRLF/equals/value whitespace/own keys, and reject orphan values,
  duplicates, unsupported text, and combined oversize data without losing drafts.
  Pending bulk text must be imported or cleared before save. Native binary, immutable,
  controller-token guidance and KRY-15's ACL validation/CSV behavior are preserved.
- `app/components/{dashboard,namespace-selector,create-secret-view,version-history}.tsx`
  distinguish loading, successful emptiness, unavailable, and permission-denied results
  with retries. Unknown/failed/loading namespace or create hints cannot enable creation,
  including cached allows after failed background checks. Shared React Query options
  reuse existing caches; failed history refreshes hide stale restore choices.
- Added `app/e2e/{secret-editing,query-recovery}.spec.ts` and small shared helpers in
  `app/e2e/helpers.ts`. Aligned dynamic labels in `app/e2e/secret-data.spec.ts` with
  explicit control-count assertions; strengthened PUT revision checks in
  `app/e2e/cache-invalidation.spec.ts`. Reviewed user guidance in `app/README.md` and
  `website/docs/guides/{troubleshooting,versioning-history}.mdx` against the behavior.
- Exact passing commands from the repository root:

  ```bash
  ls -d app app/tests/.runtime app/playwright-report app/test-results
  TMPDIR="$PWD/app/tests/.runtime" pnpm test:unit app/tests/secret-form-data.test.ts app/tests/secret-query-recovery.test.ts
  TMPDIR="$PWD/app/tests/.runtime" pnpm test:unit app/tests/acl-annotations.test.ts app/tests/acl-annotations-routes.test.ts app/tests/secret-data.test.ts app/tests/secret-data-routes.test.ts app/tests/secret-data-transport.test.ts
  TMPDIR="$PWD/app/tests/.runtime" pnpm --dir app lint
  TMPDIR="$PWD/app/tests/.runtime" pnpm --dir app exec tsc --noEmit --incremental false
  TMPDIR="$PWD/app/tests/.runtime" NODE_OPTIONS="--require=$PWD/app/tests/helpers/offline-runtime.cjs" pnpm --dir app build
  CI=1 PLAYWRIGHT_HTML_OUTPUT_DIR="$PWD/app/playwright-report/kry09-affected" TMPDIR="$PWD/app/tests/.runtime" NODE_OPTIONS="--require=$PWD/app/tests/helpers/offline-runtime.cjs" pnpm --dir app e2e --project=chromium-dark --workers=2 --max-failures=3 secret-editing.spec.ts query-recovery.spec.ts cache-invalidation.spec.ts secret-data.spec.ts secret-mutations.spec.ts consumer-restarts.spec.ts value-dialog.spec.ts visual.spec.ts
  git diff --check
  git diff --exit-code -- CHANGELOG.md ':(glob)**/CHANGELOG.md'
  git diff --cached --exit-code -- CHANGELOG.md ':(glob)**/CHANGELOG.md'
  ```

  Focused U: **34 passed / 2 files** (30 new parser + 4 query recovery), then **161
  passed / 5 files** (prior ACL/native-data), **195 total**. Full lint and nonincremental
  typecheck passed, including the final selector correction. Offline production build
  passed (**14/14** static pages). Final affected Chromium-dark: **72/72 passed / 8
  specs**, including **25 new** regressions. Report:
  `app/playwright-report/kry09-affected/index.html`. An initial 120s harness startup
  timeout and two exact-empty-text test selector failures were resolved before the
  final passing run; the selector correction required no application change.

- Read `app/AGENTS.md`, KRY-04's Activity follow-up, and installed Next 16.4 router,
  Activity/cache/navigation, forms/components, TanStack Query, and Playwright guides
  before editing. Used the existing offline preload and Chromium, repo-local outputs,
  and bounded per-file diffs. No credential/env-file loads, live cluster/IdP, external
  installs, subagents, commits, or publishing. Diff/status and staged/unstaged changelog
  checks passed; **CHANGELOG.md is untouched**. Only KRY-09's status changed.
- Limits: drafts are memory-only and may be evicted with retained routes; explicit
  reload success intentionally replaces them. Browser APIs were mocked; native CAS
  remains covered by prior backend tasks. Full unit/browser-project, website, Helm,
  and artifact integration remains KRY-12. Existing non-failing Vite-loader and
  standalone/next-start warnings persist. No independent blocker was found.

### Task KRY-10: Keep secret previews local and resource-bounded

Status: completed

Kind: improvement

Priority: P2 — rendering stored Markdown currently causes automatic third-party requests.

Suggested agent: safe-preview and browser-performance engineer

Dependencies: KRY-04, KRY-09

Primary ownership: `app/components/value-preview.tsx`, relevant preview budget helper,
`app/e2e/value-dialog.spec.ts` or focused preview spec, secret-viewing docs.

Finding: react-markdown renders remote images without an override, so opening a
secret preview can automatically fetch a secret-controlled URL. Raw HTML is already
inert and links already use noopener/noreferrer. Code highlighting is bounded but
the whole Markdown document is still parsed/rendered regardless of size.

References: `value-preview.tsx` (`ValuePreview`, `MarkdownPreview`, lines 65-73,
116-139); `app/lib/shiki.ts` (`HIGHLIGHT_BUDGET`); `value-dialog.tsx:236-255`.

Requirements:

1. Render Markdown images as inert, accessible descriptive text instead of loading
   embedded resources. Preserve explicit user-activated safe links and raw text access.
2. Apply a whole-preview budget before expensive Markdown/highlighting work, falling
   back to escaped raw text for oversized content. Preserve existing lazy loading.
3. Document local-only preview and fallback behavior.

Acceptance criteria:

- Browser interception observes zero remote image requests when preview opens;
  HTML/script/javascript URL content remains inert and copy/raw preserves bytes.
- Oversized Markdown renders the bounded-work fallback instead of a large parsed
  element tree; completion records representative input and DOM-work measurement.
- Existing JSON/YAML/XML/Markdown/PEM preview/edit tests pass.

Verification: A, B focused preview regressions plus existing value-dialog tests;
record deterministic input/DOM-work measurement instead of an assumed speedup.

Completion evidence:

- `app/components/value-preview.tsx`: Markdown `img` renders inert descriptive
  text (`[Image not loaded: alt-or-title]`) with no image/network element or
  forwarded resource props; links keep `target=_blank rel="noopener noreferrer"`
  and render unsafe (sanitized-empty) hrefs as inert spans without spreading
  component props onto DOM nodes; no `rehype-raw`, so raw HTML stays inert
  text. `ValuePreview` checks the whole value against the shared
  `HIGHLIGHT_BUDGET` (131,072 UTF-16 code units) before mounting Markdown
  parsing or Shiki highlighting, falling back to escaped untruncated raw text
  with a short notice. `app/lib/shiki.ts` documents the shared budget.
  `app/components/value-dialog.tsx` lazy `dynamic()` preview/editor modules are
  preserved. No image generation; textual/synthetic fixtures only.
- Added `app/e2e/value-preview.spec.ts`: intercepted `https://preview.invalid`
  proves zero requests on preview open/hover, zero `img/picture/source/iframe/
video/audio/object/embed/script/style/link` elements, six named plus one
  unnamed inert image descriptions, raw `<script>` text visible with no script
  execution, `javascript:`/`data:` links inert (click-safe), clipboard and Raw
  editor round-trip exact bytes (BOM/Unicode/trailing spaces), and every safe
  link (explicit guide, linked-image, GFM bare-URL autolink inside inert
  `<style>` text) requires activation, opens a popup with `opener === null`
  and empty referrer, and issues exactly one `document` request with no
  `referer` header. Budget test pins the inclusive limit (131072 renders rich
  with 512 list items and 16 highlighted fences; 131073 falls back for every
  content-type override) and ordinary JSON/YAML/XML/PEM previews keep their
  rendering and exact text.
- Session fix: the first run failed with 3 links instead of 2 because GFM
  autolinks the bare URL inside the inert `<style>` text. Rendering behavior
  is correct (user-activated, unprefetched `https` navigation); the new spec
  now pins all three links' activation behavior, and viewing docs name GFM
  bare-URL autolinks as explicit user actions.
- Documented local-only preview and fallback in `app/README.md` ("Viewing
  secret values"), `website/docs/about/security-model.mdx` ("Local value
  previews"), and `website/docs/guides/versioning-history.mdx` ("Viewing text
  values"); no timing/speedup claims.
- Read `app/AGENTS.md` and installed Next 16.4 server/client-component,
  `use-client`, and lazy-loading guides before editing. Verified
  `react-markdown@10.1.0` default URL transform blocks `javascript:`/`data:`
  to empty href (rendered as spans) via pipeline probe; `&#58;` destinations
  decode before that transform.
- Exact commands from the repository root (repo-local TMPDIR, offline preload,
  installed Chromium, mocked services, no `.env` loaded):

  ```bash
  ls -d app app/tests/.runtime app/playwright-report app/test-results
  TMPDIR="$PWD/app/tests/.runtime" pnpm --dir app lint
  TMPDIR="$PWD/app/tests/.runtime" pnpm --dir app exec tsc --noEmit --incremental false
  TMPDIR="$PWD/app/tests/.runtime" NODE_OPTIONS="--require=$PWD/app/tests/helpers/offline-runtime.cjs" pnpm --dir app build
  CI=1 TMPDIR="$PWD/app/tests/.runtime" NODE_OPTIONS="--require=$PWD/app/tests/helpers/offline-runtime.cjs" pnpm --dir app e2e --project=chromium-dark --workers=2 value-preview.spec.ts value-dialog.spec.ts secret-data.spec.ts
  TMPDIR="$PWD/app/tests/.runtime" pnpm test:unit app/tests/secret-data.test.ts app/tests/secret-data-routes.test.ts app/tests/secret-data-transport.test.ts
  git diff --check
  git diff --exit-code -- CHANGELOG.md ':(glob)**/CHANGELOG.md'
  git diff --cached --exit-code -- CHANGELOG.md ':(glob)**/CHANGELOG.md'
  ```

  Lint passed, nonincremental tsc passed, production build passed (**14/14**
  static pages), Chromium-dark passed **19/19 in 3 specs** (6 new preview, 5
  existing value-dialog, 8 KRY-04 binary/own-key), KRY-04 unit files passed
  **96/96**. No unit-covered helper logic changed, so no new unit tests were
  added. Existing Vite-loader and `next start`/standalone warnings persist.

- **Deterministic measurement** (no timing claims): limit 131072 code units;
  within-budget input 131072 code units / 131072 UTF-8 bytes renders
  descendants `{elements: 1683, textNodes: 2661, otherNodes: 0, listItems: 512,
highlightedBlocks: 16}`; oversized input 131073/131073 falls back to
  `{elements: 0, textNodes: 1, otherNodes: 0, listItems: 0,
highlightedBlocks: 0}` (single escaped text node). Also attached as
  `preview-dom-work.json` to the budget test result.
- Diff/status review used small per-file output; `git diff --check` and
  staged/unstaged changelog checks passed; **CHANGELOG.md is untouched**. Only
  KRY-10's status changed; prior task work preserved.
- Limits: synthetic offline verification only; no live cluster/IdP or real
  credential access. Full browser matrix, website build, Helm, and artifact
  checks remain KRY-12.
- Coordinator triage (no blocker): GFM bare-URL autolinking inside inert raw
  HTML text yields user-activated links by design; pinned and documented here.
  If a future task wants raw-HTML regions fully link-free, it must change
  shared Markdown behavior deliberately, not as a side effect.

### Task KRY-11: Align Helm runtime configuration with rendered permissions

Status: completed

Kind: defect

Priority: P2 — documented chart settings can grant unusable permissions or disagree with runtime behavior.

Suggested agent: deployment-contract engineer

Dependencies: KRY-03, KRY-07, KRY-08

Primary ownership: `helm/k8ston/templates/{_helpers.tpl,deployment.yaml,rbac.yaml}`,
values/docs, chart render regression script/fixtures, Helm CI, relevant website guides.

Finding: deployment merges globals ahead of local env despite the documented local
precedence. `rbac.extraNamespaces` grants Roles, but the documented matching namespace
runtime scope only exposes the pod namespace. `rbac.scope` is not injected by default,
and restart env overrides can disagree with `.Values.restartEnabled` RBAC gating.

References: deployment template lines 70-78; RBAC template lines 4-29, 85-124;
`helm/main/values.yaml:3, 42-52`; `website/docs/guides/deploy-helm.mdx:47-64`.

Requirements:

1. Use one effective configuration helper with local-over-global env precedence.
   Derive scope defaults from chart RBAC; namespaced extraNamespaces should expose
   a bounded allowlist of release plus configured namespaces without ClusterRole.
2. Derive restart runtime flag and rendered apps permissions from the same effective
   value, respecting explicit false. Handle contradictory explicit settings with
   actionable template errors rather than silently different runtime/RBAC behavior.
3. Keep externally managed RBAC and unrelated extraEnv/custom settings supported.
   Align enabled access ConfigMap name/key with the runtime policy reader.
4. Add actual rendered-object assertions for default, cluster, curated namespaces,
   local/global conflicts, false overrides, external RBAC, and custom access config;
   wire them into Helm CI. Document defaults and upgrade semantics.

Acceptance criteria:

- Rendered environment, Role/ClusterRole scopes, subjects, and apps permissions
  agree for every supported scenario; curated namespaces require no cluster-wide Role.
- Explicit configuration mistakes fail rendering with clear guidance; default and
  existing umbrella examples continue to render valid manifests.
- Helm lint, regression assertions, and umbrella render matrix pass.

Verification: H and focused rendered-object assertions; final W verifies doc builds.

Completion evidence:

- Added single effective-config helper `k8ston.effectiveConfig` (+
  `k8ston.managedEnvKeys`, runtime-faithful `k8ston.parseBool`) in
  `helm/k8ston/templates/_helpers.tpl`, shared by `deployment.yaml`,
  `rbac.yaml`, and `access-configmap.yaml`. Local `env` wins over
  `global.env` per key (fixes reversed `merge` precedence); the Deployment
  renders canonical managed env (`K8STON_SCOPE` from `rbac.scope`,
  curated `K8STON_NAMESPACES` from the release namespace plus
  `rbac.extraNamespaces`, `K8STON_RESTART_ENABLED` from `restartEnabled`,
  `K8STON_ACCESS_CONFIGMAP` from `accessConfig.name` when enabled) and
  skips managed keys in user-env iteration, so each renders exactly once.
- Curated `extraNamespaces` derive `K8STON_SCOPE=cluster` with a bounded
  allowlist served by namespaced Roles only (no ClusterRole/ClusterRoleBinding;
  cluster-scope runtime with an allowlist needs no namespace-list permission).
  Runtime restart flag and `apps` RBAC rule come from the same effective value
  (explicit `false` respected; truthy aliases render canonical `true`).
  Contradictory explicit settings (scope/allowlist/extras/restart/access
  name/key, managed keys in `extraEnv`, invalid scope, blank/comma extras)
  fail rendering with actionable guidance. `rbac.create=false` renders no
  Roles and passes scope/allowlist env through untouched (unrendered
  scope/extras cannot constrain it); `accessConfig.key` must be `access.json`
  (runtime reader hardcodes it); unrelated `extraEnv`/custom settings preserved.
- Added `helm/k8ston/tests/render-regressions.sh` (executable, helm+grep
  only, mktemp + trap cleanup, explicit `-n` on every render): 11 success
  groups (default, cluster, cluster allowlist, curated ±restart, local/global
  conflicts, false/truthy overrides, external RBAC, custom/external access
  config, explicit-match single-render, extras dedupe) and 16 failure groups
  (F1–F16, each asserting its guidance text). Wired into
  `.github/workflows/helm.yml` as a new `Chart regression assertions` step.
- Documented defaults/upgrade semantics in `helm/k8ston/README.md` (effective
  table + upgrade notes), `helm/k8ston/values.yaml` and
  `helm/main/values.yaml` comments, `helm/main/values-k8s-prod.example.yaml`
  comment, `website/docs/guides/deploy-helm.mdx` (knobs/RBAC/restart/CI
  sections), and `website/.samples/values-helm.yaml` comment. Untracked
  gitignored `helm/main/values-ai-poc.secret.yaml` left untouched.
- Exact commands from the repository root (helm v4.3.0, explicit `-n` everywhere
  since `helm template` otherwise inherits the ambient kubeconfig namespace):

  ```bash
  helm lint helm/k8ston
  TMPDIR=/tmp/opencode helm/k8ston/tests/render-regressions.sh
  helm dependency update helm/main
  helm lint helm/main
  helm template test helm/k8ston -n ci > /dev/null
  helm template test helm/k8ston -n ci --set rbac.scope=cluster --set restartEnabled=true --set ingress.enabled=true --set httpRoute.enabled=true --set route.enabled=true --set accessConfig.enabled=true --set autoscaling.enabled=true --set podDisruptionBudget.enabled=true --set serviceAccount.create=false > /dev/null
  helm template test helm/main -n ci -f helm/main/values.yaml -f helm/main/values-example.yaml > /dev/null
  helm template test helm/main -n ci -f helm/main/values.yaml -f helm/main/values-k8s-prod.example.yaml > /dev/null
  git diff --check
  git diff --exit-code -- CHANGELOG.md ':(glob)**/CHANGELOG.md'
  git diff --cached --exit-code -- CHANGELOG.md ':(glob)**/CHANGELOG.md'
  pnpm --dir website build
  ```

  Results: both charts lint clean; regressions **78 passed / 0 failed**;
  subchart default + full-flag matrix and both umbrella examples render;
  umbrella prod example spot-checked to inject `K8STON_SCOPE=namespace`,
  `K8STON_RESTART_ENABLED=false`, `K8STON_ACCESS_CONFIGMAP=k8ston-access`.
  `git diff --check` and staged/unstaged changelog checks pass
  (**CHANGELOG.md untouched**). Website production build passes (bonus check
  for the edited guide; formal W remains KRY-12).

- Limits/triage: no cluster/credential access; all verification is
  client-side rendering plus the docs build. Curated mode intentionally
  renders runtime `K8STON_SCOPE=cluster` while `rbac.scope` stays
  `namespace` — operators auditing scope strings should read the derived env,
  not the input value (documented). `envSecretName` secrets must not repeat
  managed keys (explicit env shadows `envFrom`; documented). Only KRY-11's
  status changed; prior task work preserved.

### Task KRY-13: Repair the executable REST lifecycle example

Status: completed

Kind: defect

Priority: P3 — a published copy/paste example cannot complete its create step.

Suggested agent: executable-documentation maintainer (fresh isolated session)

Dependencies: KRY-06, KRY-07, KRY-08

Primary ownership: `website/.samples/rest-lifecycle.sh` and its task evidence.

Finding: KRY-06 discovered a pre-existing inline allowlist comment after the create
command's continuation backslash. The backslash escapes a space, not the newline,
so curl receives a malformed invocation and the endpoint is executed as a separate
shell command. A syntax-only shell check does not catch this executable failure.

References: `website/.samples/rest-lifecycle.sh:17-21` (create example); embedding
guide `website/docs/guides/sandbox.mdx`.

Requirements:

1. Repair the continuation/comment arrangement and retain clearly synthetic values
   compatible with repository secret-scanning conventions.
2. Confirm the sample's create/read/update/history/restore/restart/delete commands
   match the final API contracts, including required resourceVersion handling.
3. Verify the script through repo-local, in-memory shell command substitutes for
   token minting, curl, and JSON extraction. Never execute it against a real server
   or load actual environment credentials. A new permanent test framework is unnecessary.

Acceptance criteria:

- The sample passes `bash -n` and a mocked shell execution reaches every lifecycle
  step without trying to execute URLs as commands.
- Captured create invocation includes one correct URL and intact JSON body;
  update/restore/delete include the synthetic expected resourceVersion.

Verification: `bash -n website/.samples/rest-lifecycle.sh` and documented offline
mocked-command execution; final W validates the embedding guide.

Completion evidence:

- Fixed `website/.samples/rest-lifecycle.sh:17-21`: the create step's
  `-d '...' \ # pragma: allowlist secret` broke continuation (the backslash
  escaped a space, so the URL ran as a separate shell command). Reordered to
  URL-then-`-d`, placing the trailing `# pragma: allowlist secret` on the final
  line with no backslash; synthetic `s3cr3t` value and pragma retained, and curl
  argument order is semantically neutral. Two-line diff; no other sample lines changed.
- Contract review against `website/docs/api/{overview,secrets,restore,versions,
restart-consumers,namespaces,auth}.mdx`, `website/docs/guides/sandbox.mdx`, and
  `app/README.md`: create/read/PUT/versions/restore (`{version:1,resourceVersion}`)/
  restart (bodiless POST)/delete (`-G -X DELETE` with URL-encoded `resourceVersion`,
  no body; comments cover keepHistory/409/202/ordered cleanup) all match the final
  contracts; update/restore/delete carry the loaded live resourceVersion.
- Verification from the repository root (offline, mocked, no server/credentials):
  - `bash -n website/.samples/rest-lifecycle.sh` → PASS.
  - Temporary harness `/tmp/opencode/kry13-mock-run.sh` (in-memory `node`/`curl`/`jq`
    function substitutes, repo-external, not committed) sourcing the sample → exit 0
    with 13 curl / 4 jq / 2 node invocations covering all 8 steps and zero
    URL-as-command errors. Create captured one URL plus the intact JSON body;
    update/restore/delete captured synthetic `rv-synthetic-001`; restart POST had no body.
  - Same harness against `HEAD:website/.samples/rest-lifecycle.sh` reproduces the bug
    (`line 21: localhost:3000/...: No such file or directory`, create curl missing its
    URL) while `bash -n` still passes — proving the harness detects this failure class.
- `git diff --check`, `git diff --exit-code -- CHANGELOG.md`, and the staged variant
  passed; `CHANGELOG.md` untouched. Only KRY-13's status changed. Limits: mocked shell
  execution only, no live cluster/IdP/server contact; embedding-guide build (W) remains
  KRY-12.

### Task KRY-14: Bind rollout patches to the inspected workload revision

Status: completed

Kind: defect

Priority: P2 — a replaced workload or changed Secret reference can receive an unrelated rollout.

Suggested agent: workload-concurrency engineer (fresh isolated session)

Dependencies: KRY-07, KRY-08

Primary ownership: `app/lib/consumers.ts`, focused consumer/transport tests, and
restart concurrency documentation.

Finding: KRY-07 correctly matches references in the listed pod template, but retains
only workload names. Its subsequent strategic-merge patch has no workload identity
or resourceVersion. Deleting/recreating that name, or removing the reference before
patching, can therefore restart a workload that was never a valid inspected target.

References: `app/lib/consumers.ts` (`ConsumerSource`, discovery target construction,
and per-target patch dispatch; initially lines 71-100, 111-134).

Requirements:

1. Carry the inspected workload UID/resourceVersion with each target and enforce
   them in the supported Kubernetes patch contract. Never retry a conflict blindly
   against freshly changed/replaced targets.
2. Treat missing/malformed identity as an explicit failed/incomplete target rather
   than downgrading to name-only mutation. Preserve all exact-reference matching,
   concurrency bounds, full impersonation, and truthful partial-result behavior.
3. Keep native identity metadata internal unless the documented public contract needs
   it; update guidance to explain reload/review after workload changes.

Acceptance criteria:

- A synthetic race that replaces a target UID or changes its revision/reference
  between listing and patch returns a conflict without modifying the newer workload.
- Real SDK loopback capture shows native patch preconditions for all three workload
  kinds, preserving strategic-merge content type and impersonation headers.
- Unchanged targets succeed, failed ones never enter the requested list, missing
  identities cause no unconditional patch, and the four-request concurrency cap holds.

Verification: focused U consumer/race/transport regressions and A; existing restart
browser behavior remains covered by the final full B suite.

Completion evidence:

- **Contract investigation (strategic-merge vs JSON Patch):** installed
  client-node v2 `AppsV1Api.patchNamespaced{Deployment,StatefulSet,DaemonSet}`
  accepts only name/namespace/body/query options, so identity must ride in the
  patch body. Strategic-merge bodies are declarative merges with no `test`
  semantics and cannot atomically verify UID/resourceVersion. RFC 6902 JSON
  Patch (`application/json-patch+json`, first in the SDK's supported patch
  media list, sent via the same `setHeaderOptions` middleware seam) evaluates
  `test` ops server-side in order, failing before any mutation. Restarts now
  use JSON Patch; this intentionally supersedes the criterion's
  strategic-merge content-type wording while meeting its precondition and
  impersonation intent. No other production caller used strategic merge.
- `app/lib/k8s.ts` adds `jsonPatchOptions()` (impersonation-preserving
  `application/json-patch+json` override); `app/lib/consumers.ts` carries
  inspected `{uid, resourceVersion}` plus template-metadata shape per target
  and patches `[test uid, test resourceVersion, add annotation]`. The `add`
  targets the leaf, `annotations`, or `metadata` object per the inspected
  shape (`add` replaces a leaf but requires its parent; any concurrent change
  already failed the earlier `test`). Single attempt per revision: 409/422 is
  recorded once, never blind-retried. Missing/malformed UID/RV or template
  metadata becomes a per-target `incomplete_list` (503) failure counted in
  `matched`, never a name-only patch; conflicting duplicate names fail the
  whole kind (defensive; `readK8sCollection` already rejects them). Exact
  matching, 4-request cap, full impersonation, partial-result math/audits, and
  sanitized errors are preserved; UID/RV appear only in K8s patch bodies, never
  in results/audits.
- Added `app/tests/consumers-race.test.ts` (**8 tests**): replaced-UID and
  revision/reference-change races return 409 with the newer workload verifiably
  unmutated and exactly one patch call; 422 precondition rejection stays
  truthful; no-blind-retry (a would-succeed second call never runs); 4 missing/
  malformed identities fail as `incomplete_list` with only the valid target
  patched; malformed template metadata unpatched; all three annotation-`add`
  shapes asserted; UID/RV absent from the public result. Updated
  `app/tests/helpers/consumers.ts` (synthetic UID/RV fixtures),
  `consumers.test.ts` (JSON-Patch body), `consumers-transport.test.ts` and
  `collections-transport.test.ts` (json-patch content type + per-patch test-op
  assertions across all three kinds with impersonation intact),
  `impersonation-callsites.test.ts` and `authz-routes.test.ts` fixtures.
- Reviewed reload/review-after-conflict guidance against code in `app/README.md`,
  `website/docs/api/restart-consumers.mdx`,
  `website/docs/guides/consumer-restarts.mdx`,
  `website/docs/guides/authorization.mdx`, and
  `website/docs/about/architecture.mdx`. Read `app/AGENTS.md`, the installed
  Next 16.4 route-handler reference, and the installed SDK patch APIs before editing.
- Exact commands from the repository root:
  `TMPDIR="$PWD/app/tests/.runtime" pnpm test:unit app/tests/consumers.test.ts app/tests/consumers-race.test.ts app/tests/consumers-routes.test.ts app/tests/consumers-transport.test.ts`
  → **63 passed / 4 files**; impacted
  `authz-routes/impersonation-callsites/impersonation-transport/collections/collections-transport`
  → **152 passed / 5 files**; full `pnpm test:unit` → **821 passed / 27 files**;
  `pnpm --dir app lint`, nonincremental `tsc`, `git diff --check`, and
  staged/unstaged `CHANGELOG.md` checks passed (**CHANGELOG.md untouched**).
  Offline synthetic fixtures, repo-local TMPDIR, no cluster/IdP/credential use.
- Limits: JSON-Patch `test` failure status is server-defined (409 vs 422 both
  surface truthfully as `conflict`/`invalid_request`); races between the final
  list page and patch are narrowed to one atomic server check, not eliminated;
  no browser run here (no client/UI change; covered by final full B in KRY-12).
  Only KRY-14's status changed. Existing non-failing Vite config-loader warning persists.

### Task KRY-12: Independently verify every task and the integrated product

Status: completed

Kind: improvement

Priority: P2 — independent integration evidence is required to close this delegated plan.

Suggested agent: independent final reviewer (fresh session, not a prior implementer)

Dependencies: KRY-01, KRY-02, KRY-03, KRY-04, KRY-05, KRY-06, KRY-07, KRY-08,
KRY-09, KRY-10, KRY-11, KRY-13, KRY-14, KRY-15

Primary ownership: final review evidence in this document; cross-package verification.

Finding: existing browser-only mocks cannot demonstrate backend safety, public
contract agreement, or packaged server readiness across the combined changes.

Requirements:

1. Check each acceptance criterion and completion entry against code/tests. Trace
   alternate access paths, raw data/DTO boundaries, CAS/UID ownership, input/collection
   bounds, privacy of previews/errors/audits, and runtime/deployment contract agreement.
2. Run U, A, production app build, the full browser suite (all configured projects),
   W, and H. Run an offline standalone-build smoke with synthetic configuration:
   public config works, protected unauthenticated requests fail, and the traced server
   loads required dependencies. Use repo-local generated fixtures and local ports only.
3. Check CI invokes new tests, docs describe changed contracts/migration, no actual
   credential values entered changes, and `CHANGELOG.md` is untouched.
4. Record meaningful limitations/deferred product decisions. If an acceptance issue
   is found, create a fully specified follow-up task and return it to the coordinator
   for a fresh sequential implementer; do not quietly waive criteria or rewrite findings.

Acceptance criteria:

- All prior tasks are completed with verifiable evidence; no pending/in-progress/
  blocked items remain when this task closes.
- Combined unit/lint/type/build/browser/docs/chart/artifact checks pass, with exact
  results recorded and no unreviewed acceptance gaps.
- Final diff review confirms repository scope and the unchanged changelog constraint.

Verification: requirements above; coordinator performs a final task-file/status review.

Completion evidence:

- Independent reviewer (no prior implementation, no subagents). Read the full
  task file, every completion entry, `app/AGENTS.md`, and traced each task's
  acceptance criteria against code, tests, and public docs. All prior tasks
  verified; no follow-up (KRY-16+) required.
- **KRY-01:** `app/lib/auth.ts` fails closed on missing/short/fallback keys
  (`sessionKey`), enforces HS256 + issuer + required claims/expiry
  (`verifySessionToken`), consumes all three OIDC transaction cookies before
  exchange and rejects incomplete transactions (`handleOidcCallback`), binds
  UserInfo to the ID-token subject (mismatch throws, never merges), resolves
  nested `realm_access.roles` after configured precedence (`extractGroups`).
  Root `package.json` declares `test:unit`; `.github/workflows/test.yml` runs
  `pnpm test:unit`. Auth/config docs carry the upgrade contract.
- **KRY-02:** `app/lib/authz.ts` returns `{}` only on confirmed ConfigMap 404;
  missing payload, JSON/schema errors, and failed reads throw sanitized 503
  and are never cached as allow-all. Cache is 60s from completion, coalesces
  concurrent misses, discards expired maps before refresh. `Object.hasOwn`
  guards the `constructor` namespace rule. `app/lib/secret-access.ts`
  `loadAuthorizedLiveSecret` rejects history snapshots with 404 in both
  visibility modes and is wired into all named-secret/action routes; list and
  create paths fail 503 on policy errors. Absence-vs-failure docs agree.
- **KRY-03:** `app/lib/k8s.ts` `requestOptions` sends user + every group as
  distinct headers via the supported per-call `httpApi` override and Undici
  raw pairs, copies identity per request, preserves SA auth/TLS/body/signal,
  and rejects non-printable/padded identities with 400. Bypass is keyed on
  `AUTH_DISABLED`, not email. Consumers lists/patches carry identity;
  `jsonPatchOptions` added by KRY-14 preserves the same seam. Undici is a
  direct dependency. Wire-capture tests assert `rawHeaders`.
- **KRY-04:** `app/lib/secrets.ts` splits lossless text `data` from
  original-base64 `binaryData`, restores snapshots byte-for-byte
  (`buildRawRestoreSecret`), and retains UID/ownerReferences/finalizers/
  immutable/type on replacements. Shared `secret-rules.ts`/`validation.ts`
  preserve own keys (including `__proto__`), reject lossy text, enforce
  native built-in type semantics, and reject controller-owned token
  writes/422 before side effects. SDK codec seam plus disabled structural
  sharing for secret queries close the remaining loss points. UI/API
  validation agree; DTO fixtures use shared types.
- **KRY-05:** `app/lib/snapshot-store.ts` binds snapshots/selectors to source
  UID + resourceVersion with bounded hashed names/labels, verifies exact
  bytes/ownership on create and 409 retry (foreign/mutable/terminating/
  controller collisions block replacement), adopts v1→v2→v3 consistently,
  and quarantines legacy/unbound records from all automatic paths.
  Retention 1–100 is enforced; pruning/deletion are metadata-only with
  truthful failure counts. History routes require the authorized live object.
- **KRY-06:** `app/lib/secret-mutations.ts` requires the expected live
  `resourceVersion` before history access/writes (`assertExpectedResourceVersion`),
  rechecks live UID/RV mid-operation, deletes live with native UID/RV
  preconditions, orders cleanup before live deletion, and reports 200
  `deleted` only on confirmed absence (202 `pending` otherwise). UI captures
  loaded revisions, installs returned revisions, reloads real data on
  conflict, and keeps pending/failed states visible. REST sample and API docs
  match the contract.
- **KRY-07/KRY-14:** `app/lib/consumers.ts` matches only explicit typed
  env/envFrom/volume/projected/imagePullSecret references, patches at most 4
  in flight, reports `requested`/`no_targets`/`partial`/`failed` with
  per-workload and per-kind discovery failures, audits actual outcomes, and
  never claims verified rollouts. KRY-14 carries inspected UID/RV into an
  RFC 6902 `[test uid, test resourceVersion, add annotation]` patch (single
  attempt, no blind retry; missing identity becomes `incomplete_list`),
  deliberately superseding the strategic-merge wording since only JSON Patch
  has server-side test semantics. UID/RV stay out of results/audits.
- **KRY-08:** `app/lib/http.ts` bounds streamed JSON to 16 MiB (400 malformed,
  413 oversized, stream cancelled); ACL arrays capped at 256 entries / 256
  bytes; validation replies expose at most 20 classified top-level issues.
  `app/lib/errors.ts` centralizes fixed guidance (403 names the effective
  identity, not always the SA). `app/lib/k8s-list.ts` paginates 100/page
  (max 100) with continuation/duplicate/revision guards and per-inventory
  object/byte budgets; live lists exclude history server-side; allowlists
  resolve with zero list calls; `no-store` covers API JSON and auth
  redirects; OIDC diagnostics are classified/bounded. Synthetic measurement
  (120 live + 2400 snapshots: 1 req/2520 objs/29.8M bytes → 2 req/120
  objs/1.4M bytes, identical public summaries) is honestly scoped.
- **KRY-15:** `annotationAclSchema` bounds raw entries then rejects
  comma-containing/blank members; create/update/raw-restore builders enforce
  the invariant before side effects; explicit clears and omitted PUT fields
  keep documented behavior; namespace ConfigMap JSON keeps exact principals.
  API/guide docs state the CSV distinction and upgrade contract.
- **KRY-09:** `reloadSecret` refetches and only success resets draft +
  revision (`secret-queries.ts`, wired at `secret-form.tsx` recovery);
  failed reloads and background/Activity updates retain both. Bulk input is a
  controlled draft with explicit atomic `parseBulkEntries` import; pending
  bulk text blocks save. Namespace/history/creation-hint states distinguish
  loading/empty/unavailable/denied with retries; `useId` keeps label
  associations unique across retained routes.
- **KRY-10:** Markdown `img` renders inert descriptive text with no network
  element/props; no `rehype-raw`; unsafe hrefs render as spans; safe links
  need activation (`noopener noreferrer`, null opener, no referrer). The
  whole-value `HIGHLIGHT_BUDGET` (131072) gates Markdown/Shiki with an
  untruncated escaped-text fallback; measured DOM work (1683 elements within
  budget vs single text node above) is recorded without timing claims.
- **KRY-11:** `k8ston.effectiveConfig` derives one runtime/RBAC truth:
  local-over-global env, curated allowlist via namespaced Roles only,
  restart flag and apps rules from the same value, 16 contradictory-config
  template errors, external-RBAC passthrough, `access.json` key enforcement.
  `helm/k8ston/tests/render-regressions.sh` asserts 11 success + 16 failure
  groups and is wired into `.github/workflows/helm.yml`. Chart READMEs,
  values comments, and deploy guides document defaults/upgrades.
- **KRY-13:** create step reordered so no comment follows a continuation
  backslash; lifecycle steps match final contracts (PUT/restore/delete carry
  the loaded revision; bodiless restart POST; ordered-cleanup notes).
  Re-verified `bash -n` passes and no backslash-comment pattern remains.
- Exact commands from the repository root (all passed):
  - `TMPDIR="$PWD/app/tests/.runtime" pnpm test:unit` → **821 passed / 27 files**.
  - `pnpm --dir app lint` → pass; `pnpm --dir app exec tsc --noEmit --incremental false` → pass.
  - `TMPDIR="$PWD/app/tests/.runtime" NODE_OPTIONS="--require=$PWD/app/tests/helpers/offline-runtime.cjs" pnpm --dir app build` → pass, **14/14** static pages.
  - `CI=1 TMPDIR="$PWD/app/tests/.runtime" NODE_OPTIONS="--require=$PWD/app/tests/helpers/offline-runtime.cjs" pnpm --dir app e2e --workers=2` → **161 passed** total (**80** chromium-dark, **80** chromium-light, **1** mobile), 0 failures.
  - `pnpm --dir website typecheck` → pass; `pnpm --dir website build` → pass (Docusaurus SUCCESS).
  - `helm lint helm/k8ston`, `helm dependency update helm/main`, `helm lint helm/main` → pass; four `helm template` renders (subchart default/full-flag, umbrella example/prod) → pass; `TMPDIR="$PWD/app/tests/.runtime" helm/k8ston/tests/render-regressions.sh` → **78 passed / 0 failed**.
- Standalone smoke: copied `app/.next/standalone` (+ `.next/static`, `public`,
  mirroring the Dockerfile) to an isolated directory outside the repository
  module-resolution chain; started with fully synthetic env (auth enabled,
  synthetic ≥32-char session key, nonexistent kubeconfig, no cluster/IdP) on
  local port 3210. Results: `GET /api/config` → 200 public-safe JSON
  (`scope`, `etcdEncrypted`, `authDisabled`, `oidcConfigured`,
  `historyLimit`, `managedOnly`, `restartEnabled`, `appNamespace`; no secret
  values) with `cache-control: no-store`; `/api/namespaces`, secret detail,
  and `/api/auth/me` without session → 401; synthetic minted HS256 session →
  `/api/auth/me` returns the identity and `/api/namespaces` returns the
  namespace-scope list; a Kubernetes-backed list with no cluster →
  sanitized 500 (`Request failed unexpectedly…`), `no-store`, no leak, no
  crash; `/login` → 200 HTML. Route `.nft.json` traces reference only
  next/react runtime files: application deps are bundled into the server
  chunks, and the isolated run proves they load. Server stopped, port
  closed, temp copy removed.
- Scope/hygiene: `git diff --check` passes; `CHANGELOG.md` untouched
  (staged + unstaged); no commits made (HEAD unchanged); 95 status entries
  all fall within claimed task ownership (routes, lib, components, e2e,
  unit tests, Helm, website docs/samples, workflows, READMEs, env example,
  package manifests); build/test artifacts (`.next`, `website/build`,
  `playwright-report`, `test-results`, `.runtime` contents) are ignored.
  Secret-pattern scan of all changed tracked files found nothing; the single
  untracked hit is the explicitly synthetic test-only TLS fixture in
  `app/tests/helpers/kubernetes-transport.ts`. The task file contains no
  absolute machine paths or secret values. CI invokes the new suites:
  `test.yml` runs `pnpm test:unit` and the full e2e; `helm.yml` runs the
  regression script.
- Honest limitations (standing, not waived): no live cluster/IdP, real
  credentials, production load, or dependency audit; policy cache is
  per-process 60s TTL; history stores pre-write captures (not a commit log
  or external-change watcher); Kubernetes multi-object cleanup is ordered
  but non-atomic and can need operator recovery; JSON-Patch conflict status
  is server-defined (409 vs 422); curated Helm mode renders runtime
  `K8STON_SCOPE=cluster` while `rbac.scope` stays `namespace` (read the
  derived env); workload scans cover explicit references in the three
  controller templates only; standalone client-JS execution was not
  exercised beyond HTML serving; no background sweeper was added. Prior
  tasks' documented residual notes (legacy quarantine, kept/predecessor
  copies, retry re-patching) remain in force.

## Consequential deferrals and residual limitations

- Automated external credential-provider rotation, expiry scheduling, approval roles,
  and cross-cluster federation require new product/operational contracts. This phase
  strengthens manual rotation and recovery; it does not invent those integrations.
- Fine-grained read-versus-write permissions and changing open/bootstrap defaults are
  maintainer policy decisions. Existing documented semantics are preserved, while
  failures and historical bypasses are corrected.
- Legacy snapshots cannot prove their live-object UID. KRY-05 must document the
  recovery restriction; automatic trust by name would retain the identified risk.
- Real-cluster OIDC/RBAC/network-policy behavior, etcd encryption, and production load
  remain deployment responsibilities not proven by mock/loopback tests. No live
  cluster modifications are required by the plan.
- Broader dependency upgrades, UI virtualization, and external audit-log storage are
  deferred without measured production need; this review provides bounded backend
  work, accurate metadata-only audits, and synthetic measurements where implemented.

## Definition of done

Every task is `completed` only after its required behavior, documentation, and
verification pass, with a `Completion evidence` section naming changed paths,
commands, results, and material limitations. Follow-ups are resolved through fresh
sequential task agents. The independent review and coordinator both confirm the
entire file is complete. `CHANGELOG.md` remains untouched.
