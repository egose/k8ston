import { createHash } from 'node:crypto';
import { HttpError } from './errors';

export interface CollectionLimits {
  pageSize: number;
  maxPages: number;
  maxItems: number;
  /** UTF-8 JSON bytes of pages (or metadata projections for cleanup). */
  maxBytes: number;
}

const MiB = 1024 * 1024;
export const COLLECTION_LIMITS = {
  liveSecrets: { pageSize: 100, maxPages: 100, maxItems: 5_000, maxBytes: 32 * MiB },
  // Accommodates 100 retained native 1 MiB data archives, plus metadata. Larger
  // backlogs fail explicitly and require operator cleanup, never partial erasure.
  history: { pageSize: 100, maxPages: 100, maxItems: 1_000, maxBytes: 160 * MiB },
  historyMetadata: { pageSize: 100, maxPages: 100, maxItems: 1_000, maxBytes: 8 * MiB },
  workloads: { pageSize: 100, maxPages: 100, maxItems: 2_000, maxBytes: 32 * MiB },
  namespaces: { pageSize: 100, maxPages: 100, maxItems: 5_000, maxBytes: 8 * MiB },
} as const satisfies Record<string, CollectionLimits>;
export const CONTINUE_BYTE_LIMIT = 8 * 1024;

type IncompleteReason =
  | 'invalid_page'
  | 'invalid_continue'
  | 'repeated_continue'
  | 'inconsistent_page'
  | 'page_limit'
  | 'item_limit'
  | 'byte_limit';

export class CollectionReadError extends HttpError {
  constructor(public reason: IncompleteReason) {
    super(
      503,
      `Kubernetes inventory is incomplete (${reason}). No partial inventory was used. Retry or ask an operator to review collection limits.`,
    );
  }
}

interface ListObject {
  metadata?: { name?: string; namespace?: string };
}
interface ListPage<T> {
  items: T[];
  metadata?: { _continue?: string; resourceVersion?: string };
}
export interface PageRequest {
  limit: number;
  _continue?: string;
}

/**
 * Complete, serial, bounded Kubernetes inventories. Callers capture their entire
 * per-user requestOptions and selectors in readPage; this helper never alters
 * identity, retries an expired token, or returns a successful partial result.
 * Projection lets cleanup retain metadata rather than all Secret values.
 * Its projection-only byte mode never visits data, even for fingerprinting;
 * raw page/item-count limits still apply. Projectors must have no side effects.
 *
 * The SDK has already buffered/decoded each response. These are application
 * accumulation/work bounds, not a streaming transport-response byte limit.
 */
export async function readK8sCollection<T extends ListObject, R>(
  readPage: (page: PageRequest) => Promise<ListPage<T>>,
  limits: CollectionLimits,
  project: (item: T) => R | null,
  measure: 'page' | 'projection' = 'page',
): Promise<R[]> {
  const result: R[] = [];
  const tokens = new Set<string>();
  const identities = new Map<string, string>();
  let continuation: string | undefined;
  let revision: string | undefined;
  let items = 0;
  let bytes = 0;
  for (let pageNumber = 0; pageNumber < limits.maxPages; pageNumber++) {
    const page = await readPage({ limit: limits.pageSize, ...(continuation ? { _continue: continuation } : {}) });
    if (
      !page ||
      !Array.isArray(page.items) ||
      (page.metadata !== undefined &&
        (!page.metadata || typeof page.metadata !== 'object' || Array.isArray(page.metadata)))
    ) {
      throw new CollectionReadError('invalid_page');
    }
    items += page.items.length;
    if (page.items.length > limits.pageSize || items > limits.maxItems) throw new CollectionReadError('item_limit');
    try {
      bytes += Buffer.byteLength(JSON.stringify(measure === 'page' ? page : { metadata: page.metadata }), 'utf8');
    } catch {
      throw new CollectionReadError('invalid_page');
    }
    if (bytes > limits.maxBytes) throw new CollectionReadError('byte_limit');

    const token = page.metadata?._continue;
    if (
      token !== undefined &&
      token !== '' &&
      (typeof token !== 'string' || token.length > CONTINUE_BYTE_LIMIT || /[^\x21-\x7e]/.test(token))
    ) {
      throw new CollectionReadError('invalid_continue');
    }
    if (token && tokens.has(token)) throw new CollectionReadError('repeated_continue');
    const pageRevision = page.metadata?.resourceVersion;
    if (
      (pageRevision !== undefined && typeof pageRevision !== 'string') ||
      (pageNumber > 0 && pageRevision !== revision)
    )
      throw new CollectionReadError('inconsistent_page');
    revision = pageRevision;

    for (const item of page.items) {
      if (
        !item ||
        typeof item !== 'object' ||
        typeof item.metadata?.name !== 'string' ||
        !item.metadata.name ||
        (item.metadata.namespace !== undefined && typeof item.metadata.namespace !== 'string')
      ) {
        throw new CollectionReadError('invalid_page');
      }
      const projected = project(item);
      if (projected === null) continue;
      const serialized = JSON.stringify(projected);
      if (measure === 'projection') {
        bytes += Buffer.byteLength(serialized, 'utf8');
        if (bytes > limits.maxBytes) throw new CollectionReadError('byte_limit');
      }
      const identity = JSON.stringify([item.metadata.namespace ?? '', item.metadata.name]);
      // Keep bounded hashes, not duplicated raw values, for duplicate detection.
      const fingerprint = createHash('sha256').update(serialized).digest('hex');
      const previous = identities.get(identity);
      if (previous !== undefined) {
        if (previous !== fingerprint) throw new CollectionReadError('inconsistent_page');
        continue;
      }
      identities.set(identity, fingerprint);
      result.push(projected);
    }
    if (!token) return result;
    tokens.add(token);
    continuation = token;
  }
  throw new CollectionReadError('page_limit');
}
