import { z } from 'zod';
import { K8S_SECRET_SIZE_LIMIT } from './config';
import { isSecretText, secretKeyError } from './secret-rules';

/** DNS-subdomain name (K8s object names). */
export const k8sName = z
  .string()
  .min(1)
  .max(253)
  .regex(
    /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/,
    'must be a DNS subdomain name (lowercase letters, numbers, "-" or ".", e.g. database-credentials)',
  );

/**
 * Best-effort conversion of free text into a valid K8s DNS-subdomain name:
 * lowercase, spaces/underscores → dashes, other invalid chars → dashes,
 * collapse repeats, trim leading/trailing "-" / ".".
 */
export function slugifyK8sName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/\.{2,}/g, '.')
    .slice(0, 253)
    .replace(/^[.-]+|[.-]+$/g, '');
}

// Zod's record/object parsers deliberately strip __proto__. Validate the raw
// map BEFORE any such parser, then copy own entries with CreateDataProperty
// semantics. All valid Kubernetes keys (including __proto__) survive this boundary.
export const secretDataSchema = z
  .unknown()
  .transform((input, ctx): Record<string, string> => {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      ctx.addIssue({ code: 'custom', message: 'Data must be an object of text values' });
      return z.NEVER;
    }
    const entries = Object.entries(input);
    let valid = true;
    for (const [key, value] of entries) {
      const keyError = secretKeyError(key);
      if (keyError) {
        valid = false;
        ctx.addIssue({ code: 'custom', path: [key], message: keyError });
      }
      if (typeof value !== 'string' || !isSecretText(value)) {
        valid = false;
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message:
            'Values must be valid Unicode text without binary control characters; use Kubernetes tooling with base64 data for binary values',
        });
      }
    }
    if (!valid) return z.NEVER;
    return Object.fromEntries(entries) as Record<string, string>;
  })
  .refine((data) => estimateSecretSize(data) <= K8S_SECRET_SIZE_LIMIT, {
    message: 'Secret is too large (maximum 1 MB)',
  });

export const secretTypeSchema = z
  .string()
  .refine((type) => type.isWellFormed(), 'Type must be valid Unicode')
  .transform((type) => type || 'Opaque');

const readOnlyBinaryData = z
  .never({
    error: 'binaryData is a read-only response field; use Kubernetes tooling with base64 data to write binary values',
  })
  .optional();

export const ACL_ENTRY_LIMIT = 256;
export const ACL_ENTRY_BYTE_LIMIT = 256;
const aclEntry = z
  .string()
  .max(ACL_ENTRY_BYTE_LIMIT)
  .refine(
    (value) => new TextEncoder().encode(value).byteLength <= ACL_ENTRY_BYTE_LIMIT,
    'ACL entries must be at most 256 UTF-8 bytes',
  );
// Bound raw input before trimming. CSV annotations cannot represent a comma in
// one principal or a blank member; namespace JSON arrays keep their exact values.
export const annotationAclSchema = z
  .array(
    aclEntry
      .transform((entry) => entry.trim())
      .pipe(
        z
          .string()
          .min(1)
          .refine((entry) => !entry.includes(','), 'ACL annotation entries must not contain commas'),
      ),
  )
  .max(ACL_ENTRY_LIMIT);

/** Team name: DNS label (safe for annotations, URLs, and dropdowns). */
export const TEAM_NAME_BYTE_LIMIT = 63;
export const TEAM_LIMIT = 64;
export const teamNameSchema = z
  .string()
  .min(1)
  .max(TEAM_NAME_BYTE_LIMIT)
  .regex(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/, 'must be a DNS label (lowercase letters, numbers, "-" e.g. team1)')
  .refine(
    (value) => new TextEncoder().encode(value).byteLength <= TEAM_NAME_BYTE_LIMIT,
    'Team names must be at most 63 UTF-8 bytes',
  );

/** Update accepts "" to clear back to unassigned (namespace default). */
const updateTeamSchema = z.union([teamNameSchema, z.literal('')]);

export const createSecretSchema = z.object({
  name: k8sName,
  type: secretTypeSchema.default('Opaque'),
  data: secretDataSchema.default({}),
  stringData: secretDataSchema.optional(),
  binaryData: readOnlyBinaryData,
  description: z.string().max(1024).optional().default(''),
  allowedGroups: annotationAclSchema.default([]),
  allowedUsers: annotationAclSchema.default([]),
  /** Omit for unassigned (namespace default). Must exist in the namespace policy when teams are defined. */
  team: teamNameSchema.optional(),
});

export const updateSecretSchema = z.object({
  /** Omit to preserve all native bytes for metadata-only updates. {} clears data. */
  data: secretDataSchema.optional(),
  binaryData: readOnlyBinaryData,
  stringData: z
    .never({ error: 'stringData is only supported on create; use plaintext data for text updates' })
    .optional(),
  description: z.string().max(1024).optional(),
  allowedGroups: annotationAclSchema.optional(),
  allowedUsers: annotationAclSchema.optional(),
  /** Omit to preserve, "" to clear to unassigned, or a defined team name. */
  team: updateTeamSchema.optional(),
  /** optimistic concurrency: must match current metadata.resourceVersion */
  resourceVersion: z.string().min(1, 'resourceVersion is required for safe updates'),
});

/** Kubernetes revisions are opaque strings, never app-level version numbers. */
const expectedResourceVersion = z.string().refine((value) => value.trim().length > 0, {
  message: 'resourceVersion is required; reload the live Secret before retrying',
});

export const deleteSecretSchema = z.object({
  resourceVersion: expectedResourceVersion,
  keepHistory: z.boolean().optional(),
});

export const restoreSecretSchema = z.object({
  version: z.number().int().positive(),
  resourceVersion: expectedResourceVersion,
});

export type CreateSecretInput = z.infer<typeof createSecretSchema>;
export type UpdateSecretInput = z.infer<typeof updateSecretSchema>;
export type DeleteSecretInput = z.infer<typeof deleteSecretSchema>;
export type RestoreSecretInput = z.infer<typeof restoreSecretSchema>;

/** Approximate serialized size of the secret data section (UTF-8 bytes). */
export function estimateSecretSize(data: Record<string, string>): number {
  let size = 0;
  const encoder = new TextEncoder();
  for (const [k, v] of Object.entries(data)) {
    size += encoder.encode(k).length + encoder.encode(v).length;
  }
  // base64 inflates ~33% in etcd; account for it conservatively
  return Math.ceil(size * 1.4);
}

/** One team within a namespace: members see only this team's secrets (plus unassigned iff namespace is open). */
const teamAccessSchema = z
  .object({
    name: teamNameSchema,
    groups: z.array(aclEntry).max(ACL_ENTRY_LIMIT).default([]),
    users: z.array(aclEntry).max(ACL_ENTRY_LIMIT).default([]),
  })
  .strict();

/** Namespace-level access rules stored in the krypton-access ConfigMap. */
export const namespaceAccessSchema = z.record(
  z.string(),
  z
    .object({
      groups: z.array(aclEntry).max(ACL_ENTRY_LIMIT).default([]),
      users: z.array(aclEntry).max(ACL_ENTRY_LIMIT).default([]),
      teams: z.array(teamAccessSchema).max(TEAM_LIMIT).default([]),
    })
    .strict()
    .refine((entry) => new Set(entry.teams.map((t) => t.name)).size === entry.teams.length, {
      message: 'Team names must be unique within a namespace',
    }),
);
export type NamespaceAccessMap = z.infer<typeof namespaceAccessSchema>;

/**
 * Redacted logger — NEVER log secret values. Only metadata goes to logs.
 */
export function auditLog(event: {
  action: string;
  user: string;
  namespace: string;
  name?: string;
  keys?: string[];
  resourceVersion?: string;
  result: 'allow' | 'deny' | 'error';
  detail?: string;
}) {
  // Intentionally logs key NAMES only, never values.
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      app: 'krypton',
      ...event,
    }),
  );
}
