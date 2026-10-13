import { describe, expect, it } from 'vitest';
import { buildLiveSecret, buildRawRestoreSecret, decodeData, encodeData, toDetail, toSummary } from '@/lib/secrets';
import { createSecretSchema, secretDataSchema, updateSecretSchema } from '@/lib/validation';
import { secretKeyError, secretTypeDataError } from '@/lib/secret-rules';
import { binaryBytes, dataUser, nativeSecret, rawData, textData } from './helpers/secret-data';

const args = { name: 'credentials', namespace: 'unit-test', user: dataUser };

describe('lossless Secret bytes and DTOs', () => {
  it('separates binary from empty, literal replacement characters, BOM, and Unicode text', () => {
    const detail = toDetail('unit-test', nativeSecret());
    expect(detail.data).toEqual(textData);
    expect(Object.hasOwn(detail.data, '__proto__')).toBe(true);
    expect(detail.binaryKeys).toEqual(['archive.bin', 'control']);
    expect(detail.binaryData).toEqual({ 'archive.bin': rawData['archive.bin'], control: rawData.control });
    expect(Buffer.from(detail.binaryData['archive.bin'], 'base64')).toEqual(binaryBytes);
    expect(Object.hasOwn(detail.data, 'archive.bin')).toBe(false);
    expect(encodeData(detail.data)).toEqual(
      Object.fromEntries(Object.keys(textData).map((key) => [key, rawData[key]])),
    );
  });

  it.each(['__proto__', 'constructor', 'toString'])(
    'preserves binary own key %s without an inherited fallback',
    (key) => {
      const raw = Object.fromEntries([[key, '/wAB']]);
      const dto = decodeData(nativeSecret({ data: raw }));
      expect(Object.keys(dto.data)).toEqual([]);
      expect(Object.entries(dto.binaryData)).toEqual([[key, '/wAB']]);
      expect(JSON.parse(JSON.stringify(dto)).binaryData[key]).toBe('/wAB');
    },
  );

  it.each(['wK8=', '7aCA', '8J+A', '/w==', 'gA=='])('never returns replacement text for invalid UTF-8 %s', (base64) => {
    expect(decodeData(nativeSecret({ data: { bad: base64 } }))).toEqual({ data: {}, binaryData: { bad: base64 } });
  });

  it('summaries expose binary names and immutable state, but no text or base64 values', () => {
    const summary = toSummary('unit-test', nativeSecret({ immutable: true }));
    expect(summary).toMatchObject({ immutable: true, binaryKeys: ['archive.bin', 'control'] });
    expect(summary).not.toHaveProperty('data');
    expect(summary).not.toHaveProperty('binaryData');
    const serialized = JSON.stringify(summary);
    for (const value of [...Object.values(textData), ...Object.values(rawData)].filter(Boolean)) {
      expect(serialized).not.toContain(value);
    }
  });

  it('restores raw bytes and preserves all live lifecycle metadata instead of snapshot metadata', () => {
    const live = nativeSecret({ data: { old: 'b2xk' } });
    const snapshot = nativeSecret({ metadata: { uid: 'historical-uid', finalizers: ['historical'] }, immutable: true });
    const restored = buildRawRestoreSecret({ ...args, live, snapshot });
    expect(restored.data).toEqual(rawData);
    expect(restored.immutable).toBe(false);
    expect(restored.metadata).toMatchObject({
      ...live.metadata,
      annotations: { ...live.metadata?.annotations, 'krypton.io/version': '3' },
    });
    expect(Object.hasOwn(restored.data!, '__proto__')).toBe(true);
    for (const key of Object.keys(rawData))
      expect(Buffer.from(restored.data![key], 'base64')).toEqual(Buffer.from(rawData[key], 'base64'));
    expect(snapshot.metadata?.uid).toBe('historical-uid');
    expect(live.metadata?.annotations?.['krypton.io/version']).toBe('2');
  });

  it('raw restore preserves base64 itself and permits a native-size binary snapshot', () => {
    const snapshot = nativeSecret({
      data: { binary: '/w==\n', large: Buffer.alloc(800_000, 0xff).toString('base64') },
    });
    expect(buildRawRestoreSecret({ ...args, live: nativeSecret(), snapshot }).data).toEqual(snapshot.data);
  });

  it('metadata-only binary and immutable updates retain raw bytes and absent data', () => {
    const live = nativeSecret({ immutable: true });
    const updated = buildLiveSecret({ ...args, live, description: 'new description' });
    expect(updated.data).toEqual(live.data);
    expect(updated.immutable).toBe(true);
    expect(updated.metadata?.ownerReferences).toEqual(live.metadata?.ownerReferences);
    expect(updated.metadata?.finalizers).toEqual(live.metadata?.finalizers);
    expect(updated.metadata?.uid).toBe(live.metadata?.uid);
    expect(buildLiveSecret({ ...args, live: nativeSecret({ immutable: true, data: undefined }) }).data).toBeUndefined();
  });

  it('accepts unchanged immutable text data by bytes and retains native representation', () => {
    const live = nativeSecret({ immutable: true, data: { key: 'dGV4dA==\n' } });
    expect(buildLiveSecret({ ...args, live, data: { key: 'text' } }).data).toEqual(live.data);
    expect(buildRawRestoreSecret({ ...args, live, snapshot: { data: { key: 'dGV4dA==' } } }).data).toEqual(live.data);
  });

  it('does not import a snapshot type or immutable state', () => {
    const live = nativeSecret({ type: 'example.test/custom', immutable: undefined });
    const restored = buildRawRestoreSecret({
      ...args,
      live,
      snapshot: { type: 'kubernetes.io/tls', immutable: true, data: { key: 'eA==' } },
    });
    expect(restored.type).toBe(live.type);
    expect(restored.immutable).toBeUndefined();
  });
});

describe('shared raw-map validation', () => {
  it('keeps every own key through create/stringData merge, update, encoding, and JSON', () => {
    const body = createSecretSchema.parse(
      JSON.parse(JSON.stringify({ name: 'credentials', data: textData, stringData: { ['__proto__']: 'overridden' } })),
    );
    const merged = { ...body.data, ...body.stringData };
    const update = updateSecretSchema.parse(JSON.parse(JSON.stringify({ data: merged, resourceVersion: '17' })));
    const encoded = buildLiveSecret({ ...args, data: update.data });
    expect(Object.keys(encoded.data!).sort()).toEqual(Object.keys(textData).sort());
    expect(decodeData(JSON.parse(JSON.stringify(encoded))).data).toEqual({ ...textData, ['__proto__']: 'overridden' });
    expect(Object.getPrototypeOf(body.data)).toBe(Object.prototype);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it.each(['__proto__', 'constructor', 'toString'])(
    'validates values under %s before a parser could strip them',
    (key) => {
      expect(secretDataSchema.safeParse(JSON.parse(JSON.stringify({ [key]: { polluted: true } }))).success).toBe(false);
    },
  );

  it.each(['', '.', '..', '..file', 'a/b', 'has space', 'newline\n', 'é', 'a'.repeat(254)])(
    'rejects invalid native key %j',
    (key) => {
      expect(secretKeyError(key)).not.toBeNull();
      expect(secretDataSchema.safeParse({ [key]: 'text' }).success).toBe(false);
    },
  );

  it.each(['__proto__', 'constructor', 'toString', '.dockerconfigjson', '-._A9', 'a'.repeat(253)])(
    'accepts native key %s',
    (key) => {
      expect(secretKeyError(key)).toBeNull();
      expect(Object.entries(secretDataSchema.parse({ [key]: 'text' }))).toEqual([[key, 'text']]);
    },
  );

  it.each(['\ud800', '\udfff', 'before\u0000after'])('rejects non-text input before UTF-8 encoding', (value) => {
    expect(() => encodeData({ value })).toThrow();
  });

  it('preserves custom types beyond the old UI limit and defaults empty types natively', () => {
    const custom = `example.test/${'long-custom-type'.repeat(8)}`;
    expect(createSecretSchema.parse({ name: 'credentials', type: custom }).type).toBe(custom);
    expect(buildLiveSecret({ ...args, type: custom, data: textData }).type).toBe(custom);
    expect(createSecretSchema.parse({ name: 'credentials', type: '' }).type).toBe('Opaque');
    expect(secretTypeDataError('bootstrap.kubernetes.io/token', {})).toBeNull();
  });
});

describe('native built-in type semantics shared by form and server', () => {
  it.each([
    ['kubernetes.io/basic-auth', { username: '' }],
    ['kubernetes.io/basic-auth', { password: '' }],
    ['kubernetes.io/ssh-auth', { 'ssh-privatekey': 'synthetic-key-content' }],
    ['kubernetes.io/tls', { 'tls.crt': '', 'tls.key': '' }],
    ['kubernetes.io/dockerconfigjson', { '.dockerconfigjson': '{}' }],
    ['kubernetes.io/dockerconfigjson', { '.dockerconfigjson': 'null' }],
    ['kubernetes.io/dockercfg', { '.dockercfg': '{"registry":{"auth":"synthetic"}}' }],
  ] satisfies Array<[string, Record<string, string>]>)('accepts native %s data %j', (type, data) => {
    expect(secretTypeDataError(type, data)).toBeNull();
    expect(() => buildLiveSecret({ ...args, type, data })).not.toThrow();
  });

  it.each([
    ['kubernetes.io/basic-auth', {}],
    ['kubernetes.io/ssh-auth', {}],
    ['kubernetes.io/ssh-auth', { 'ssh-privatekey': '' }],
    ['kubernetes.io/tls', { 'tls.crt': '' }],
    ['kubernetes.io/tls', { 'tls.key': '' }],
    ['kubernetes.io/dockerconfigjson', {}],
    ['kubernetes.io/dockerconfigjson', { '.dockerconfigjson': '[]' }],
    ['kubernetes.io/dockerconfigjson', { '.dockerconfigjson': '"synthetic-private-value"' }],
    ['kubernetes.io/dockercfg', { '.dockercfg': '{bad-json' }],
    ['kubernetes.io/dockercfg', { '.dockercfg': '{"number":1e400}' }],
    ['kubernetes.io/service-account-token', { token: 'synthetic-token' }],
  ] satisfies Array<[string, Record<string, string>]>)(
    'rejects unsupported %s data before building a mutation',
    (type, data) => {
      expect(secretTypeDataError(type, data)).not.toBeNull();
      expect(() => buildLiveSecret({ ...args, type, data })).toThrow();
    },
  );

  it('inherited required keys never satisfy native type checks', () => {
    expect(secretTypeDataError('kubernetes.io/basic-auth', Object.create({ username: '' }))).not.toBeNull();
    expect(secretTypeDataError('kubernetes.io/tls', Object.create({ 'tls.crt': '', 'tls.key': '' }))).not.toBeNull();
  });
});
