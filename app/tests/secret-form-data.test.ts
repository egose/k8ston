import { describe, expect, it } from 'vitest';
import { parseBulkEntries, secretEntriesToData } from '@/lib/secret-form-data';

describe('explicit bulk import', () => {
  it('preserves equals, value whitespace, empty values, CRLF, Unicode, and own special keys', () => {
    const existing = Object.freeze([Object.freeze({ key: 'EXISTING', value: 'kept' })]);
    const result = parseBulkEntries(
      '\r\n  __proto__ = café 🔐=one==  \r\nconstructor=\r\ntoString=value\r\n\t\r\n',
      existing,
    );
    expect(result).toEqual({
      ok: true,
      value: [
        { key: '__proto__', value: ' café 🔐=one==  ' },
        { key: 'constructor', value: '' },
        { key: 'toString', value: 'value' },
      ],
    });
    if (!result.ok) throw new Error('Expected a valid import');
    const data = secretEntriesToData([...existing, ...result.value]);
    expect(data.ok).toBe(true);
    if (!data.ok) throw new Error('Expected valid data');
    expect(Object.keys(data.value)).toEqual(['EXISTING', '__proto__', 'constructor', 'toString']);
    expect(Object.hasOwn(data.value, '__proto__')).toBe(true);
    expect(data.value['__proto__']).toBe(' café 🔐=one==  ');
    expect(existing).toEqual([{ key: 'EXISTING', value: 'kept' }]);
  });

  it.each([
    ['VALID=one\nunfinished', 'Line 2 must use KEY=value.'],
    ['VALID=one\n=value-only', 'Line 2 needs a key before "=".'],
    ['VALID=one\n  =value-only', 'Line 2 needs a key before "=".'],
    ['VALID=one\nBAD KEY=two', 'Line 2: Keys must be 1–253 characters'],
    ['VALID=one\n.=two', 'Line 2: Keys must not be "." or start with ".."'],
    ['VALID=one\n..hidden=two', 'Line 2: Keys must not be "." or start with ".."'],
    [`VALID=one\n${'K'.repeat(254)}=two`, 'Line 2: Keys must be 1–253 characters'],
    ['VALID=one\nUNICODE🔐=two', 'Line 2: Keys must be 1–253 characters'],
    ['VALID=one\nVALID=two', 'Line 2: duplicate key "VALID"'],
    ['VALID=one\nEXISTING=two', 'Line 2: duplicate key "EXISTING"'],
    ['VALID=one\n__proto__=two', 'Line 2: duplicate key "__proto__"'],
    ['VALID=one\nconstructor=first\nconstructor=second', 'Line 3: duplicate key "constructor"'],
    ['VALID=one\n\ntoString=first\r\ntoString=second', 'Line 4: duplicate key "toString"'],
    ['', 'Enter at least one KEY=value line.'],
    [' \r\n\t\n', 'Enter at least one KEY=value line.'],
  ])('rejects an entire invalid import without modifying existing entries: %s', (source, error) => {
    const existing = Object.freeze([
      Object.freeze({ key: 'EXISTING', value: 'original' }),
      Object.freeze({ key: '__proto__', value: 'original special' }),
      Object.freeze({ key: '', value: '' }),
    ]);
    const result = parseBulkEntries(source, existing);
    expect(result).toEqual({ ok: false, error: expect.stringContaining(error) });
    expect(existing).toEqual([
      { key: 'EXISTING', value: 'original' },
      { key: '__proto__', value: 'original special' },
      { key: '', value: '' },
    ]);
  });

  it('accepts the key length boundary and treats key case as significant', () => {
    expect(parseBulkEntries(`${'K'.repeat(253)}=\nkey=lower`, [{ key: 'KEY', value: 'upper' }])).toEqual({
      ok: true,
      value: [
        { key: 'K'.repeat(253), value: '' },
        { key: 'key', value: 'lower' },
      ],
    });
  });

  it.each([
    [{ key: '', value: 'synthetic-value-only' }],
    [{ key: '   ', value: 'synthetic-value-only' }],
    [{ key: 'BAD KEY', value: 'synthetic-value-only' }],
    [
      { key: 'DUP', value: 'one' },
      { key: 'DUP', value: 'two' },
    ],
    [
      { key: '__proto__', value: 'one' },
      { key: '__proto__', value: 'two' },
    ],
  ])('rejects imports into invalid existing rows without dropping or replacing them: %j', (...entries) => {
    const before = structuredClone(entries);
    expect(parseBulkEntries('VALID=new', entries)).toEqual({
      ok: false,
      error: expect.stringContaining('Existing entries:'),
    });
    expect(entries).toEqual(before);
  });

  it('checks the combined payload budget before importing, not each part separately', () => {
    const existing = [{ key: 'OLD', value: 'a'.repeat(400_000) }];
    const source = `NEW=${'b'.repeat(400_000)}`;
    expect(secretEntriesToData(existing).ok).toBe(true);
    expect(parseBulkEntries(source, []).ok).toBe(true);
    expect(parseBulkEntries(source, existing)).toEqual({ ok: false, error: 'Secret is too large (maximum 1 MB)' });
  });

  it.each(['synthetic-private-marker\0', 'synthetic-private-marker\ud800'])(
    'rejects unsupported text without echoing its value',
    (value) => {
      const result = parseBulkEntries(`VALID=one\nINVALID=${value}`, []);
      expect(result.ok).toBe(false);
      expect(JSON.stringify(result)).not.toContain('synthetic-private-marker');
    },
  );
});

describe('form row submission', () => {
  it('omits only empty placeholders and preserves intentionally empty values and own keys', () => {
    expect(
      secretEntriesToData([
        { key: '', value: '' },
        { key: '__proto__', value: '' },
        { key: 'constructor', value: 'x' },
        { key: 'toString', value: 'y' },
      ]),
    ).toEqual({ ok: true, value: { ['__proto__']: '', constructor: 'x', toString: 'y' } });
  });

  it.each(['', ' ', '\t'])('rejects a nonempty value with a blank key (%j) instead of dropping it', (key) => {
    expect(
      secretEntriesToData([
        { key: 'VALID', value: 'kept' },
        { key, value: 'orphan value' },
      ]),
    ).toEqual({
      ok: false,
      error: 'Entry 2 has a value but no key. Add a key or remove the entry.',
    });
  });

  it('rejects whitespace-only keys even when their value is empty', () => {
    expect(secretEntriesToData([{ key: ' ', value: '' }])).toEqual({
      ok: false,
      error: expect.stringContaining('Keys must be 1–253 characters'),
    });
  });
});
