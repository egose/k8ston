import { describe, expect, it } from 'vitest';
import { buildLiveSecret, buildRawRestoreSecret, toSummary } from '@/lib/secrets';
import {
  ACL_ENTRY_BYTE_LIMIT,
  ACL_ENTRY_LIMIT,
  createSecretSchema,
  namespaceAccessSchema,
  updateSecretSchema,
  type UpdateSecretInput,
} from '@/lib/validation';
import { dataUser, nativeSecret } from './helpers/secret-data';

const fields = ['allowedGroups', 'allowedUsers'] as const;
const args = { name: 'credentials', namespace: 'unit-test', user: dataUser };
const invalidEntries = [
  'team-a,team-b',
  ',team-a',
  'team-a,',
  ',',
  '"team-a,team-b"',
  'team-a\\,team-b',
  '',
  ' \t\r\n',
  '\u00a0\u2003\ufeff',
];
const entries = [
  ' \tTeam A\u00a0',
  '\u2003équipe 🔐\n',
  'ALICE@EXAMPLE.TEST ',
  'semi;colon',
  'quote"and\\slash',
  'Team A',
];
const normalized = ['Team A', 'équipe 🔐', 'ALICE@EXAMPLE.TEST', 'semi;colon', 'quote"and\\slash', 'Team A'];
type Acl = Pick<UpdateSecretInput, 'allowedGroups' | 'allowedUsers'>;
type BuildAction = 'create' | 'update' | 'restore';

function build(action: BuildAction, acl: Acl, live = nativeSecret()) {
  if (action === 'create') return buildLiveSecret({ ...args, ...acl, data: { key: 'synthetic-value' } });
  if (action === 'update') return buildLiveSecret({ ...args, ...acl, live });
  return buildRawRestoreSecret({ ...args, ...acl, live, snapshot: { data: live.data } });
}

describe.each(fields)('%s annotation input', (field) => {
  it('rejects every entry that CSV would split or discard', () => {
    for (const schema of [createSecretSchema, updateSecretSchema]) {
      for (const entry of invalidEntries) {
        expect(schema.safeParse({ name: args.name, resourceVersion: '17', [field]: ['valid', entry] }).success).toBe(
          false,
        );
      }
    }
  });

  it('trims only surrounding whitespace, preserving order, duplicates, case, and internal characters', () => {
    const input = { name: args.name, resourceVersion: '17', [field]: [...entries] };
    for (const schema of [createSecretSchema, updateSecretSchema]) {
      expect(schema.parse(input)[field]).toEqual(normalized);
      expect(input[field]).toEqual(entries);
    }
  });

  it('keeps count and raw UTF-8 byte bounds before normalization', () => {
    const maximum = Array.from({ length: ACL_ENTRY_LIMIT }, (_, index) => `${index}`.padEnd(ACL_ENTRY_BYTE_LIMIT, 'x'));
    const tooMany = [...maximum, 'extra'];
    const tooLong = ['é'.repeat(ACL_ENTRY_BYTE_LIMIT / 2 + 1)];
    const paddedTooLong = [` ${'é'.repeat(ACL_ENTRY_BYTE_LIMIT / 2)}`];
    for (const schema of [createSecretSchema, updateSecretSchema]) {
      expect(schema.parse({ name: args.name, resourceVersion: '17', [field]: maximum })[field]).toEqual(maximum);
      for (const acl of [tooMany, tooLong, paddedTooLong]) {
        expect(schema.safeParse({ name: args.name, resourceVersion: '17', [field]: acl }).success).toBe(false);
      }
    }
  });
});

it('distinguishes create defaults, explicit clears, and omitted update fields', () => {
  expect(createSecretSchema.parse({ name: args.name })).toMatchObject({ allowedGroups: [], allowedUsers: [] });
  expect(updateSecretSchema.parse({ resourceVersion: '17' })).toEqual({ resourceVersion: '17' });
  expect(updateSecretSchema.parse({ resourceVersion: '17', allowedGroups: [], allowedUsers: [] })).toEqual({
    resourceVersion: '17',
    allowedGroups: [],
    allowedUsers: [],
  });
});

it('keeps namespace JSON principals exact, including commas and whitespace, with the existing bounds', () => {
  const policy = {
    'unit-test': { groups: ['team-a,team-b', ' padded ', '\t'], users: ['alice@example.test,bob@example.test'] },
  };
  // teams defaults to [] (open, no team restrictions).
  expect(namespaceAccessSchema.parse(policy)).toEqual({
    'unit-test': { ...policy['unit-test'], teams: [] },
  });
  for (const field of ['groups', 'users']) {
    expect(
      namespaceAccessSchema.safeParse({ 'unit-test': { [field]: Array(ACL_ENTRY_LIMIT + 1).fill('member') } }).success,
    ).toBe(false);
    expect(
      namespaceAccessSchema.safeParse({ 'unit-test': { [field]: ['é'.repeat(ACL_ENTRY_BYTE_LIMIT / 2 + 1)] } }).success,
    ).toBe(false);
  }
});

describe.each(['create', 'update', 'restore'] as const)('direct %s builder boundary', (action) => {
  it.each(fields)('rejects unrepresentable or over-budget %s even without a route parser', (field) => {
    const live = nativeSecret();
    const before = structuredClone(live);
    const invalid = [
      ...invalidEntries.map((entry) => [entry]),
      Array(ACL_ENTRY_LIMIT + 1).fill('member'),
      ['é'.repeat(ACL_ENTRY_BYTE_LIMIT / 2 + 1)],
      [` ${'é'.repeat(ACL_ENTRY_BYTE_LIMIT / 2)}`],
    ];
    for (const acl of invalid) expect(() => build(action, { [field]: acl }, live)).toThrow();
    expect(live).toEqual(before);
  });

  it.each(fields)('normalizes %s without changing the input and round-trips every member', (field) => {
    const input = { [field]: [...entries] };
    const result = build(action, input);
    const annotation = field === 'allowedGroups' ? 'krypton.io/allowed-groups' : 'krypton.io/allowed-users';
    expect(result.metadata?.annotations?.[annotation]).toBe(normalized.join(', '));
    expect(toSummary(args.namespace, result)[field]).toEqual(normalized);
    expect(input[field]).toEqual(entries);
  });
});
