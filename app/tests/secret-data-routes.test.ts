import type { V1Secret } from '@kubernetes/client-node';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TEST_APP_URL } from './helpers/environment';
import { mockKubernetes } from './helpers/kubernetes';
import { dataUser, nativeSecret, rawData, textData } from './helpers/secret-data';
import { boundSnapshot, persistedSnapshot } from './helpers/history';

const namespace = 'unit-test';
const name = 'credentials';
const url = `${TEST_APP_URL}/api/namespaces/${namespace}/secrets`;
const ctx = { params: Promise.resolve({ namespace, name }) };
const encode = (data: Record<string, string>) =>
  Object.fromEntries(Object.entries(data).map(([key, value]) => [key, Buffer.from(value).toString('base64')]));

function snapshot(data: V1Secret['data'] = rawData): V1Secret {
  const source = nativeSecret();
  source.metadata!.resourceVersion = '11';
  return boundSnapshot(source, 1, data);
}

async function setup(live = nativeSecret(), target = snapshot()) {
  const mock = await mockKubernetes();
  const auth = await import('@/lib/auth');
  await auth.setSessionCookie(await auth.createSessionToken(dataUser));
  mock.core.readNamespacedSecret.mockResolvedValue(live);
  const snapshots = [target];
  mock.core.listNamespacedSecret.mockImplementation(async () => ({ items: [...snapshots] }));
  mock.core.createNamespacedSecret.mockImplementation(async ({ body }) => {
    const saved = persistedSnapshot(body);
    if (body.metadata?.labels?.['krypton.io/kind'] === 'history') snapshots.push(saved);
    return saved;
  });
  mock.core.replaceNamespacedSecret.mockImplementation(async ({ body }) => ({
    ...body,
    metadata: { ...body.metadata, resourceVersion: '18' },
  }));
  return mock;
}

async function put(input: Record<string, unknown>) {
  const { PUT } = await import('@/app/api/namespaces/[namespace]/secrets/[name]/route');
  return PUT(
    new Request(`${url}/${name}`, { method: 'PUT', body: JSON.stringify({ resourceVersion: '17', ...input }) }),
    ctx,
  );
}

async function create(input: Record<string, unknown>) {
  const { POST } = await import('@/app/api/namespaces/[namespace]/secrets/route');
  return POST(new Request(url, { method: 'POST', body: JSON.stringify({ name, ...input }) }), ctx);
}

async function restore() {
  const { POST } = await import('@/app/api/namespaces/[namespace]/secrets/[name]/restore/route');
  return POST(
    new Request(`${url}/${name}/restore`, {
      method: 'POST',
      body: JSON.stringify({ version: 1, resourceVersion: '17' }),
    }),
    ctx,
  );
}

function expectNoMutation(mock: Awaited<ReturnType<typeof setup>>) {
  expect(mock.core.createNamespacedSecret).not.toHaveBeenCalled();
  expect(mock.core.replaceNamespacedSecret).not.toHaveBeenCalled();
  expect(mock.core.deleteNamespacedSecret).not.toHaveBeenCalled();
}

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('data-integrity routes', () => {
  it('creates own special keys after stringData overrides and returns no values in the summary', async () => {
    const { core } = await setup();
    const response = await create({
      type: 'example.test/custom',
      data: textData,
      stringData: { ['__proto__']: 'overridden' },
    });
    expect(response.status).toBe(201);
    const body = core.createNamespacedSecret.mock.calls[0][0].body;
    expect(body.type).toBe('example.test/custom');
    expect(body.data).toEqual(encode({ ...textData, ['__proto__']: 'overridden' }));
    expect(Object.hasOwn(body.data!, '__proto__')).toBe(true);
    const result = await response.json();
    expect(result.secret).not.toHaveProperty('data');
    expect(result.secret).not.toHaveProperty('binaryData');
    expect(result.secret.binaryKeys).toEqual([]);
  });

  it('GET/history expose lossless binary DTOs while list markers never include values', async () => {
    const { core } = await setup();
    const { GET } = await import('@/app/api/namespaces/[namespace]/secrets/[name]/route');
    const detail = await (await GET(new Request(`${url}/${name}`), ctx)).json();
    expect(detail.secret.data).toEqual(textData);
    expect(detail.secret.binaryData).toEqual({ 'archive.bin': rawData['archive.bin'], control: rawData.control });
    const { GET: history } = await import('@/app/api/namespaces/[namespace]/secrets/[name]/versions/route');
    const versions = await (await history(new Request(`${url}/${name}/versions`), ctx)).json();
    expect(versions.versions[0].data).toEqual(textData);
    expect(versions.versions[0].binaryKeys).toEqual(['archive.bin', 'control']);
    expect(versions.versions[0].binaryData).toEqual(detail.secret.binaryData);
    core.listNamespacedSecret.mockResolvedValue({ items: [nativeSecret()] });
    const { GET: list } = await import('@/app/api/namespaces/[namespace]/secrets/route');
    const summaries = await (await list(new Request(url), ctx)).json();
    expect(summaries.secrets[0].binaryKeys).toEqual(['archive.bin', 'control']);
    expect(summaries.secrets[0]).not.toHaveProperty('data');
    expect(summaries.secrets[0]).not.toHaveProperty('binaryData');
  });

  it('restores all 256 byte values and special keys without decoding, retaining live lifecycle state', async () => {
    const live = nativeSecret({ data: { previous: 'cHJldmlvdXM=' } });
    const { core } = await setup(live);
    const response = await restore();
    expect(response.status).toBe(200);
    expect(core.createNamespacedSecret.mock.calls[0][0].body.data).toEqual(live.data);
    const replacement = core.replaceNamespacedSecret.mock.calls[0][0].body;
    expect(replacement.data).toEqual(rawData);
    expect(replacement.metadata).toMatchObject({
      uid: live.metadata!.uid,
      ownerReferences: live.metadata!.ownerReferences,
      finalizers: live.metadata!.finalizers,
      resourceVersion: '17',
      annotations: { 'krypton.io/description': 'live description', 'krypton.io/version': '3' },
    });
    expect(replacement.immutable).toBe(false);
    const result = await response.json();
    expect(result.secret.data).toEqual(textData);
    expect(result.secret.binaryData['archive.bin']).toBe(rawData['archive.bin']);
    expect(core.createNamespacedSecret.mock.invocationCallOrder[0]).toBeLessThan(
      core.replaceNamespacedSecret.mock.invocationCallOrder[0],
    );
    const audit = JSON.stringify(vi.mocked(console.log).mock.calls);
    for (const value of [...Object.values(textData), ...Object.values(rawData)].filter(Boolean))
      expect(audit).not.toContain(value);
  });

  it.each([false, true])('metadata-only updates preserve binary data and immutable=%s', async (immutable) => {
    const live = nativeSecret({ immutable });
    const { core } = await setup(live);
    const response = await put({ description: 'metadata updated', allowedGroups: ['operators'] });
    expect(response.status).toBe(200);
    const replacement = core.replaceNamespacedSecret.mock.calls[0][0].body;
    expect(replacement.data).toEqual(rawData);
    expect(replacement.immutable).toBe(immutable);
    expect(replacement.metadata).toMatchObject({
      uid: live.metadata!.uid,
      ownerReferences: live.metadata!.ownerReferences,
      finalizers: live.metadata!.finalizers,
      annotations: { 'krypton.io/description': 'metadata updated', 'krypton.io/allowed-groups': 'operators' },
    });
    expect(core.createNamespacedSecret).toHaveBeenCalledTimes(1);
  });

  it('text updates preserve all special keys, UID, owners, finalizers, and absent immutable state', async () => {
    const live = nativeSecret({ data: encode(textData), immutable: undefined });
    const { core } = await setup(live);
    const data = { ...textData, ['__proto__']: 'updated special key' };
    expect((await put({ data })).status).toBe(200);
    const replacement = core.replaceNamespacedSecret.mock.calls[0][0].body;
    expect(replacement.data).toEqual(encode(data));
    expect(replacement.metadata).toMatchObject({
      uid: live.metadata!.uid,
      ownerReferences: live.metadata!.ownerReferences,
      finalizers: live.metadata!.finalizers,
    });
    expect(replacement.immutable).toBeUndefined();
  });

  it.each(['unchanged text PUT', 'same-byte binary restore'])('allows immutable %s', async (action) => {
    // Independent native states: reusing one UID/RV/version for different bytes
    // would create inconsistent duplicate history, not a valid immutable edit.
    const data = action === 'unchanged text PUT' ? encode(textData) : rawData;
    const { core } = await setup(nativeSecret({ data, immutable: true }));
    const response =
      action === 'unchanged text PUT' ? await put({ data: textData, description: 'metadata' }) : await restore();
    expect(response.status).toBe(200);
    expect(core.replaceNamespacedSecret.mock.calls[0][0].body).toMatchObject({ data, immutable: true });
  });
});

describe('rejections before snapshots or live writes', () => {
  it.each(['create', 'update'])(
    'rejects base64 DTO fields as %s input instead of silently ignoring them',
    async (action) => {
      const mock = await setup();
      const input = { binaryData: { ['__proto__']: '/wAB' } };
      const response = action === 'create' ? await create(input) : await put(input);
      expect(response.status).toBe(400);
      expect(await response.text()).toContain('binaryData is a read-only response field');
      expectNoMutation(mock);
    },
  );

  it('rejects update stringData instead of silently treating an intended data edit as metadata-only', async () => {
    const mock = await setup(nativeSecret({ data: encode(textData) }));
    const response = await put({ stringData: { ['__proto__']: 'intended new data' } });
    expect(response.status).toBe(400);
    expect(await response.text()).toContain('stringData is only supported on create');
    expectNoMutation(mock);
  });

  it.each([{}, { 'archive.bin': '\ufffd' }, textData])(
    'rejects every text-data replacement of a binary live Secret',
    async (data) => {
      const mock = await setup();
      const response = await put({ data });
      expect(response.status).toBe(422);
      expect((await response.json()).error).toContain('Omit data for metadata-only updates');
      expectNoMutation(mock);
      expect(mock.core.listNamespacedSecret).not.toHaveBeenCalled();
    },
  );

  it.each([{}, { ...textData, newKey: 'new' }, { ...textData, ['__proto__']: 'different' }])(
    'rejects immutable text additions, changes, and removals',
    async (data) => {
      const mock = await setup(nativeSecret({ data: encode(textData), immutable: true }));
      const response = await put({ data });
      expect(response.status).toBe(422);
      expect((await response.json()).error).toContain('immutable');
      expectNoMutation(mock);
      expect(mock.core.listNamespacedSecret).not.toHaveBeenCalled();
    },
  );

  it('rejects an immutable restore changing bytes before saving the current state', async () => {
    const mock = await setup(nativeSecret({ immutable: true, data: { old: 'b2xk' } }));
    const response = await restore();
    expect(response.status).toBe(422);
    expect((await response.json()).error).toContain('immutable');
    expectNoMutation(mock);
    expect(mock.core.listNamespacedSecret).toHaveBeenCalledTimes(1);
  });

  it.each(['create', 'update', 'metadata', 'restore'])(
    'explicitly rejects controller-owned token %s',
    async (action) => {
      const type = 'kubernetes.io/service-account-token';
      const mock = await setup(nativeSecret({ type, data: { token: 'dG9rZW4=' } }));
      const response =
        action === 'create'
          ? await create({ type, data: { token: 'synthetic' } })
          : action === 'restore'
            ? await restore()
            : await put(action === 'metadata' ? { description: 'metadata' } : { data: { token: 'synthetic' } });
      expect(response.status).toBe(422);
      expect((await response.json()).error).toContain('TokenRequest');
      expectNoMutation(mock);
      expect(mock.core.listNamespacedSecret).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['kubernetes.io/basic-auth', {}],
    ['kubernetes.io/ssh-auth', { 'ssh-privatekey': '' }],
    ['kubernetes.io/tls', { 'tls.crt': 'synthetic' }],
    ['kubernetes.io/dockerconfigjson', { '.dockerconfigjson': 'not-json-private-value' }],
    ['kubernetes.io/dockercfg', { '.dockercfg': '[]' }],
  ] satisfies Array<[string, Record<string, string>]>)(
    'checks %s on create, update, and raw restore',
    async (type, data) => {
      const valid: Record<string, string> =
        type === 'kubernetes.io/basic-auth'
          ? { username: '' }
          : type === 'kubernetes.io/ssh-auth'
            ? { 'ssh-privatekey': 'key' }
            : type === 'kubernetes.io/tls'
              ? { 'tls.crt': '', 'tls.key': '' }
              : type === 'kubernetes.io/dockercfg'
                ? { '.dockercfg': '{}' }
                : { '.dockerconfigjson': '{}' };
      const mock = await setup(nativeSecret({ type, data: encode(valid) }), snapshot(encode(data)));
      for (const response of [await create({ type, data }), await put({ data }), await restore()]) {
        expect(response.status).toBe(422);
        expect(await response.text()).not.toContain('not-json-private-value');
      }
      expectNoMutation(mock);
    },
  );

  it('validates the merged stringData using native basic-auth semantics', async () => {
    const { core } = await setup();
    const response = await create({ type: 'kubernetes.io/basic-auth', data: {}, stringData: { password: '' } });
    expect(response.status).toBe(201);
    expect(core.createNamespacedSecret.mock.calls[0][0].body.data).toEqual({ password: '' });
  });

  it.each([
    { data: { ['__proto__']: 7 } },
    { stringData: { ['__proto__']: false } },
    { data: { 'a/b': 'invalid-key' } },
    { data: { key: '\ud800' } },
  ])('rejects invalid raw input before a key or value can be lost', async (input) => {
    const mock = await setup(nativeSecret({ data: encode(textData) }));
    expect((await create(input)).status).toBe(400);
    if (input.data) expect((await put(input)).status).toBe(400);
    expectNoMutation(mock);
  });
});
