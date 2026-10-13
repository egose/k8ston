import type { V1Secret } from '@kubernetes/client-node';
import { ANNOTATIONS, LABELS, MANAGED_BY_VALUE, config } from './config';
import type { SessionUser } from './auth';
import { annotationAclSchema, estimateSecretSize, secretDataSchema } from './validation';
import { K8S_SECRET_SIZE_LIMIT } from './config';
import {
  BINARY_EDIT_GUIDANCE,
  IMMUTABLE_EDIT_GUIDANCE,
  isSecretText,
  secretKeyError,
  secretTypeDataError,
  unsupportedSecretTypeReason,
} from './secret-rules';
import { currentSecretVersion, nextSecretVersion, type RawSnapshotRecord } from './snapshot-store';
import { HttpError } from './errors';

// ---------------------------------------------------------------------------
// DTOs (text and binary are disjoint; summaries never contain values)
// ---------------------------------------------------------------------------

export interface SecretSummary {
  namespace: string;
  name: string;
  type: string;
  keys: string[];
  keyCount: number;
  description: string;
  version: number;
  resourceVersion: string;
  creationTimestamp?: string;
  /** Present while Kubernetes deletion is waiting (for example on finalizers). */
  deletionTimestamp?: string;
  allowedGroups: string[];
  allowedUsers: string[];
  managedByKrypton: boolean;
  immutable: boolean;
  /** Names only; never include values in list/create responses. */
  binaryKeys: string[];
}

export interface SecretValues {
  /** Losslessly decoded text only (NEVER log this). */
  data: Record<string, string>;
  /** Unsupported text values, represented as exact Kubernetes base64 (NEVER log this). */
  binaryData: Record<string, string>;
}

export interface SecretDetail extends SecretSummary, SecretValues {}

/** `cleaned` describes the checked UID-bound inventory, not an atomic erase. */
export type DeleteSecretResult = {
  name: string;
  uid: string;
  history: 'cleaned' | 'retained';
} & (
  | { status: 'deleted'; deleted: string }
  | { status: 'pending'; resourceVersion: string; deletionTimestamp?: string }
);

export interface SecretVersion extends SecretValues {
  version: number;
  snapshotName: string;
  snapshotAt?: string;
  snapshotBy?: string;
  keys: string[];
  binaryKeys: string[];
}

function decodeText(base64: string): string | null {
  try {
    // ignoreBOM means preserve a leading U+FEFF rather than silently removing it.
    const text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(Buffer.from(base64, 'base64'));
    return isSecretText(text) ? text : null;
  } catch {
    return null;
  }
}

export function decodeData(secret: V1Secret): SecretValues {
  const text: Array<[string, string]> = [];
  const binary: Array<[string, string]> = [];
  for (const [k, v] of Object.entries(secret.data ?? {})) {
    const decoded = decodeText(v);
    if (decoded === null) binary.push([k, v]);
    else text.push([k, decoded]);
  }
  return { data: Object.fromEntries(text), binaryData: Object.fromEntries(binary) };
}

function binaryKeys(secret: V1Secret): string[] {
  return Object.entries(secret.data ?? {})
    .filter(([, value]) => decodeText(value) === null)
    .map(([key]) => key)
    .sort();
}

export function encodeData(data: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(secretDataSchema.parse(data)).map(([k, v]) => [k, Buffer.from(v, 'utf8').toString('base64')]),
  );
}

function csv(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isHistorySnapshot(secret: V1Secret): boolean {
  return secret.metadata?.labels?.[LABELS.kind] === 'history';
}

/** True when the secret was created (or adopted) by Krypton. */
export function isManagedByKrypton(secret: V1Secret): boolean {
  return secret.metadata?.annotations?.[ANNOTATIONS.managedBy] === MANAGED_BY_VALUE;
}

/** Shared list/direct visibility: snapshots are never live objects, even for admins. */
export function isVisibleLiveSecret(secret: V1Secret): boolean {
  return !isHistorySnapshot(secret) && (!config.managedOnly || isManagedByKrypton(secret));
}

export function toSummary(namespace: string, secret: V1Secret): SecretSummary {
  const ann = secret.metadata?.annotations ?? {};
  return {
    namespace,
    name: secret.metadata?.name ?? '',
    type: secret.type ?? 'Opaque',
    keys: Object.keys(secret.data ?? {}).sort(),
    keyCount: Object.keys(secret.data ?? {}).length,
    description: ann[ANNOTATIONS.description] ?? '',
    version: currentSecretVersion(secret),
    resourceVersion: secret.metadata?.resourceVersion ?? '',
    creationTimestamp: secret.metadata?.creationTimestamp as unknown as string | undefined,
    deletionTimestamp: secret.metadata?.deletionTimestamp as unknown as string | undefined,
    allowedGroups: csv(ann[ANNOTATIONS.allowedGroups]),
    allowedUsers: csv(ann[ANNOTATIONS.allowedUsers]),
    managedByKrypton: isManagedByKrypton(secret),
    immutable: secret.immutable === true,
    binaryKeys: binaryKeys(secret),
  };
}

export function toDetail(namespace: string, secret: V1Secret): SecretDetail {
  return { ...toSummary(namespace, secret), ...decodeData(secret) };
}

/** Decode only at the authorized response boundary, never for restore/cleanup. */
export function toSecretVersion({ metadata, secret }: RawSnapshotRecord): SecretVersion {
  const values = decodeData(secret);
  return {
    version: metadata.version,
    snapshotName: metadata.name,
    snapshotAt: metadata.snapshotAt,
    snapshotBy: metadata.snapshotBy,
    keys: Object.keys(secret.data ?? {}).sort(),
    binaryKeys: Object.keys(values.binaryData).sort(),
    ...values,
  };
}

export function assertSizeOk(data: Record<string, string>): void {
  const size = estimateSecretSize(data);
  if (size > K8S_SECRET_SIZE_LIMIT) {
    throw new HttpError(413, `Secret is too large (~${size} bytes, maximum 1 MB)`);
  }
}

interface LiveSecretArgs {
  live?: V1Secret;
  name: string;
  namespace: string;
  type?: string;
  description?: string;
  allowedGroups?: string[];
  allowedUsers?: string[];
  user: SessionUser;
}

export function assertSecretMutationSupported(type: string): void {
  const reason = unsupportedSecretTypeReason(type);
  if (reason) throw new HttpError(422, reason);
}

/** Plaintext create/update only. Omitting data on update preserves the raw map. */
export function buildLiveSecret(args: LiveSecretArgs & { data?: Record<string, string> }): V1Secret {
  assertSecretMutationSupported(args.live?.type ?? args.type ?? 'Opaque');
  if (args.live && args.data !== undefined && binaryKeys(args.live).length > 0) {
    throw new HttpError(422, BINARY_EDIT_GUIDANCE);
  }
  if (args.data !== undefined) assertSizeOk(args.data);
  const encodedData = args.data !== undefined ? encodeData(args.data) : args.live?.data;
  return buildEncodedLiveSecret(args, encodedData);
}

/** Restore takes a native snapshot, never plaintext or a decoded DTO. */
export function buildRawRestoreSecret(
  args: Omit<LiveSecretArgs, 'live' | 'type'> & {
    live: V1Secret;
    snapshot: V1Secret;
  },
): V1Secret {
  return buildEncodedLiveSecret(args, args.snapshot.data);
}

function sameDataBytes(a: V1Secret['data'], b: V1Secret['data']): boolean {
  const left = a ?? {};
  const right = b ?? {};
  return (
    Object.keys(left).length === Object.keys(right).length &&
    Object.entries(left).every(
      ([key, value]) =>
        Object.hasOwn(right, key) && Buffer.from(value, 'base64').equals(Buffer.from(right[key], 'base64')),
    )
  );
}

/** All validation happens while building, before callers persist a snapshot. */
function buildEncodedLiveSecret(args: LiveSecretArgs, encodedData: V1Secret['data']): V1Secret {
  const { live, name, namespace, type, description, allowedGroups, allowedUsers, user } = args;
  // Keep the invariant for callers that bypass route schemas, including raw restore.
  // Undefined preserves native annotations; [] intentionally encodes an empty rule.
  const groupAnnotation = allowedGroups === undefined ? undefined : annotationAclSchema.parse(allowedGroups).join(', ');
  const userAnnotation = allowedUsers === undefined ? undefined : annotationAclSchema.parse(allowedUsers).join(', ');
  const effectiveType = live?.type ?? type ?? 'Opaque';
  assertSecretMutationSupported(effectiveType);
  if (live?.immutable && !sameDataBytes(live.data, encodedData)) {
    throw new HttpError(422, IMMUTABLE_EDIT_GUIDANCE);
  }
  for (const key of Object.keys(encodedData ?? {})) {
    const error = secretKeyError(key);
    if (error) throw new HttpError(400, error);
  }
  const bytes = Object.fromEntries(
    Object.entries(encodedData ?? {}).map(([key, value]) => [key, Buffer.from(value, 'base64')]),
  );
  const typeError = secretTypeDataError(effectiveType, bytes);
  if (typeError) throw new HttpError(422, typeError);
  // Raw snapshots can hold valid native data larger than our conservative text
  // form estimate. Apply Kubernetes' decoded-data bound without UTF-8 conversion.
  if (Object.values(bytes).reduce((size, value) => size + value.length, 0) > K8S_SECRET_SIZE_LIMIT) {
    throw new HttpError(413, 'Secret is too large (maximum 1 MB)');
  }
  const version = live ? nextSecretVersion(live) : 1;
  const prevAnn = live?.metadata?.annotations ?? {};
  return {
    metadata: {
      // A replacement must retain UID, ownerReferences, finalizers, timestamps,
      // and other native lifecycle metadata from the live object, not history.
      ...live?.metadata,
      name,
      namespace,
      // Stamp managed-by as a label too (kubectl -l parity); preserve any
      // existing labels since replaceNamespacedSecret overwrites the object.
      labels: {
        ...(live?.metadata?.labels ?? {}),
        [LABELS.managedBy]: MANAGED_BY_VALUE,
      },
      annotations: {
        ...prevAnn,
        [ANNOTATIONS.managedBy]: MANAGED_BY_VALUE,
        [ANNOTATIONS.version]: String(version),
        [ANNOTATIONS.lastModifiedBy]: user.email,
        [ANNOTATIONS.description]: description ?? prevAnn[ANNOTATIONS.description] ?? '',
        [ANNOTATIONS.allowedGroups]: groupAnnotation ?? prevAnn[ANNOTATIONS.allowedGroups] ?? '',
        [ANNOTATIONS.allowedUsers]: userAnnotation ?? prevAnn[ANNOTATIONS.allowedUsers] ?? '',
      },
    },
    ...(live?.immutable !== undefined ? { immutable: live.immutable } : {}),
    type: effectiveType,
    data: live?.immutable ? live.data : encodedData === undefined ? undefined : { ...encodedData },
  };
}
