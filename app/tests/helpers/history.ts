import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { ApiException, type V1Secret } from '@kubernetes/client-node';
import { mockKubernetes } from './kubernetes';
import type { WireRequest } from './kubernetes-transport';

/** Synthetic fixtures for the documented uid-rv-v1 storage format. */
export const historyHash = (value: string) => createHash('sha256').update(value).digest('hex').slice(0, 32);
export const historyName = (uid: string, version: number) => `krypton-h-${historyHash(uid)}-v${version}`;
export const apiError = (status: number) =>
  new ApiException(
    status,
    'synthetic-private-error',
    { message: 'synthetic-private-body' },
    { private: 'synthetic-header' },
  );

export function boundSnapshot(source: V1Secret, version: number, data = source.data): V1Secret {
  const meta = source.metadata!;
  return {
    metadata: {
      namespace: meta.namespace,
      name: historyName(meta.uid!, version),
      uid: `synthetic-history-${meta.uid}-${version}`,
      resourceVersion: `snapshot-${version}`,
      labels: {
        'krypton.io/managed-by': 'krypton',
        'krypton.io/kind': 'history',
        'krypton.io/source-uid': historyHash(meta.uid!),
        'krypton.io/source-resource-version': historyHash(meta.resourceVersion!),
      },
      annotations: {
        'krypton.io/history-format': 'uid-rv-v1',
        'krypton.io/history-of': meta.name!,
        'krypton.io/source-uid': meta.uid!,
        'krypton.io/source-resource-version': meta.resourceVersion!,
        'krypton.io/source-type': source.type ?? 'Opaque',
        'krypton.io/version': String(version),
        'krypton.io/snapshot-at': '2026-01-01T00:00:00.000Z',
        'krypton.io/snapshot-by': 'first@example.test',
        'krypton.io/description': meta.annotations?.['krypton.io/description'] ?? '',
        'krypton.io/allowed-users': meta.annotations?.['krypton.io/allowed-users'] ?? '',
        'krypton.io/allowed-groups': meta.annotations?.['krypton.io/allowed-groups'] ?? '',
      },
    },
    type: 'Opaque',
    immutable: true,
    data: { ...data },
  };
}

/** Minimal persisted server fields for focused earlier route fixtures. */
export function persistedSnapshot(body: V1Secret): V1Secret {
  return { ...body, metadata: { ...body.metadata, uid: `persisted-${body.metadata?.name}`, resourceVersion: '101' } };
}

/** An offline API store with atomic create/replace and UID/RV delete preconditions. */
export async function mockHistoryStore(initial: V1Secret[] = []) {
  const mock = await mockKubernetes();
  const objects = new Map<string, V1Secret>();
  const key = (namespace: string, name: string) => `${namespace}/${name}`;
  let serial = 100;
  const clone = (secret: V1Secret) => structuredClone(secret);
  const seed = (secret: V1Secret) =>
    objects.set(key(secret.metadata!.namespace!, secret.metadata!.name!), clone(secret));
  initial.forEach(seed);
  const get = (namespace: string, name: string) => {
    const secret = objects.get(key(namespace, name));
    if (!secret) throw apiError(404);
    return clone(secret);
  };
  const persist = (body: V1Secret, namespace: string, uid?: string): V1Secret => {
    const name = body.metadata?.name ?? '';
    if (name.length > 253 || !/^[a-z0-9]([-a-z0-9.]*[a-z0-9])?$/.test(name)) throw apiError(422);
    for (const value of Object.values(body.metadata?.labels ?? {})) {
      if (value.length > 63 || !/^([A-Za-z0-9]([-A-Za-z0-9_.]*[A-Za-z0-9])?)?$/.test(value)) throw apiError(422);
    }
    const secret = clone(body);
    secret.metadata = {
      ...secret.metadata,
      namespace,
      name,
      uid: uid ?? `synthetic-object-${++serial}`,
      resourceVersion: String(++serial),
    };
    secret.type ??= 'Opaque';
    // Simulate the API server's native byte-map/base64 canonicalization.
    if (secret.data)
      secret.data = Object.fromEntries(
        Object.entries(secret.data).map(([k, value]) => [k, Buffer.from(value, 'base64').toString('base64')]),
      );
    seed(secret);
    return clone(secret);
  };
  mock.core.readNamespacedSecret.mockImplementation(async ({ namespace, name }) => get(namespace, name));
  mock.core.listNamespacedSecret.mockImplementation(async ({ namespace, labelSelector, limit, _continue }) => {
    const items = [...objects.values()].filter(
      (secret) =>
        secret.metadata?.namespace === namespace &&
        (!labelSelector ||
          labelSelector.split(',').every((selector) => {
            const [label, value] = selector.split(selector.includes('!=') ? '!=' : '=');
            return selector.includes('!=')
              ? secret.metadata?.labels?.[label] !== value
              : secret.metadata?.labels?.[label] === value;
          })),
    );
    const start = _continue ? Number(_continue.slice('synthetic-page-'.length)) : 0;
    const end = start + (limit ?? items.length);
    return {
      items: items.slice(start, end).map(clone),
      metadata: { _continue: end < items.length ? `synthetic-page-${end}` : '' },
    };
  });
  mock.core.createNamespacedSecret.mockImplementation(async ({ namespace, body }) => {
    if (objects.has(key(namespace, body.metadata!.name!))) throw apiError(409);
    return persist(body, namespace);
  });
  mock.core.replaceNamespacedSecret.mockImplementation(async ({ namespace, name, body }) => {
    const previous = get(namespace, name);
    if (
      previous.metadata?.uid !== body.metadata?.uid ||
      previous.metadata?.resourceVersion !== body.metadata?.resourceVersion
    )
      throw apiError(409);
    if (previous.immutable && (!body.immutable || !isDeepStrictEqual(previous.data, body.data))) throw apiError(422);
    return persist(body, namespace, previous.metadata!.uid);
  });
  mock.core.deleteNamespacedSecret.mockImplementation(async ({ namespace, name, body }) => {
    const previous = get(namespace, name);
    if (
      (body?.preconditions?.uid && body.preconditions.uid !== previous.metadata?.uid) ||
      (body?.preconditions?.resourceVersion &&
        body.preconditions.resourceVersion !== previous.metadata?.resourceVersion)
    )
      throw apiError(409);
    if (previous.metadata?.finalizers?.length) {
      if (!previous.metadata.deletionTimestamp) {
        previous.metadata.deletionTimestamp = new Date('2026-01-02T00:00:00Z');
        previous.metadata.resourceVersion = String(++serial);
      }
      seed(previous);
    } else objects.delete(key(namespace, name));
    return { status: 'Success' };
  });

  /** Reuse the same CAS store behind real generated clients and loopback HTTP. */
  const reply = async (request: WireRequest) => {
    try {
      const url = new URL(request.url, 'http://loopback.test');
      const match = /^\/api\/v1\/namespaces\/([^/]+)\/secrets(?:\/([^/]+))?$/.exec(url.pathname);
      if (!match) throw apiError(500);
      const namespace = decodeURIComponent(match[1]);
      const name = match[2] ? decodeURIComponent(match[2]) : '';
      const body = request.body ? JSON.parse(request.body) : undefined;
      if (request.method === 'POST')
        return { status: 201, body: await mock.core.createNamespacedSecret({ namespace, body }) };
      if (request.method === 'PUT') return { body: await mock.core.replaceNamespacedSecret({ namespace, name, body }) };
      if (request.method === 'DELETE')
        return { body: await mock.core.deleteNamespacedSecret({ namespace, name, body }) };
      if (name) return { body: await mock.core.readNamespacedSecret({ namespace, name }) };
      return {
        body: await mock.core.listNamespacedSecret({
          namespace,
          labelSelector: url.searchParams.get('labelSelector') ?? undefined,
          limit: url.searchParams.has('limit') ? Number(url.searchParams.get('limit')) : undefined,
          _continue: url.searchParams.get('continue') ?? undefined,
        }),
      };
    } catch (err) {
      if (err instanceof ApiException)
        return { status: err.code, body: { kind: 'Status', status: 'Failure', message: 'synthetic-private-body' } };
      throw err;
    }
  };
  return { ...mock, objects, get, seed, reply };
}
