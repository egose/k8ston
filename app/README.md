# K8ston — Kubernetes-native secret manager

A lightweight secret manager UI/API backed **directly by Kubernetes Secret objects**.
No database, no persistent volumes, no secret sprawl: Kubernetes is the source of
truth, and K8ston is the translation + visualization layer on top.

Built with Next.js (App Router), `@kubernetes/client-node`, generic OIDC SSO, and
shadcn-theme components.

## How it works

```
Browser ──SSO login──▶ K8ston (Next.js)
                            │  ServiceAccount token (auto-mounted in-cluster)
                            │  https://kubernetes.default.svc  — no credentials to manage
                            ▼
                    Kubernetes API ──▶ etcd (Secrets + one access ConfigMap)
```

- **State**: every secret is a native `Secret` object. Standard tools (Velero,
  `kubectl`, GitOps) keep working; RBAC, audit logs, and network policies come free.
- **Auth**: users sign in via OIDC SSO (for example Keycloak, Entra ID, Okta, Google, or Dex).
  OAuth-only providers require an OIDC-compatible bridge.
  Users do **not** need cluster credentials.
- **Authz (hybrid)**: SSO proves _who you are_; per-secret annotations and one
  namespace-level ConfigMap decide _what you may see_. The app's ServiceAccount
  executes the K8s calls.
- **History**: K8s overwrites secrets in place, so K8ston snapshots the previous
  state into an immutable, source-UID-bound Secret before each update/restore.
  Rollbacks preserve the original bytes and use the current live access rules.

## Security model (read this)

Out of the box, Kubernetes Secrets are **base64-encoded, not encrypted**, in etcd —
anyone with etcd or broad API access can decode them. K8ston therefore:

- never logs secret values (audit logs record key _names_ only),
- masks values in the UI until explicitly revealed,
- validates the 1 MiB per-object limit client- and server-side,
- shows a warning banner until you confirm etcd encryption-at-rest is enabled
  (`K8STON_ETCD_ENCRYPTED=true` once the API server uses an encryption provider
  such as `aescbc` on OpenShift).

Secrets additionally benefit from strict RBAC, redacted `kubectl` output, and
`tmpfs` (RAM-backed) volume mounts that never touch node disk.

## Access control

**Per-secret annotations** (managed in the UI, override everything below):

```yaml
metadata:
  annotations:
    k8ston.io/allowed-groups: 'dev-team, database-admins'
    k8ston.io/allowed-users: 'alice@company.com'
```

API `allowedGroups`/`allowedUsers` arrays are stored as comma-separated annotations.
Each submitted entry is trimmed; comma-containing, empty, or whitespace-only entries
return **400 before create, snapshot, or update writes**. There is no comma quoting
or escaping. Internal whitespace and case are preserved (groups match exactly;
user emails match case-insensitively). `[]` explicitly clears that annotation;
omitted PUT fields keep their stored values. With both ACLs empty, namespace fallback
applies and may intentionally be open. Omitted create ACLs default to `[]`.
The UI still splits comma-list text, trims entries, and drops blank segments before
submitting: `team-a, ,team-b` means two principals; a blank field submits `[]`.

**Namespace fallback** in ConfigMap `<app-namespace>/k8ston-access`, key `access.json`
(see `k8s/configmap-access.yaml`):

```json
{
  "production": {
    "groups": ["dev-team"],
    "users": ["alice@company.com"],
    "teams": [{ "name": "team1", "groups": ["team1-dev"], "users": [] }]
  }
}
```

These JSON arrays retain exact entries, including literal commas and surrounding
whitespace: `["team-a,team-b"]` matches that one group, not `team-a` or `team-b`.
They are not split or trimmed; user matching still ignores email case.

**Teams:** each namespace may define up to 64 teams; secrets opt in with the
`k8ston.io/team` annotation (missing/blank = unassigned). Team names are unique
DNS labels per namespace. Namespace members see all secrets; team members see
only their team's secrets, while unassigned secrets use namespace rules alone.
Empty team rules grant nothing; unknown teams fail closed unless the namespace
is fully unrestricted. Per-secret ACLs still override both.

Rules: admins (`K8STON_ADMIN_GROUPS`/`K8STON_ADMIN_USERS`) always pass; a secret
with explicit annotations is decided by those alone; otherwise the team and
namespace rules apply; with no rules anywhere the secret is visible to all
authenticated users
(open by default, restricted once rules are added). Until any admin is configured,
every authenticated user is treated as admin (bootstrap mode — set admins promptly).

**Policy absence versus failure:** only a Kubernetes **404** reading the access
ConfigMap means it is absent. A valid `{}`, an omitted namespace, or empty rule
lists also intentionally leave that namespace open. Missing/blank `access.json`,
invalid JSON/schema (including unknown rule fields), and failed reads return
**503 `Namespace access policy is unavailable`** whenever namespace policy is
needed. Admins and explicit per-secret ACL decisions do not need that read.
Valid policy and confirmed absence are cached in memory per process for 60 seconds
from read completion; concurrent misses share one read. After expiry, a failed
refresh never serves the old policy, and the next request retries immediately.

**Managed-only mode** (default, `K8STON_MANAGED_ONLY=true`): secrets _without_
`k8ston.io/managed-by: k8ston` are hidden entirely — excluded from lists, 404
on direct access (read, edit, delete, history, restore, restart) — so K8s-level
secrets created outside K8ston can't be touched by accident. Set
`K8STON_MANAGED_ONLY=false` to show unmanaged live secrets (legacy adopt-on-edit:
saving an external secret stamps K8ston annotations onto it).
History objects (`k8ston.io/kind=history`) are always hidden from lists and return
404 on direct named-secret routes, including for admins and in legacy mode.
Read or restore history through the **live secret's** `/versions` and `/restore`
endpoints, which authorize against its current ACL, never a snapshot's copied ACL.
Creation is special: a new secret has no annotations yet, so creating is decided
by the namespace and team rules for the chosen target — the per-secret allowed
groups/users you set in the form only take effect _after_ the secret exists
(the UI requires a loaded namespace and an explicit allowed creation hint).
Unassigned creation uses namespace rules alone; assigned creation also accepts
the target team's members. Moving a secret between teams needs creation rights
in the target. Non-admin creation
and list requests return 503 on policy failure; lists need namespace policy for
their `canCreate` hint, even when empty or containing only explicit-ACL secrets.
The list response also carries `teams` and `creatableTeams` for the team
dropdown; admin lists degrade to empty team hints instead of failing when only
the teams lookup is unavailable.

**Authorization upgrade:** fix malformed access ConfigMaps and ensure the app's
ServiceAccount can read them before upgrading. To express an intentionally open
policy in an existing ConfigMap, use valid `access.json: '{}'`. Rule entries accept
`groups`/`users` string arrays plus an optional `teams` array (omitted lists
default to empty). Deploy the app before adding `teams` — older releases reject
the unknown field as invalid policy. Clients that addressed snapshot names
directly must use the live history endpoints.

**ACL input upgrade:** earlier API writers accepted `["team-a,team-b"]` as one
entry but stored two principals, and whitespace-only entries could disappear into
open fallback. Update callers to send individual comma-free, nonblank entries or
an intentional `[]`; deploy validation to all writer replicas. Existing annotations
are not migrated: the reader still splits/trims/drops blanks, and omitted PUT ACLs
and restores retain their stored values. Review and correct affected live ACLs;
the original array intent cannot be recovered from CSV. Literal-comma principals
remain supported by namespace JSON policy, subject to normal fallback precedence.

**Optional K8s-native impersonation**: set `K8STON_IMPERSONATION=true` when the
session email/groups match your cluster's RBAC subjects and the ServiceAccount
has `impersonate` permission for those users and **all** their groups. Human
namespace, secret, and history operations, plus workload **lists and patches**,
send the session email in `Impersonate-User` and each group as a separate repeated
`Impersonate-Group` header. K8ston's application authorization also still applies.
The SDK's per-request transport extension preserves ServiceAccount authentication,
TLS configuration, and JSON-Patch content type; identity is request-local.

There is **no application group-count cap** or comma splitting. User/group values
must be nonempty printable ASCII without surrounding whitespace; unsupported
values fail with a controlled 400 instead of being trimmed or re-encoded.
API-server/proxy header-size limits may reject a whole request; K8ston never
silently truncates its identity. Impersonated API requests do not follow redirects.

The access-policy ConfigMap is intentionally read **as the ServiceAccount**, using
the shared 60s policy cache described above. Humans need no Kubernetes permission
to read that application policy. Default `K8STON_IMPERSONATION=false` keeps hybrid
mode; `AUTH_DISABLED=true` explicitly bypasses human impersonation for local dev.
A real authenticated session with email `dev@k8ston.local` is impersonated normally.

**Impersonation upgrade:** earlier versions overwrote repeated groups and silently
limited processing to 32 groups; workload lists also used the service identity.
Review impersonation grants for the complete group set and human RBAC for workload
list/patch operations before enabling this mode. Map unsupported identity values
to header-safe subjects in your identity provider and corresponding RBAC bindings.

## Editing, import, and recovery

- An edit draft keeps the data, metadata, native data restrictions, and **original
  resourceVersion** it was based on. Background refreshes and reconnects can update
  the shared query cache, but do not replace draft fields or authorize them against
  a newer revision. A stale save still returns 409.
- **Reload latest** on the edit form fetches the live Secret again. Only a successful
  fetch replaces **all** draft fields and the revision together, clears pending bulk
  text, and resets value visibility. Review the fresh data and re-apply your changes
  before saving. A failed reload keeps the entire draft and its original revision;
  the error stays visible and the same button retries. A successful save establishes
  the returned Secret as the form's new baseline.
- Drafts and query data stay in memory. Client navigation/back/forward can retain a
  draft while Next preserves the page; a full reload, closed tab, sign-out, or route
  eviction can discard it. Drafts are not persisted to browser storage or URLs.
  Successful creation clears the completed create form even if that page is retained.
- **Bulk entries** accepts typed or pasted `KEY=value` lines. Choose **Import entries**
  to add them; typing never mutates existing rows. Blank lines and CRLF are supported,
  keys are trimmed, and values preserve spaces and every `=` after the first one.
  `KEY=` intentionally creates an empty value. This is literal text entry, without
  shell interpolation, quote processing, or multiline escape expansion; use the
  expanded value editor for multiline values.
- Imports validate the entire draft and existing rows before adding anything:
  Kubernetes key grammar, duplicate keys (within the import or already in the form),
  supported text, and the combined size limit. Errors retain both rows and bulk text;
  existing keys are never overwritten. Import or clear pending bulk text before saving.
  A nonempty value without a key must be corrected or explicitly removed.
- Namespace and history loading, successful empty results, permission denials, and
  unavailable results have distinct UI states. Use **Retry namespaces**, **Retry
  secrets**, **Retry create permission**, or **Retry history** after resolving the
  error. **New secret** stays disabled while namespace discovery or its creation hint
  is loading, missing, or failed, including failed background checks of cached hints.
  The server remains authoritative for every create request.

## Versioning & consumer restarts

- Created Secrets start at `k8ston.io/version=1`. An adopted native Secret with
  no counter (or the old `0` counter) is also logically **v1**: its first edit
  saves v1 and writes v2; the next saves v2 and writes v3. This counter describes
  K8ston states, not every external Kubernetes change. PUT and restore send the loaded
  `metadata.resourceVersion` and replacement retains live UID/RV for Kubernetes CAS.
- `lib/snapshot-store.ts` owns native snapshot records, verified retries, and
  metadata-only cleanup. `lib/secrets.ts` decodes history only for response DTOs.
  All history operations require the authorized live object; none selects by name alone.
- New snapshots use `type: Opaque`, `immutable: true`, and raw native `data`.
  They never copy live owners, finalizers, managed fields, or controller annotations.
  Names are `k8ston-h-<UID hash>-vN` (at most 60 characters), including for
  253-character live names. UID/revision hashes are the first 32 lowercase hex
  characters of SHA-256; they are indexing keys, not ownership proofs.
- Labels include `k8ston.io/kind=history`, `k8ston.io/source-uid=<UID hash>`,
  and `k8ston.io/source-resource-version=<revision hash>`. Annotations retain
  full `source-uid`, `source-resource-version`, readable `history-of` name,
  `source-type`, `history-format=uid-rv-v1`, version, first snapshot actor/time,
  description, and ACLs. Full identity/binding is checked after UID-scoped listing.
  Restore keeps the **current live** type, lifecycle metadata, description, and ACLs.
- A version slot belongs to one exact source UID/resourceVersion. A create 409
  succeeds only after reading and verifying that binding, actual immutable bytes
  and own keys, original type, and copied source description/ACLs. Different retry
  actors/times keep the first snapshot's attribution. An unrelated, mutable,
  terminating, controller-owned, or different-source collision blocks the live write.
- `K8STON_HISTORY_LIMIT` is **1–100**, default **20** when unset. Empty, zero,
  negative, fractional, malformed, or out-of-range settings return 503 before
  history writes (`GET /api/config` also reports the configuration error).
  Newest eligible snapshots per UID are kept. Cleanup uses snapshot UID/RV delete
  preconditions, serial requests, and confirms absence; failed/pending cleanup
  returns 503 and blocks the live replacement. Exact-source retries retry pruning.
- History is a set of **pre-write captures**, not a transaction/commit log. A
  snapshot can exist even when the live replacement failed, and older history
  may already have been pruned. Failed cleanup can temporarily exceed retention;
  pruning runs on update/restore attempts, not in a background job. ResourceVersions
  are opaque; external intermediate changes between K8ston writes are not captured.

### Consumer rollouts and response upgrade

Environment variables are fixed at container start. _Restart apps_ requests
pod-template rollouts for Deployments, StatefulSets, and DaemonSets with explicit
references to the Secret in the same namespace. `lib/consumers.ts` matches exact
names in `env[].valueFrom.secretKeyRef` and `envFrom[].secretRef` across normal,
init, and ephemeral containers (where present in the template),
`volumes[].secret.secretName`, `volumes[].projected.sources[].secret.name`, and
`imagePullSecrets[].name`. ConfigMaps, literal values, annotations, and similar
names do not match. Direct Pods, Jobs/CronJobs, storage-driver references, and
references injected into live Pods or inherited through ServiceAccounts are not
discovered. A workload with multiple references is patched once per request.

Disabled by default (`K8STON_RESTART_ENABLED=false`: button + hint hidden, API
returns 403 before discovery). To opt in, set it to `true` and grant `list`/`patch`
on all three `apps` resources. In impersonation mode, lists and patches carry the
complete human identity; both impersonation grants and human RBAC must allow them.

The endpoint waits for discovery, then allows at most **four in-flight patches
per request**, across all kinds, setting `k8ston.io/restarted-at` on each matched
pod template. Each patch is an RFC 6902 JSON Patch that first tests the inspected
workload UID and resourceVersion: a same-name replacement or any intervening edit
(including reference removal) fails with 409/422 before any mutation, is reported
once, and is never blind-retried against the new revision. Matches without a usable
identity fail as `incomplete_list` without a name-only patch. An acknowledgement
means **rollout requested**, not completed, healthy, or confirmed credential uptake.
Paused Deployments, OnDelete/partitioned update strategies, image caching, and
application behavior can require operator action. Ordinary Secret/projected mounts
usually sync after a kubelet delay, but `subPath` mounts do not; applications may
also need to reload the files.

**API upgrade:** `POST .../secrets/:name/restart-consumers` has no body. The old
`deployments`/`statefulSets`/`daemonSets` arrays are replaced by a typed result:

| HTTP | `status`     | Meaning                                                                                                               |
| ---- | ------------ | --------------------------------------------------------------------------------------------------------------------- |
| 200  | `requested`  | Every discovered match's patch was acknowledged; discovery completed for all three kinds.                             |
| 200  | `no_targets` | All three inventories completed with zero matching workloads.                                                         |
| 207  | `partial`    | At least one acknowledged patch, plus patch or discovery failures.                                                    |
| 503  | `failed`     | No acknowledged patches, with patch or discovery failures. This includes unknown inventories with zero known matches. |

Every attempt result contains `matched`, `requested: [{ kind, name }]`,
`failures: [{ kind, name, code, message, httpStatus? }]`,
`discoveryFailures: [{ kind, code, message, httpStatus? }]`, `message`, and `note`.
`matched = requested.length + failures.length` counts **known matches**, not
unknown inventories. Failed kinds are never treated as empty and are not patched;
known matches from other kinds can still be processed. Discovery follows all pages
within the collection budgets below. Malformed, inconsistent, or over-budget
inventories are reported as `incomplete_list` rather than silently truncated.
Failure messages are fixed guidance; raw API errors,
headers, and Secret values are excluded. A 503 attempt also supplies conventional
`error` text; preflight/session/flag/authorization failures keep `{ error }` alone.

Clients must inspect `status` and retain the structured 207/503 result. The UI
shows success/info/warning/error notifications and persistent workload/discovery
details. Audit `secret.restart` records acknowledged names and classified
failures; `partial` and `failed` have `result: error`, and `no_targets` is explicit.
Native workload UIDs/resourceVersions stay internal to the patch request and never
appear in results or audits. Review workload state before retrying: after a
conflict, reload the workload and retry only if the rollout is still wanted. A
transport failure may follow an applied patch, and retrying rescans all kinds and
can request another rollout for earlier successes. No rollout watcher or background
retry is added.

### History upgrade and reviewed recovery

Upgrade all writer replicas together and keep their annotation prefix and retention
configuration consistent. Older writers still use name-only history. This upgrade
does **not** relabel or rewrite existing objects.

**Unbound legacy history is quarantined:** old `<name>-vN` objects lacking the new
format/UID/revision/immutable binding are excluded from automatic listing, restore,
pruning, and deletion. Malformed bound objects are excluded too. An empty history
list after upgrade does not mean those copies were erased. There is no legacy
bypass or automatic adoption by name, even for admins. A delete/recreate or backup
restore that assigns a new live UID starts a separate history lifetime.

For legacy recovery, a Kubernetes operator must establish provenance using trusted
audit/backup records, namespace, and the original object's lifetime; a matching
name or old ACL alone is insufficient. Review the selected raw data and destination
access/lifecycle requirements, then recover the approved **base64 data** through
native tooling into a reviewed live Secret, using current UID/RV preconditions for
an existing target. Do not retag legacy objects as bound history or submit base64
as plaintext to K8ston. Future K8ston edits create fresh bound history. The old
copies remain quarantined until the operator explicitly removes them.

If an external edit follows a failed K8ston write, the app counter may be unchanged
while its occupied snapshot slot is bound to the earlier resourceVersion. Even a
metadata-only external change then causes a **409 source conflict**. After reviewing
the current UID, occupied snapshots, and their contents, an operator can CAS-update
only the live version counter to an unused positive value above that UID's retained
history, then reload and retry. Preserve the archived objects; do not overwrite or
retag them to force a retry. Malformed/exhausted counters and counters behind retained
history likewise need review. Normal external edits after a successful K8ston write
are captured at their current native revision on the next write.

### Restore/delete contract upgrade

Both operations now **require the caller's expected live `resourceVersion`**:

- Restore: `POST .../secrets/:name/restore` with JSON
  `{ "version": 1, "resourceVersion": "123456" }`.
- Delete: `DELETE .../secrets/:name?resourceVersion=123456`, optionally adding
  `&keepHistory=true` (default false). URL-encode opaque revisions; no DELETE body
  is used. Missing/blank revisions, duplicate query fields, and invalid
  `keepHistory` values return 400. Older clients must adopt this contract.

After current live authorization, a revision mismatch returns **409 before history
reads, snapshots, cleanup, or live writes**. Restore rechecks the live UID/RV after
reading its target and retains both in the native replacement. Restoring a
terminating Secret returns 409 before history access. The UI's **Reload latest**
fetches actual live/history data and closes the confirmation only after both loads
succeed; review the new state before retrying. Failed reloads retain the error.

Deletion cleans eligible UID-bound history **before** submitting the live delete.
Every snapshot delete uses its own UID/RV preconditions and an absence check. The
authorized live UID/RV is rechecked before each cleanup mutation and before live
deletion; a changed ACL, revision, or replacement stops further work with a conflict.
Failed/pending history cleanup returns 503 (snapshot precondition conflicts return
409), leaving the live authorization object untouched by this request so cleanup
can be retried. A final history inventory must be empty. Live deletion then uses
native **UID and resourceVersion delete preconditions**, protecting replacements
and changes that race the last check.

- **200** `{ "status": "deleted", "name": "…", "deleted": "…", "uid": "…",
"history": "cleaned" }` means the live name was confirmed absent after deletion.
- **202** `{ "status": "pending", "name": "…", "uid": "…", "resourceVersion": "…",
"deletionTimestamp": "…", "history": "cleaned" }` means it still exists. The
  timestamp is optional. Finalizers can delay deletion; the UI stays on the Secret,
  shows pending status, and reloads its data/history. GET/list DTOs also expose an
  optional `deletionTimestamp`. Reload for the latest revision before retrying.
- With `keepHistory=true`, `history` is `"retained"` and no history listing/deletion
  is attempted. Kept copies are for operator recovery and never attach to a new UID.
- Only confirmed deletion removes cached detail/history and returns to the list.
  Restore success installs the returned live revision and refreshes history/list
  caches. Pending deletion refreshes caches without treating the Secret as gone.

**Nontransactional limits:** these are separate Kubernetes operations, not atomic
erasure. Earlier snapshot saves/pruning/deletions are not rolled back after a later
conflict or failure. Rechecks narrow races but do not lock authorization across
objects. `history: "cleaned"` describes the eligible inventory checked before live
deletion: an already-in-flight writer can still add a snapshot after that check,
even after the live object disappears. A failed live-delete/confirmation request
can have an uncertain outcome; reload before retrying. If the live object is gone,
or a later same-name replacement exists, remaining old-UID copies need operator
cleanup. Predecessor UIDs, kept copies, legacy/quarantined objects, and external
backups are outside this cleanup guarantee. Kubernetes writers can still alter
metadata or delete immutable objects; history is not a tamper-proof backup. See the
[history guide](../website/docs/guides/versioning-history.mdx) for recovery details.

## Viewing secret values

**Expand value** opens a text value on Preview; **Raw** exposes its original text
and **Copy** copies the full value. JSON/YAML/XML use syntax highlighting, Markdown
supports rich text and code fences, and PEM/text use plain text. Preview rendering
happens in the browser with lazily loaded preview/editor modules.

Markdown images now appear as **inert descriptive text**, using their alternative
text or title when available. Opening a preview never fetches an embedded image or
other resource URL. Raw HTML is displayed as text; script markup and unsafe URL
schemes such as `javascript:` remain inert. Safe Markdown links, including GFM
bare-URL autolinks, remain explicit user actions and open a new tab with
`noopener noreferrer`, including links around image descriptions. Activating a
link contacts its destination.

The whole preview shares the highlighting budget: **131,072 UTF-16 code units**,
measured by JavaScript `String.length`. Larger values skip Markdown parsing and
syntax highlighting, showing escaped, untruncated raw text with a short notice.
The limit applies with automatic or manually selected content types. Raw and Copy
retain the original value; the rich-preview limit does not truncate stored data or
the raw display. Binary values keep their separate read-only base64 viewer.

## Native data, types, and lifecycle

Kubernetes `Secret.data` stores bytes as base64. K8ston keeps those bytes intact:

- Detail and history responses split values into **`data`** (lossless Unicode
  text) and **`binaryData`** (original base64 for non-UTF-8 or binary-control
  values). `keys` includes both sets. Empty text, a literal replacement character
  (`�`), and a leading Unicode BOM remain text and are preserved.
- Summaries add `binaryKeys` (names only) and `immutable` (boolean). They never
  include either value map. Detail/history binary values stay masked until
  revealed, copied, or opened in the read-only **base64** viewer.
- Create `data` and optional `stringData` are **plaintext**, with `stringData`
  taking precedence. Invalid Unicode and binary controls are rejected before
  encoding; use Kubernetes tooling with base64 `data` to create/change binary
  values. Do not paste base64 into K8ston's plaintext fields. Write requests
  containing the response-only `binaryData` field return 400; PUT also rejects
  the create-only `stringData` alias instead of silently ignoring an intended edit.
- On PUT, **omit `data` for a metadata-only update**. This preserves every stored
  byte. A supplied `data` map replaces all data; `{}` clears a mutable text
  Secret. For binary-containing Secrets the form locks all data controls and
  submits metadata only; the API rejects any plaintext replacement with 422.
- Immutable Secrets allow metadata-only updates (or byte-identical data through
  the API). Data additions, removals, and changed-byte restores return 422 **before
  snapshots or writes**. The form allows metadata edits and disables data editing
  and UI restores. To change data, create a new Secret and update its consumers.
- Updates/restores preserve the **live** UID, owner references, finalizers,
  immutable state, type, and other native metadata. Restore copies the snapshot's
  raw base64 data, retaining current live description/ACLs and lifecycle metadata.
  It does not decode then re-encode values or adopt snapshot ownership/type.

API and form use the same native key/type rules. Keys are 1–253 characters using
letters, digits, `.`, `_`, or `-`; `.` and names starting with `..` are invalid.
`__proto__`, `constructor`, and `toString` are supported as ordinary **own keys**,
including across validation, the Kubernetes SDK, and UI cache refreshes.

| Type                             | Native data requirements                                            |
| -------------------------------- | ------------------------------------------------------------------- |
| `Opaque` (default)               | Arbitrary supported keys                                            |
| `kubernetes.io/basic-auth`       | `username` **or** `password` (or both); empty values allowed        |
| `kubernetes.io/ssh-auth`         | Nonempty `ssh-privatekey`                                           |
| `kubernetes.io/tls`              | Both `tls.crt` and `tls.key`; no certificate/key-content validation |
| `kubernetes.io/dockerconfigjson` | `.dockerconfigjson` containing a JSON object or `null`              |
| `kubernetes.io/dockercfg`        | `.dockercfg` containing a JSON object or `null`                     |

Built-in validation runs before snapshots as well as live writes; it does not
verify credentials against a registry or other service. Custom type strings are
preserved without the former UI-only 64-character cap. Empty create types default
to `Opaque`. Bootstrap token types retain Kubernetes' unconstrained data semantics.
**Service-account token creation, editing, and restore are unsupported:** create,
update (including metadata-only), and restore return 422. Use Kubernetes TokenRequest or
the service-account controller to manage that lifecycle. The Opaque archive format
does not enable controller-token mutation support. Deletion retains the normal authorization policy.

**Data-contract upgrade:** clients must read both value maps and use `binaryKeys`
instead of assuming every key is editable text in `data`. Re-fetch cached DTOs
after upgrading. Omit `data` when editing only metadata on binary/immutable
Secrets. Previously accepted invalid built-in payloads now fail before side
effects, and service-account token writes are explicitly unsupported. Existing
bytes are not migrated or rewritten by this upgrade; bytes already lost by an
older lossy edit require an intact snapshot or an external backup to recover.

## API budgets and diagnostics (upgrade)

All API JSON successes/errors and authentication redirects explicitly send
**`Cache-Control: no-store`**. Create, PUT, and restore use a streaming JSON reader:

- **16 MiB (16,777,216 bytes)** is the inclusive UTF-8 request-envelope limit.
  An oversized `Content-Length` is rejected before reading; actual stream bytes
  are counted even with no header or an understated length. Excess bodies return
  **413**, malformed JSON/UTF-8 or invalid length headers return **400**, before
  snapshots or mutation. The stream is cancelled on rejection.
- The envelope accommodates escaped Unicode/ASCII, punctuation, and overlapping
  create `data`/`stringData` maps. Native data validation still applies: text maps
  conservatively require `ceil(1.4 × UTF-8 key/value bytes) <= 1 MiB`. An individually
  invalid map returns 400; an oversized merged create map or raw restore returns 413. The envelope is not a larger Kubernetes Secret allowance. Configure ingress
  request limits accordingly; upstream limits can reject a request earlier.
- Each submitted `allowedGroups`/`allowedUsers` array has at most **256 entries**,
  each at most **256 UTF-8 bytes before trimming**, comma-free and nonblank after
  trimming. Policy `groups`/`users` arrays have the same count/byte ceilings;
  invalid policy is unavailable (503), never absent. These are ACL storage limits;
  session/impersonation groups retain their complete identity and have no
  application count cap.
- Validation responses retain at most **20** classified issues: known top-level
  `path`, fixed `code`/`message`, no submitted values, arbitrary nested keys, or
  validator payloads. Unexpected errors use fixed guidance. Kubernetes errors
  retain numeric HTTP statuses, including 401/403/409/410/429; their raw messages,
  Status bodies, and headers are never returned or logged by error serializers.
  A Kubernetes 403 can be **effective human RBAC or SA impersonation permissions**
  in impersonation mode, or ServiceAccount RBAC in hybrid mode. It is distinct
  from a K8ston session/ACL denial; clients must not parse upstream error text.

`lib/k8s-list.ts` reads serial **100-object pages**, at most **100 pages per
inventory**. It preserves selectors and complete per-user request options on
every request. Aggregate limits are fixed application budgets:

| Inventory                                              | Raw objects examined |  Aggregate JSON byte budget |
| ------------------------------------------------------ | -------------------: | --------------------------: |
| Live Secrets in one namespace                          |                5,000 |                      32 MiB |
| Raw history for one live UID (versions/restore lookup) |                1,000 |                     160 MiB |
| History cleanup/pruning for one live UID               |                1,000 | 8 MiB of projected metadata |
| Workloads, **per kind**                                |                2,000 |                      32 MiB |
| Unrestricted namespace discovery                       |                5,000 |                       8 MiB |

Byte accounting uses UTF-8 JSON of SDK-decoded pages, before filtering/deduplication;
cleanup instead measures projected metadata and page metadata without reading or
decoding Secret values. All modes count raw objects/pages. These bound application
accumulation; the SDK already buffers/decodes each upstream page. They are not
streaming transport-response limits, per-process/global limits, or a cap on an
entire multi-inventory operation. Restart can read three inventories concurrently;
history mutations can perform several bounded inventories and serial cleanup calls.

Live lists use `<annotation-prefix>/kind!=history` **server-side**, including
label-less Secrets. Managed-only visibility still depends on the **annotation**,
and current live ACLs are enforced. UID-bound history selectors/validation apply
to every history page. Identical projected duplicates appear once; conflicting
duplicates or inconsistent list revisions fail. Continuation tokens are opaque
printable ASCII, at most **8 KiB**; malformed/repeated tokens and budget exhaustion
return controlled 503 incomplete-inventory diagnostics. Failed/expired pages never
produce partial success or an automatic token restart (history surfaces controlled
503; restart isolates failed kinds). Repair or retry a fresh request; large cleanup
backlogs can require operator-reviewed native cleanup.

**Namespace upgrade:** own-namespace scope still exposes only the pod namespace.
In cluster scope, a nonempty `K8STON_NAMESPACES` is deduplicated/sorted and checked
locally with **zero namespace-list requests**; entries are configuration, not proof
of existence or Kubernetes permission. An empty allowlist requires complete bounded
namespace discovery. Failure now returns an error instead of silently falling back
to the pod namespace. Configure an explicit allowlist when cluster-wide listing is
not granted. Namespace policy uses own properties: `constructor` is an ordinary
valid namespace, and absent/empty rules keep the documented open-policy semantics.

**Synthetic measurement:** `tests/collections-measurement.test.ts` sends real SDK
requests to loopback for 120 live Secrets plus 2,400 UID-bound snapshots, each with
8,192 decoded fixture-data bytes and realistic metadata. Original Secret listing:
**1 call / 2,520 objects / 29,827,466 JSON response bytes**. History-excluding
pagination: **2 calls / 120 objects / 1,385,195 bytes**. The public summary response
is identical (**42,304 bytes**); configured allowlist checks make **0 namespace-list
calls**. These are deterministic uncompressed fixture-body bytes, excluding HTTP
headers/TLS, and request counts—not production timing or a speed claim. Reproduce
from the repository root:

```bash
TMPDIR="$PWD/app/tests/.runtime" pnpm test:unit app/tests/collections-measurement.test.ts --disableConsoleIntercept
```

## Session authentication and upgrades

With authentication enabled (the default), set `SESSION_SECRET` to an explicit
random key of **at least 32 characters**, for example generated with
`openssl rand -hex 32`. Missing, empty, short, whitespace-only, and the former
public development fallback keys are rejected. Login fails closed and existing
cookies cannot authenticate under invalid configuration. The error names the
setting without logging its value. All replicas must use the same key.

**Upgrade:** deployments relying on the old development fallback (including copied
local examples) must supply a new key before enabling auth. Replacing a key
invalidates its existing sessions; users must sign in again. Validation happens
when authentication is used, so builds need no runtime key. Explicit
`AUTH_DISABLED=true` still supplies the local mock user without minting a JWT.

Sessions require HS256, issuer `k8ston`, nonempty `sub`/`email`, numeric `iat`/`exp`,
and an unexpired lifetime; malformed identity/group claims are rejected. Omitted
display names and groups still default to the email and an empty list.

OIDC callbacks require all three short-lived state/nonce/PKCE cookies and consume
them on every attempt, including failures. Retry by starting a new login. UserInfo
can supplement only the validated ID-token subject; a subject mismatch rejects
login. Providers without UserInfo, or with unavailable optional UserInfo, can
still use ID-token claims. Group mapping uses the first nonempty string-array
claim from `OIDC_GROUPS_CLAIM`, `groups`, `roles`, then nested `realm_access.roles`.

**Diagnostic upgrade:** callback failures carry only an allowlisted OAuth/OIDC
`idp_error` (for example `access_denied` or `invalid_grant`), or `provider_error`
for unknown/oversized codes. Raw descriptions, authorization codes/state, headers,
hostnames, and upstream messages are excluded from logs and failure redirects.
Logs classify descriptions as `redirect_uri`, `provided`, or `omitted` (over 2 KiB),
retain allowlisted network/library codes and fixed hints, and record only a boolean
`redirectBaseMatches` for the request/configured redirect base comparison. At most
eight error causes are inspected. Login 502 responses provide a fixed error and
optional classified `code`/`hint`; they no longer return the raw issuer URL.

## Local development

Prerequisites: Node 22.22 (the Docker build version) or the developer/CI version
in [`.tool-versions`](../.tool-versions), the pnpm version selected by root
[package.json](../package.json), and a kubeconfig for a development cluster
(`KUBECONFIG` or `~/.kube/config`). Current dependencies require at least Node 22.19.
Choose credentials allowed to manage Secrets in your development namespace.

```bash
# From the repository root.
pnpm install --frozen-lockfile
cp -n app/.env.example app/.env
# Set K8STON_NAMESPACE in app/.env to your development namespace (example: default).
pnpm --dir app dev --hostname 127.0.0.1   # http://localhost:3000
```

`cp -n` preserves an existing `app/.env`; adapt it deliberately if it exists.
`AUTH_DISABLED=true` makes every request the mock admin, ignores session cookies,
and still performs real Kubernetes writes. Keep the server loopback-bound and
never use the bypass in production or for per-user authorization checks.

To exercise real SSO locally, set a fresh `SESSION_SECRET`, set
`AUTH_DISABLED=false`, and fill in `OIDC_*`
(your IdP needs redirect URI `http://localhost:3000/api/auth/callback`).

Prefer a batteries-included setup? The repo-root sandbox spins up a kind
cluster with seeded fixtures plus Dex as a throwaway OIDC provider —
see [`../sandbox/README.md`](../sandbox/README.md) (`make up`, then copy
`sandbox/app.env.sandbox` to `app/.env`).

From the repository root, use `pnpm --dir app build`, `pnpm --dir app lint`,
`pnpm --dir app start --hostname 127.0.0.1`, and `pnpm --dir app e2e`.
The Playwright suite needs a production build and
`pnpm --dir app exec playwright install chromium`. It mocks Kubernetes-backed
HTTP APIs and does not prove real cluster RBAC or OIDC integration.

From the **repository root**, run `pnpm test:unit` for Node-only backend regressions,
or `pnpm test:unit app/tests/auth-oidc.test.ts` for a focused file. These tests use
synthetic environment/cookie/provider fixtures, disable `.env` loading, and block
Kubernetes credential loaders; no cluster or IdP is needed.

For repo-scoped production/browser verification without loading developer `.env`
files, the test preload supplies synthetic runtime configuration (no IdP/cluster):

```bash
# From the repository root; the temporary-output parent is checked first.
ls -d app/tests/.runtime app
TMPDIR="$PWD/app/tests/.runtime" NODE_OPTIONS="--require=$PWD/app/tests/helpers/offline-runtime.cjs" pnpm --dir app build
CI=1 TMPDIR="$PWD/app/tests/.runtime" NODE_OPTIONS="--require=$PWD/app/tests/helpers/offline-runtime.cjs" pnpm --dir app e2e --project=chromium-dark --workers=2 secret-data.spec.ts
```

These browser tests mock HTTP APIs and use the existing Playwright browser
installation. Reports/build output stay under `app/`; temporary browser profiles
stay under `app/tests/.runtime/`. The preload is a verification helper, not a
deployment configuration.

## Deploy to Kubernetes / OpenShift

Manifests live in `app/k8s/`. Run the following deployment commands **from `app/`**.
Customize the example provider/public URL, admins, namespace policy, and image tag
before applying them. Namespace-scoped (default, least privilege):

```bash
kubectl apply -f k8s/namespace.yaml -f k8s/serviceaccount.yaml -f k8s/role.yaml
kubectl apply -f k8s/configmap-access.yaml -f k8s/configmap-app.yaml
# Prepare a private env file outside the checkout with OIDC_CLIENT_SECRET and
# a fresh SESSION_SECRET from openssl rand -hex 32; never commit real values.
kubectl create secret generic k8ston-oidc -n k8ston \
  --from-env-file=/secure/path/k8ston-oidc.env
kubectl apply -f k8s/deployment.yaml
```

For a centralized multi-namespace dashboard instead, set `K8STON_SCOPE=cluster`
in `k8s/configmap-app.yaml`, apply `k8s/clusterrole.yaml`, and optionally narrow
with `K8STON_NAMESPACES="team-a,team-b"`. Then expose via Ingress/Route with TLS
and register the OIDC redirect URI (`https://<host>/api/auth/callback`).

## Configuration reference

| Variable                                                                     | Default                                               | Purpose                                                           |
| ---------------------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------- |
| `K8STON_SCOPE`                                                               | `namespace`                                           | `namespace` (own NS only) or `cluster`                            |
| `K8STON_NAMESPACES`                                                          | —                                                     | comma allowlist for cluster scope                                 |
| `K8STON_HISTORY_LIMIT`                                                       | `20`                                                  | eligible snapshots per live UID, integer 1–100                    |
| `K8STON_MANAGED_ONLY`                                                        | `true`                                                | hide secrets without `managed-by=k8ston` (404)                    |
| `K8STON_ETCD_ENCRYPTED`                                                      | `false`                                               | set `true` once apiserver encryption is on                        |
| `K8STON_IMPERSONATION`                                                       | `false`                                               | forward SSO identity to K8s RBAC                                  |
| `K8STON_RESTART_ENABLED`                                                     | `false`                                               | `true` enables "Restart apps" (needs apps RBAC rule)              |
| `K8STON_ADMIN_GROUPS`, `K8STON_ADMIN_USERS`                                  | —                                                     | bootstrap admins (both empty = every authenticated user is admin) |
| `K8STON_ACCESS_CONFIGMAP`                                                    | `k8ston-access`                                       | namespace-rules ConfigMap name                                    |
| `AUTH_DISABLED`                                                              | `false`                                               | `true` = mock admin, local dev only                               |
| `SESSION_SECRET`                                                             | — (required with auth)                                | ≥32-char random HMAC key; no development fallback                 |
| `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`                        | —                                                     | SSO provider (discovery-based)                                    |
| `OIDC_ALLOW_HTTP`                                                            | `false`                                               | allow `http://` issuers — loopback + non-prod only (sandbox Dex)  |
| `OIDC_SCOPES`, `OIDC_GROUPS_CLAIM`, `OIDC_USERNAME_CLAIM`, `OIDC_NAME_CLAIM` | `openid profile email groups`/`groups`/`email`/`name` | claim mapping                                                     |
| `NEXT_PUBLIC_APP_URL`                                                        | `http://localhost:3000`                               | public URL (derives OIDC redirect)                                |
| `APP_URL`                                                                    | `http://localhost:3000` fallback                      | server runtime base URL when `NEXT_PUBLIC_APP_URL` is not set     |

`NEXT_PUBLIC_APP_URL` takes precedence over `APP_URL` and can be baked into a build.
For an image promoted between environments, prefer runtime `APP_URL` without a
conflicting build-time `NEXT_PUBLIC_APP_URL`. `OIDC_REDIRECT_URI` can explicitly
override the callback; it must match the provider's registration.

## Project layout

```
app/                    # Next.js App Router
  api/namespaces/...    # secrets CRUD, versions, restore, restart-consumers
  api/auth/...          # OIDC login/callback/logout/me
  secrets/[ns]/[name]   # detail / edit / history views
lib/                    # k8s client, OIDC+session, authz, snapshots, validation
components/             # dashboard, tables, forms, masked values, history
k8s/                    # namespace, SA, Role/ClusterRole, configs, deployment
```
