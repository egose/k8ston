import { createHash } from 'node:crypto';
import type { V1Secret } from '@kubernetes/client-node';
import type { SessionUser } from './auth';
import { ANNOTATIONS, LABELS, MANAGED_BY_VALUE, config } from './config';
import { HttpError } from './http';
import { getCoreApi, requestOptions, toK8sError } from './k8s';
import { COLLECTION_LIMITS, CollectionReadError, readK8sCollection } from './k8s-list';

const HISTORY_FORMAT = 'uid-rv-v1';

/** Internal records: cleanup uses only metadata; restore uses native base64. */
export interface SnapshotMetadata {
  name: string;
  uid: string;
  resourceVersion: string;
  version: number;
  sourceResourceVersion: string;
  sourceType: string;
  snapshotAt?: string;
  snapshotBy?: string;
}

export interface RawSnapshotRecord {
  metadata: SnapshotMetadata;
  secret: V1Secret;
}

interface LiveIdentity {
  namespace: string;
  name: string;
  uid: string;
  resourceVersion: string;
}

function liveIdentity(namespace: string, live: V1Secret): LiveIdentity {
  const meta = live.metadata;
  if (
    !meta?.name ||
    !meta.uid ||
    !meta.resourceVersion ||
    meta.namespace !== namespace ||
    meta.labels?.[LABELS.kind] === 'history'
  ) {
    throw new HttpError(
      409,
      'History requires a current live Secret with namespace, UID, and resourceVersion. Reload and retry.',
    );
  }
  return { namespace, name: meta.name, uid: meta.uid, resourceVersion: meta.resourceVersion };
}

function positiveVersion(value: string | undefined): number | null {
  if (!value || !/^[1-9]\d*$/.test(value)) return null;
  const version = Number(value);
  return Number.isSafeInteger(version) ? version : null;
}

/** An unversioned native Secret is logically v1; its first edit saves v1 → v2. */
export function currentSecretVersion(secret: V1Secret): number {
  const value = secret.metadata?.annotations?.[ANNOTATIONS.version];
  if (value === undefined || value === '0') return 1;
  const version = positiveVersion(value);
  if (version === null)
    throw new HttpError(409, 'Invalid Secret version counter. An operator must review and repair it before retrying.');
  return version;
}

export function nextSecretVersion(secret: V1Secret): number {
  const current = currentSecretVersion(secret);
  if (current === Number.MAX_SAFE_INTEGER)
    throw new HttpError(409, 'Secret version counter is exhausted; an operator must review history.');
  return current + 1;
}

// 128-bit hashes are bounded DNS/label values. Full source identity is always
// checked as well: a hash/name collision is never evidence of ownership.
function identityHash(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 32);
}

function snapshotName(uid: string, version: number): string {
  return `krypton-h-${identityHash(uid)}-v${version}`;
}

function snapshotMetadata(secret: V1Secret, source: LiveIdentity): SnapshotMetadata | null {
  const meta = secret.metadata;
  const ann = meta?.annotations ?? {};
  const labels = meta?.labels ?? {};
  const version = positiveVersion(ann[ANNOTATIONS.version]);
  const revision = ann[ANNOTATIONS.sourceResourceVersion];
  // Explicit quarantine: legacy/unbound or malformed records have no automatic
  // read, restore, prune, or delete path. Never fall back to history-of=<name>.
  if (
    ann[ANNOTATIONS.historyFormat] !== HISTORY_FORMAT ||
    ann[ANNOTATIONS.sourceUid] !== source.uid ||
    ann[ANNOTATIONS.historyOf] !== source.name ||
    !revision ||
    !ann[ANNOTATIONS.sourceType] ||
    version === null ||
    meta?.namespace !== source.namespace ||
    !meta.uid ||
    !meta.resourceVersion ||
    meta.name !== snapshotName(source.uid, version) ||
    labels[LABELS.kind] !== 'history' ||
    labels[LABELS.managedBy] !== MANAGED_BY_VALUE ||
    labels[LABELS.sourceUid] !== identityHash(source.uid) ||
    labels[LABELS.sourceResourceVersion] !== identityHash(revision) ||
    secret.immutable !== true ||
    secret.type !== 'Opaque'
  )
    return null;
  return {
    name: meta.name,
    uid: meta.uid,
    resourceVersion: meta.resourceVersion,
    version,
    sourceResourceVersion: revision,
    sourceType: ann[ANNOTATIONS.sourceType],
    snapshotAt: ann[ANNOTATIONS.snapshotAt],
    snapshotBy: ann[ANNOTATIONS.snapshotBy],
  };
}

async function listRecords<R>(
  source: LiveIdentity,
  user: SessionUser,
  project: (metadata: SnapshotMetadata, secret: V1Secret) => R,
  measure: 'page' | 'projection' = 'page',
): Promise<R[]> {
  const core = getCoreApi();
  const opts = requestOptions(user);
  return readK8sCollection(
    (page) =>
      core.listNamespacedSecret(
        {
          ...page,
          namespace: source.namespace,
          labelSelector: `${LABELS.sourceUid}=${identityHash(source.uid)},${LABELS.kind}=history`,
        },
        opts,
      ),
    measure === 'projection' ? COLLECTION_LIMITS.historyMetadata : COLLECTION_LIMITS.history,
    (secret) => {
      const metadata = snapshotMetadata(secret, source);
      return metadata ? project(metadata, secret) : null;
    },
    measure,
  );
}

/** Call only after authorizing the supplied live object, never with a name alone. */
export async function listSnapshots(
  namespace: string,
  live: V1Secret,
  user: SessionUser,
): Promise<RawSnapshotRecord[]> {
  const source = liveIdentity(namespace, live);
  try {
    return (await listRecords(source, user, (metadata, secret) => ({ metadata, secret }))).sort(
      (a, b) => b.metadata.version - a.metadata.version,
    );
  } catch (err) {
    if (err instanceof CollectionReadError) throw err;
    throw new HttpError(503, 'UID-bound history is unavailable; snapshot listing failed.');
  }
}

export async function readSnapshotVersion(
  namespace: string,
  live: V1Secret,
  version: number,
  user: SessionUser,
): Promise<RawSnapshotRecord> {
  const target = (await listSnapshots(namespace, live, user)).find((record) => record.metadata.version === version);
  if (!target) throw new HttpError(404, `No UID-bound snapshot found for version ${version}`);
  return target;
}

function snapshotFor(source: LiveIdentity, live: V1Secret, user: SessionUser): V1Secret {
  const ann = live.metadata?.annotations ?? {};
  return {
    metadata: {
      namespace: source.namespace,
      name: snapshotName(source.uid, currentSecretVersion(live)),
      labels: {
        [LABELS.managedBy]: MANAGED_BY_VALUE,
        [LABELS.kind]: 'history',
        [LABELS.sourceUid]: identityHash(source.uid),
        [LABELS.sourceResourceVersion]: identityHash(source.resourceVersion),
      },
      annotations: {
        [ANNOTATIONS.historyFormat]: HISTORY_FORMAT,
        [ANNOTATIONS.historyOf]: source.name,
        [ANNOTATIONS.sourceUid]: source.uid,
        [ANNOTATIONS.sourceResourceVersion]: source.resourceVersion,
        [ANNOTATIONS.sourceType]: live.type ?? 'Opaque',
        [ANNOTATIONS.version]: String(currentSecretVersion(live)),
        [ANNOTATIONS.snapshotAt]: new Date().toISOString(),
        [ANNOTATIONS.snapshotBy]: user.email,
        [ANNOTATIONS.description]: ann[ANNOTATIONS.description] ?? '',
        [ANNOTATIONS.allowedGroups]: ann[ANNOTATIONS.allowedGroups] ?? '',
        [ANNOTATIONS.allowedUsers]: ann[ANNOTATIONS.allowedUsers] ?? '',
      },
    },
    // A standalone data archive must not trigger native type controllers or
    // inherit live owners, finalizers, managedFields, or controller annotations.
    type: 'Opaque',
    immutable: true,
    data: { ...live.data },
  };
}

function sameSourceContent(expected: V1Secret, actual: V1Secret, source: LiveIdentity): boolean {
  const record = snapshotMetadata(actual, source);
  if (
    !record ||
    record.sourceResourceVersion !== source.resourceVersion ||
    actual.metadata?.name !== expected.metadata?.name ||
    actual.metadata?.deletionTimestamp ||
    actual.metadata?.ownerReferences?.length ||
    actual.metadata?.finalizers?.length
  )
    return false;
  // Actor/time describe the first successful snapshot attempt, not the retry.
  for (const key of [
    ANNOTATIONS.sourceType,
    ANNOTATIONS.description,
    ANNOTATIONS.allowedGroups,
    ANNOTATIONS.allowedUsers,
  ]) {
    if (actual.metadata?.annotations?.[key] !== expected.metadata?.annotations?.[key]) return false;
  }
  const wanted = expected.data ?? {};
  const stored = actual.data ?? {};
  // Verify actual immutable bytes and own keys, never just a mutable fingerprint
  // annotation. Kubernetes can canonicalize base64 without changing its bytes.
  return (
    Object.keys(wanted).length === Object.keys(stored).length &&
    Object.entries(wanted).every(
      ([key, value]) =>
        Object.hasOwn(stored, key) && Buffer.from(value, 'base64').equals(Buffer.from(stored[key], 'base64')),
    )
  );
}

/** Save/verify this exact UID + resourceVersion before permitting a live write. */
export async function createSnapshot(namespace: string, live: V1Secret, user: SessionUser): Promise<void> {
  const limit = config.historyLimit;
  const source = liveIdentity(namespace, live);
  const expected = snapshotFor(source, live, user);
  const core = getCoreApi();
  let stored: V1Secret;
  try {
    stored = await core.createNamespacedSecret({ namespace, body: expected }, requestOptions(user));
  } catch (err) {
    if (toK8sError(err).status !== 409)
      throw new HttpError(503, 'Source snapshot could not be saved; live write was not attempted.');
    try {
      stored = await core.readNamespacedSecret({ namespace, name: expected.metadata!.name! }, requestOptions(user));
    } catch {
      throw new HttpError(
        409,
        'Snapshot collision could not be verified; live write was not attempted. Reload and retry.',
      );
    }
  }
  // Also check the create response: admission must not change the archived data
  // or turn it into a mutable/controller-owned Secret.
  if (!sameSourceContent(expected, stored, source)) {
    throw new HttpError(
      409,
      'Snapshot identity/content conflict; live write was not attempted. An operator must review the occupied history version.',
    );
  }
  // Exact-source retries must retry failed pruning too, not skip it on 409.
  await pruneSnapshots(source, snapshotMetadata(stored, source)!, limit, user);
}

async function removeRecords(
  namespace: string,
  records: SnapshotMetadata[],
  user: SessionUser,
  operation: 'pruning' | 'cleanup',
  beforeDelete?: () => Promise<void>,
): Promise<void> {
  const core = getCoreApi();
  let absent = 0;
  let pending = 0;
  let failed = 0;
  let conflict = false;
  // Serial requests bound cleanup concurrency, even after a retention reduction.
  for (const record of records) {
    // Outside the per-record catch: a changed live ACL/revision stops cleanup,
    // rather than being swallowed as one snapshot failure and continuing.
    await beforeDelete?.();
    try {
      await core.deleteNamespacedSecret(
        {
          namespace,
          name: record.name,
          body: { preconditions: { uid: record.uid, resourceVersion: record.resourceVersion } },
        },
        requestOptions(user),
      );
      // The SDK types DELETE as Status, but Kubernetes can return a terminating
      // Secret. Confirm absence instead of claiming finalizers finished cleanup.
      await core.readNamespacedSecret({ namespace, name: record.name }, requestOptions(user));
      pending++;
    } catch (err) {
      const { status } = toK8sError(err);
      if (status === 404) absent++;
      else {
        failed++;
        if (status === 409) conflict = true;
      }
    }
  }
  if (pending || failed) {
    throw new HttpError(
      operation === 'cleanup' && conflict ? 409 : 503,
      `History ${operation} incomplete: ${absent}/${records.length} confirmed absent, ${pending} still present, ${failed} failed. ` +
        (operation === 'pruning'
          ? 'Live write was not attempted; retry after resolving cleanup.'
          : 'Live deletion was not attempted; snapshot copies may remain. Reload and retry cleanup.'),
    );
  }
}

async function pruneSnapshots(
  source: LiveIdentity,
  saved: SnapshotMetadata,
  limit: number,
  user: SessionUser,
): Promise<void> {
  let records: SnapshotMetadata[];
  try {
    records = (await listRecords(source, user, (metadata) => metadata, 'projection')).sort(
      (a, b) => b.version - a.version,
    );
  } catch (err) {
    if (err instanceof CollectionReadError) throw err;
    throw new HttpError(
      503,
      'History pruning could not list snapshots. A source snapshot exists; live write was not attempted. Retry cleanup.',
    );
  }
  if (
    !records.some(
      (record) =>
        record.name === saved.name && record.uid === saved.uid && record.resourceVersion === saved.resourceVersion,
    )
  ) {
    throw new HttpError(
      409,
      'Source snapshot changed or disappeared before pruning; live write was not attempted. Reload and retry.',
    );
  }
  if (records.some((record) => record.version > saved.version)) {
    throw new HttpError(
      409,
      'Live version is behind retained history; live write was not attempted. Reload or have an operator review the version counter.',
    );
  }
  await removeRecords(source.namespace, records.slice(limit), user, 'pruning');
}

/**
 * Only this authorized live UID's bound records are eligible for deletion.
 * Live deletion supplies a revision guard after listing/before each mutation.
 * Standalone history cleanup still uses each snapshot's native UID/RV CAS.
 */
export async function deleteSnapshots(
  namespace: string,
  live: V1Secret,
  user: SessionUser,
  beforeDelete?: () => Promise<void>,
): Promise<void> {
  const source = liveIdentity(namespace, live);
  let records: SnapshotMetadata[];
  try {
    records = (await listRecords(source, user, (metadata) => metadata, 'projection')).sort(
      (a, b) => b.version - a.version,
    );
  } catch (err) {
    if (err instanceof CollectionReadError) throw err;
    throw new HttpError(
      503,
      'History cleanup could not list UID-bound snapshots. Live deletion was not attempted; reload and retry cleanup.',
    );
  }
  await removeRecords(namespace, records, user, 'cleanup', beforeDelete);
  await beforeDelete?.();
  // Catch history added during cleanup without unbounded delete/relist loops.
  // A later concurrent writer can still add copies: this is not a transaction.
  let remaining: SnapshotMetadata[];
  try {
    remaining = await listRecords(source, user, (metadata) => metadata, 'projection');
  } catch (err) {
    if (err instanceof CollectionReadError) throw err;
    throw new HttpError(
      503,
      'History cleanup could not confirm the final inventory. Live deletion was not attempted; reload and retry cleanup.',
    );
  }
  if (remaining.length) {
    throw new HttpError(
      503,
      'History cleanup changed during this operation; UID-bound snapshots remain. Live deletion was not attempted; reload and retry cleanup.',
    );
  }
}
