import { ApiException } from '@kubernetes/client-node';
import { cookies } from 'next/headers';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { TEST_APP_URL } from './helpers/environment';
import { byteChunks, streamedRequest } from './helpers/http';
import { mockKubernetes } from './helpers/kubernetes';
import { apiError, boundSnapshot, mockHistoryStore } from './helpers/history';
import { dataUser, nativeSecret } from './helpers/secret-data';

const marker = 'synthetic-private-error-value';
const namespace = 'unit-test';
const name = 'credentials';
const url = `${TEST_APP_URL}/api/namespaces/${namespace}/secrets`;
const ctx = { params: Promise.resolve({ namespace, name }) };

beforeEach(() => {
  for (const method of ['log', 'warn', 'error'] as const) vi.spyOn(console, method).mockImplementation(() => {});
});

async function signIn() {
  const auth = await import('@/lib/auth');
  await auth.setSessionCookie(await auth.createSessionToken(dataUser));
}

async function mutate(operation: 'create' | 'update' | 'restore', req: Request) {
  if (operation === 'create') return (await import('@/app/api/namespaces/[namespace]/secrets/route')).POST(req, ctx);
  if (operation === 'update')
    return (await import('@/app/api/namespaces/[namespace]/secrets/[name]/route')).PUT(req, ctx);
  return (await import('@/app/api/namespaces/[namespace]/secrets/[name]/restore/route')).POST(req, ctx);
}

function expectNoStore(response: Response) {
  expect(response.headers.get('cache-control')).toBe('no-store');
}

describe('streaming JSON byte boundary', () => {
  it('accepts exactly 16 MiB and preserves multibyte characters split across chunks', async () => {
    const { readJson, JSON_BODY_LIMIT } = await import('@/lib/http');
    const text = '{"data":{"__proto__":"café 🔐","constructor":"\\t\\n\\\""}}';
    const small = streamedRequest(byteChunks(text, 1));
    const decoded = await readJson(small.request);
    expect(decoded).toEqual(JSON.parse(text));
    expect(Object.hasOwn((decoded as { data: object }).data, '__proto__')).toBe(true);
    const exact = text + ' '.repeat(JSON_BODY_LIMIT - Buffer.byteLength(text));
    const large = streamedRequest(byteChunks(exact), { 'Content-Length': String(JSON_BODY_LIMIT) });
    expect(await readJson(large.request)).toEqual(decoded);
    expect(large.cancel).not.toHaveBeenCalled();
  });

  it.each([undefined, '1'])('stops/cancels at the first excess streamed byte (length=%s)', async (length) => {
    const { readJson, JSON_BODY_LIMIT } = await import('@/lib/http');
    const stream = streamedRequest(
      [new Uint8Array(JSON_BODY_LIMIT).fill(32), new Uint8Array([32]), new Uint8Array([32])],
      length ? { 'Content-Length': length } : undefined,
    );
    await expect(readJson(stream.request)).rejects.toMatchObject({ status: 413 });
    expect(stream.pull).toHaveBeenCalledTimes(2);
    expect(stream.cancel).toHaveBeenCalledOnce();
  });

  it.each(['16777217', '999999999999999999999999999999999999999999999'])(
    'rejects oversized length %s before pulling the stream',
    async (length) => {
      const { readJson } = await import('@/lib/http');
      const stream = streamedRequest(byteChunks('{}'), { 'Content-Length': length });
      await expect(readJson(stream.request)).rejects.toMatchObject({ status: 413 });
      expect(stream.pull).not.toHaveBeenCalled();
      expect(stream.cancel).toHaveBeenCalledOnce();
    },
  );

  it.each(['-1', 'NaN', '1.5', '1, 2'])('rejects malformed length %s without reading values', async (length) => {
    const { readJson } = await import('@/lib/http');
    const stream = streamedRequest(byteChunks('{}'), { 'Content-Length': length });
    await expect(readJson(stream.request)).rejects.toMatchObject({ status: 400 });
    expect(stream.pull).not.toHaveBeenCalled();
  });

  it('does not convert a stream read failure into a raw error response', async () => {
    const { readJson, jsonError } = await import('@/lib/http');
    function* failing(): Generator<Uint8Array> {
      yield new TextEncoder().encode('{');
      throw new Error(marker);
    }
    const { request } = streamedRequest(failing());
    const response = await readJson(request).then(() => {
      throw new Error('Expected failure');
    }, jsonError);
    expect(response.status).toBe(400);
    expect(await response.text()).not.toContain(marker);
    expectNoStore(response);
  });
});

describe.each(['create', 'update', 'restore'] as const)('%s input before side effects', (operation) => {
  it.each([
    { label: 'malformed JSON', text: `{"data":{"key":"${marker}"},` },
    { label: 'empty body', text: '' },
    { label: 'negative scalar', text: '-1' },
    { label: 'null', text: 'null' },
    { label: 'array', text: '[]' },
  ])('returns a redacted 400 for $label', async ({ text }) => {
    const mock = await mockKubernetes();
    await signIn();
    const response = await mutate(operation, streamedRequest(byteChunks(text)).request);
    expect(response.status).toBe(400);
    expectNoStore(response);
    expect(await response.text()).not.toContain(marker);
    expect(mock.core.createNamespacedSecret).not.toHaveBeenCalled();
    expect(mock.core.replaceNamespacedSecret).not.toHaveBeenCalled();
    expect(mock.core.deleteNamespacedSecret).not.toHaveBeenCalled();
  });

  it.each(['header', 'chunked', 'invalid UTF-8'] as const)('rejects %s before snapshots/mutation', async (kind) => {
    const mock = await mockKubernetes();
    await signIn();
    const { JSON_BODY_LIMIT } = await import('@/lib/http');
    const stream =
      kind === 'header'
        ? streamedRequest(byteChunks('{}'), { 'Content-Length': String(JSON_BODY_LIMIT + 1) })
        : streamedRequest([kind === 'chunked' ? new Uint8Array(JSON_BODY_LIMIT + 1) : new Uint8Array([0xff])]);
    const response = await mutate(operation, stream.request);
    expect(response.status).toBe(kind === 'invalid UTF-8' ? 400 : 413);
    expectNoStore(response);
    expect(mock.core.createNamespacedSecret).not.toHaveBeenCalled();
    expect(mock.core.replaceNamespacedSecret).not.toHaveBeenCalled();
    expect(mock.core.deleteNamespacedSecret).not.toHaveBeenCalled();
  });
});

it('accepts maximum supported text with fully escaped, overlapping create maps', async () => {
  const mock = await mockKubernetes();
  await signIn();
  mock.core.createNamespacedSecret.mockImplementation(async ({ body }) => body);
  const { K8S_SECRET_SIZE_LIMIT } = await import('@/lib/config');
  const { JSON_BODY_LIMIT } = await import('@/lib/http');
  const key = '__proto__';
  const valueLength = Math.floor(K8S_SECRET_SIZE_LIMIT / 1.4) - key.length;
  const escaped = `{"${key}":"${'\\u0061'.repeat(valueLength)}"}`;
  const text = `{"name":"credentials","data":${escaped},"stringData":${escaped}}`;
  expect(Buffer.byteLength(text)).toBeLessThan(JSON_BODY_LIMIT);
  expect(Buffer.byteLength(text)).toBeGreaterThan(8 * 1024 * 1024);
  const response = await mutate('create', streamedRequest(byteChunks(text)).request);
  expect(response.status).toBe(201);
  expectNoStore(response);
  const data = mock.core.createNamespacedSecret.mock.calls[0][0].body.data!;
  expect(Object.hasOwn(data, key)).toBe(true);
  expect(Buffer.from(data[key], 'base64').byteLength).toBe(valueLength);
});

it('accepts a large valid Unicode Secret and rejects oversized native data within the JSON envelope', async () => {
  const mock = await mockKubernetes();
  await signIn();
  mock.core.createNamespacedSecret.mockImplementation(async ({ body }) => body);
  const value = 'café 🔐\t\n"\\'.repeat(40_000);
  const response = await mutate(
    'create',
    streamedRequest(byteChunks(JSON.stringify({ name, data: { constructor: value } }), 4093)).request,
  );
  expect(response.status).toBe(201);
  const saved = new Map(Object.entries(mock.core.createNamespacedSecret.mock.calls[0][0].body.data!));
  expect(Buffer.from(saved.get('constructor')!, 'base64').equals(Buffer.from(value))).toBe(true);
  mock.core.createNamespacedSecret.mockClear();
  const tooLarge = await mutate(
    'create',
    streamedRequest(byteChunks(JSON.stringify({ name, data: { key: 'x'.repeat(1024 * 1024) } }))).request,
  );
  expect(tooLarge.status).toBe(400);
  expect(mock.core.createNamespacedSecret).not.toHaveBeenCalled();
});

describe('ACL array and element bounds', () => {
  it.each(['allowedGroups', 'allowedUsers'] as const)(
    'enforces %s limits on create/update without truncating',
    async (field) => {
      const { createSecretSchema, updateSecretSchema, ACL_ENTRY_LIMIT, ACL_ENTRY_BYTE_LIMIT } =
        await import('@/lib/validation');
      const valid = Array.from({ length: ACL_ENTRY_LIMIT }, () => 'é'.repeat(ACL_ENTRY_BYTE_LIMIT / 2));
      for (const schema of [createSecretSchema, updateSecretSchema]) {
        expect(schema.parse({ name, resourceVersion: '17', [field]: valid })[field]).toEqual(valid);
        expect(schema.safeParse({ name, resourceVersion: '17', [field]: [...valid, 'extra'] }).success).toBe(false);
        expect(schema.safeParse({ name, resourceVersion: '17', [field]: ['é'.repeat(129)] }).success).toBe(false);
      }
    },
  );

  it('rejects oversized ACLs at the authenticated route without creating a Secret', async () => {
    const mock = await mockKubernetes();
    await signIn();
    const response = await mutate(
      'create',
      streamedRequest(byteChunks(JSON.stringify({ name, allowedUsers: Array(257).fill(marker) }))).request,
    );
    expect(response.status).toBe(400);
    expect(await response.text()).not.toContain(marker);
    expectNoStore(response);
    expect(mock.core.createNamespacedSecret).not.toHaveBeenCalled();
  });
});

describe('safe error serialization', () => {
  it.each([400, 401, 403, 404, 409, 410, 413, 422, 429, 500, 503, 599])(
    'preserves numeric Kubernetes %i with no raw values/headers',
    async (status) => {
      const { jsonError } = await import('@/lib/http');
      for (const body of [
        { message: marker },
        JSON.stringify({ message: marker }),
        Buffer.from(marker),
        new Uint8Array(Buffer.from(marker)),
      ]) {
        const error = new ApiException(status, marker, body, {
          authorization: `Bearer ${marker}`,
          'x-private': marker,
        });
        const response = jsonError(error);
        expect(response.status).toBe(status);
        expectNoStore(response);
        const text = await response.text();
        expect(text).toContain(`Kubernetes API (${status})`);
        expect(text).not.toContain(marker);
        expect(text).not.toMatch(/authorization|x-private|missing Kubernetes RBAC permission/);
        if (status === 403) expect(text).toContain('effective identity');
      }
    },
  );

  it.each([
    { label: 'Error', error: new Error(marker), status: 500 },
    { label: 'status-shaped payload', error: { status: 409, message: marker }, status: 409 },
    { label: 'statusCode', error: { statusCode: 429, message: marker }, status: 429 },
    { label: 'string code', error: { code: `403 ${marker}`, message: marker }, status: 500 },
    { label: 'invalid numeric code', error: { code: 301, message: marker }, status: 500 },
    { label: 'NaN status', error: { status: NaN, message: marker }, status: 500 },
    { label: 'fractional status', error: { status: 401.5, message: marker }, status: 500 },
    { label: 'fake issues', error: { issues: [{ message: marker, input: marker }] }, status: 500 },
  ])('does not trust $label messages', async ({ error, status }) => {
    const { jsonError } = await import('@/lib/http');
    const response = jsonError(error);
    expect(response.status).toBe(status);
    expect(await response.text()).not.toContain(marker);
    expectNoStore(response);
    expect(console.error).not.toHaveBeenCalled();
  });

  it('redacts real Zod enum/input/custom messages and untrusted nested keys; caps issues', async () => {
    const { jsonError } = await import('@/lib/http');
    const schema = z.object({
      data: z.record(z.string(), z.enum([marker])),
      allowedUsers: z.array(z.string().refine(() => false, marker)),
    });
    const parsed = schema.safeParse(
      { data: { [marker]: 'wrong' }, allowedUsers: Array(30).fill(marker) },
      { reportInput: true },
    );
    expect(parsed.success).toBe(false);
    if (parsed.success) throw new Error('Expected validation failure');
    const response = jsonError(parsed.error);
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.issues).toHaveLength(20);
    expect(body.issues[0].path).toEqual(['data']);
    expect(JSON.stringify(body)).not.toContain(marker);
    expect(Object.keys(body.issues[0]).sort()).toEqual(['code', 'message', 'path']);
    expectNoStore(response);
  });

  it('sanitizes errors from authenticated handlers and keeps application guidance', async () => {
    const mock = await mockKubernetes();
    await signIn();
    const { GET } = await import('@/app/api/namespaces/[namespace]/secrets/[name]/route');
    mock.core.readNamespacedSecret.mockRejectedValue(
      new ApiException(403, marker, { message: marker }, { authorization: marker }),
    );
    const response = await GET(new Request(`${url}/${name}`), ctx);
    expect(response.status).toBe(403);
    expect(await response.text()).not.toContain(marker);
    expectNoStore(response);
    const { HttpError, jsonError } = await import('@/lib/http');
    expect(await jsonError(new HttpError(409, 'Reload the live Secret before retrying')).json()).toEqual({
      error: 'Reload the live Secret before retrying',
    });
    expect(
      JSON.stringify([
        vi.mocked(console.log).mock.calls,
        vi.mocked(console.warn).mock.calls,
        vi.mocked(console.error).mock.calls,
      ]),
    ).not.toContain(marker);
  });
});

describe('authenticated API cache policy', () => {
  async function invoke(action: string) {
    const collection = await import('@/app/api/namespaces/[namespace]/secrets/route');
    const named = await import('@/app/api/namespaces/[namespace]/secrets/[name]/route');
    switch (action) {
      case 'namespaces':
        return (await import('@/app/api/namespaces/route')).GET();
      case 'config':
        return (await import('@/app/api/config/route')).GET();
      case 'me':
        return (await import('@/app/api/auth/me/route')).GET();
      case 'logout':
        return (await import('@/app/api/auth/logout/route')).POST();
      case 'list':
        return collection.GET(new Request(url), ctx);
      case 'read':
        return named.GET(new Request(`${url}/${name}`), ctx);
      case 'history':
        return (await import('@/app/api/namespaces/[namespace]/secrets/[name]/versions/route')).GET(
          new Request(`${url}/${name}/versions`),
          ctx,
        );
      case 'create':
        return collection.POST(
          new Request(url, { method: 'POST', body: JSON.stringify({ name: 'created', data: { key: 'synthetic' } }) }),
          ctx,
        );
      case 'update':
        return named.PUT(
          new Request(`${url}/${name}`, { method: 'PUT', body: '{"resourceVersion":"17","description":"updated"}' }),
          ctx,
        );
      case 'restore':
        return (await import('@/app/api/namespaces/[namespace]/secrets/[name]/restore/route')).POST(
          new Request(`${url}/${name}/restore`, { method: 'POST', body: '{"version":1,"resourceVersion":"17"}' }),
          ctx,
        );
      case 'delete':
        return named.DELETE(new Request(`${url}/${name}?resourceVersion=17`, { method: 'DELETE' }), ctx);
      default:
        return (await import('@/app/api/namespaces/[namespace]/secrets/[name]/restart-consumers/route')).POST(
          new Request(`${url}/${name}/restart-consumers`, { method: 'POST' }),
          ctx,
        );
    }
  }

  it.each([
    'namespaces',
    'config',
    'me',
    'logout',
    'list',
    'read',
    'history',
    'create',
    'update',
    'restore',
    'delete',
    'restart',
  ])('uses no-store for %s success', async (action) => {
    process.env.KRYPTON_RESTART_ENABLED = 'true';
    const live = nativeSecret({ data: { key: Buffer.from('synthetic').toString('base64') } });
    delete live.metadata!.finalizers;
    const store = await mockHistoryStore([live, boundSnapshot(live, 1)]);
    for (const list of [
      store.apps.listNamespacedDeployment,
      store.apps.listNamespacedStatefulSet,
      store.apps.listNamespacedDaemonSet,
    ])
      list.mockResolvedValue({ items: [] });
    await signIn();
    const response = await invoke(action);
    expect(response.status).toBe(action === 'create' ? 201 : 200);
    expectNoStore(response);
  });

  it.each(['namespaces', 'me', 'list', 'read', 'history', 'create', 'update', 'restore', 'delete', 'restart'])(
    'uses no-store for unauthenticated %s',
    async (action) => {
      const mock = await mockKubernetes();
      expect((await cookies()).get('krypton_session')).toBeUndefined();
      const response = await invoke(action);
      expect(response.status).toBe(401);
      expectNoStore(response);
      expect(mock.getCoreApi).not.toHaveBeenCalled();
    },
  );

  it('uses no-store for authenticated policy failures and pending deletion', async () => {
    const live = nativeSecret();
    const store = await mockHistoryStore([live]);
    await signIn();
    const pending = await invoke('delete');
    expect(pending.status).toBe(202);
    expectNoStore(pending);
    const auth = await import('@/lib/auth');
    await auth.setSessionCookie(await auth.createSessionToken({ ...dataUser, groups: [] }));
    store.core.readNamespacedConfigMap.mockRejectedValue(apiError(403));
    const failed = await invoke('list');
    expect(failed.status).toBe(503);
    expectNoStore(failed);
  });
});
