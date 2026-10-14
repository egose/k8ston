import type { V1Secret } from '@kubernetes/client-node';
import type { SessionUser } from '@/lib/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TEST_APP_URL } from './helpers/environment';
import { mockHistoryStore } from './helpers/history';
import { nativeSecret } from './helpers/secret-data';

const namespace = 'unit-test';
const name = 'credentials';
const url = `${TEST_APP_URL}/api/namespaces/${namespace}/secrets`;
const ctx = { params: Promise.resolve({ namespace, name }) };
const writer = { sub: 'writer', email: 'writer@example.test', name: 'Writer', groups: [] };
const outsider = { sub: 'reader', email: 'outsider@example.test', name: 'Reader', groups: [] };
const marker = 'synthetic-private-acl-input';
const annotations = { allowedGroups: 'k8ston.io/allowed-groups', allowedUsers: 'k8ston.io/allowed-users' };
const fields = ['allowedGroups', 'allowedUsers'] as const;
type Field = (typeof fields)[number];
type Action = 'create' | 'update';

function identity(field: Field, principal: string): SessionUser {
  return field === 'allowedGroups' ? { ...outsider, groups: [principal] } : { ...outsider, email: principal };
}

function liveWith(acl: Record<string, string> = { [annotations.allowedUsers]: writer.email }): V1Secret {
  const live = nativeSecret({ data: { key: Buffer.from('synthetic-original-value').toString('base64') } });
  return { ...live, metadata: { ...live.metadata, annotations: { ...live.metadata?.annotations, ...acl } } };
}

async function signIn(user: SessionUser = writer) {
  const auth = await import('@/lib/auth');
  await auth.setSessionCookie(await auth.createSessionToken(user));
}

async function setup(live?: V1Secret, policy: unknown = {}) {
  const store = await mockHistoryStore(live ? [live] : []);
  store.core.readNamespacedConfigMap.mockResolvedValue({ data: { 'access.json': JSON.stringify(policy) } });
  await signIn();
  return store;
}

async function write(action: Action, input: Record<string, unknown> = {}) {
  const data = { key: marker };
  if (action === 'create') {
    const { POST } = await import('@/app/api/namespaces/[namespace]/secrets/route');
    return POST(new Request(url, { method: 'POST', body: JSON.stringify({ name, data, ...input }) }), ctx);
  }
  const { PUT } = await import('@/app/api/namespaces/[namespace]/secrets/[name]/route');
  return PUT(
    new Request(`${url}/${name}`, { method: 'PUT', body: JSON.stringify({ resourceVersion: '17', data, ...input }) }),
    ctx,
  );
}

async function read() {
  const { GET } = await import('@/app/api/namespaces/[namespace]/secrets/[name]/route');
  return GET(new Request(`${url}/${name}`), ctx);
}

async function list() {
  const { GET } = await import('@/app/api/namespaces/[namespace]/secrets/route');
  return GET(new Request(url), ctx);
}

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe.each(['create', 'update'] as const)('%s annotation ACL route boundary', (action) => {
  const invalid = fields.flatMap((field) =>
    [
      { label: 'composite principal', entry: `${marker},another-principal` },
      { label: 'leading comma', entry: `,${marker}` },
      { label: 'trailing comma', entry: `${marker},` },
      { label: 'comma only', entry: ',' },
      { label: 'whitespace-only', entry: ' \t\r\n' },
      { label: 'Unicode whitespace-only', entry: '\u00a0\u2003\ufeff' },
      { label: 'empty entry', entry: '' },
    ].map((entry) => ({ field, ...entry })),
  );

  it.each(invalid)('rejects $label in $field with 400 and no live/history side effects', async ({ field, entry }) => {
    const store = await setup(action === 'update' ? liveWith() : undefined);
    const before = structuredClone(store.objects);
    const response = await write(action, { [field]: [entry], description: marker });
    expect(response.status).toBe(400);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    const body = await response.json();
    expect(body).toMatchObject({ error: 'Validation failed', issues: [{ path: [field] }] });
    expect(
      JSON.stringify([
        body,
        vi.mocked(console.log).mock.calls,
        vi.mocked(console.warn).mock.calls,
        vi.mocked(console.error).mock.calls,
      ]),
    ).not.toContain(marker);
    expect(store.core.createNamespacedSecret).not.toHaveBeenCalled();
    expect(store.core.replaceNamespacedSecret).not.toHaveBeenCalled();
    expect(store.core.deleteNamespacedSecret).not.toHaveBeenCalled();
    expect(store.core.listNamespacedSecret).not.toHaveBeenCalled();
    expect(store.core.readNamespacedSecret).not.toHaveBeenCalled();
    expect(store.objects).toEqual(before);
  });

  it('stores trimmed principals and authorizes readback only for the intended users/groups', async () => {
    const store = await setup(action === 'update' ? liveWith() : undefined);
    const response = await write(action, {
      allowedGroups: [' \tteam-a\u00a0', '\u2003Ops  équipe\n'],
      allowedUsers: [' ALICE@EXAMPLE.TEST ', '\treader@example.test\r\n'],
    });
    expect(response.status).toBe(action === 'create' ? 201 : 200);
    const expected = {
      allowedGroups: ['team-a', 'Ops  équipe'],
      allowedUsers: ['ALICE@EXAMPLE.TEST', 'reader@example.test'],
    };
    expect(await response.json()).toMatchObject({ secret: expected });
    const stored = store.get(namespace, name);
    expect(stored.metadata?.annotations).toMatchObject({
      [annotations.allowedGroups]: 'team-a, Ops  équipe',
      [annotations.allowedUsers]: 'ALICE@EXAMPLE.TEST, reader@example.test',
    });
    const candidates: Array<[SessionUser, boolean]> = [
      [identity('allowedGroups', 'team-a'), true],
      [identity('allowedGroups', 'Ops  équipe'), true],
      [identity('allowedUsers', 'alice@example.test'), true],
      [identity('allowedUsers', 'READER@EXAMPLE.TEST'), true],
      [identity('allowedGroups', 'team-a,Ops  équipe'), false],
      [identity('allowedGroups', 'Ops'), false],
      [identity('allowedGroups', 'ops  équipe'), false],
      [identity('allowedGroups', ' team-a '), false],
      [outsider, false],
    ];
    for (const [user, allowed] of candidates) {
      await signIn(user);
      const detail = await read();
      expect(detail.status).toBe(allowed ? 200 : 403);
      if (allowed) expect(await detail.json()).toMatchObject({ secret: expected });
    }
    expect(store.core.createNamespacedSecret).toHaveBeenCalledTimes(1);
    expect(store.core.replaceNamespacedSecret).toHaveBeenCalledTimes(action === 'update' ? 1 : 0);
    if (action === 'update') {
      expect(store.core.createNamespacedSecret.mock.calls[0][0].body.metadata).toMatchObject({
        labels: { 'k8ston.io/kind': 'history' },
        annotations: { [annotations.allowedUsers]: writer.email },
      });
      expect(store.core.createNamespacedSecret.mock.invocationCallOrder[0]).toBeLessThan(
        store.core.replaceNamespacedSecret.mock.invocationCallOrder[0],
      );
    }
  });
});

describe('explicit clears and omitted PUT fields', () => {
  it.each([
    { label: 'omitted ACLs', input: {}, groups: true, users: true, fallback: false },
    { label: 'clear groups only', input: { allowedGroups: [] }, groups: false, users: true, fallback: false },
    { label: 'clear users only', input: { allowedUsers: [] }, groups: true, users: false, fallback: false },
    {
      label: 'clear both',
      input: { allowedGroups: [], allowedUsers: [] },
      groups: false,
      users: false,
      fallback: true,
    },
  ])(
    '$label preserves the remaining native annotation and selects the right authorization rules',
    async ({ input, groups, users, fallback }) => {
      const original = {
        [annotations.allowedGroups]: ' \tLegacy-Team , Ops  team ',
        [annotations.allowedUsers]: '  WRITER@EXAMPLE.TEST, reader@example.test  ',
      };
      const store = await setup(liveWith(original), { [namespace]: { groups: ['namespace-team'] } });
      const response = await write('update', input);
      expect(response.status).toBe(200);
      expect(store.get(namespace, name).metadata?.annotations).toMatchObject({
        [annotations.allowedGroups]: groups ? original[annotations.allowedGroups] : '',
        [annotations.allowedUsers]: users ? original[annotations.allowedUsers] : '',
      });
      expect(await response.json()).toMatchObject({
        secret: {
          allowedGroups: groups ? ['Legacy-Team', 'Ops  team'] : [],
          allowedUsers: users ? ['WRITER@EXAMPLE.TEST', 'reader@example.test'] : [],
        },
      });
      const candidates: Array<[SessionUser, boolean]> = [
        [identity('allowedGroups', 'Legacy-Team'), groups],
        [identity('allowedUsers', 'reader@example.test'), users],
        [identity('allowedGroups', 'namespace-team'), fallback],
        [outsider, false],
      ];
      for (const [user, allowed] of candidates) {
        await signIn(user);
        expect((await read()).status).toBe(allowed ? 200 : 403);
      }
    },
  );

  it('clearing both ACLs deliberately opens access when namespace rules are absent', async () => {
    await setup(liveWith());
    expect((await write('update', { allowedGroups: [], allowedUsers: [] })).status).toBe(200);
    await signIn(outsider);
    expect((await read()).status).toBe(200);
  });

  it.each([{}, { allowedGroups: [], allowedUsers: [] }])(
    'creates intentionally empty ACLs with input %j',
    async (input) => {
      const store = await setup();
      expect((await write('create', input)).status).toBe(201);
      expect(store.get(namespace, name).metadata?.annotations).toMatchObject({
        [annotations.allowedGroups]: '',
        [annotations.allowedUsers]: '',
      });
      await signIn(outsider);
      expect((await read()).status).toBe(200);
    },
  );
});

describe.each(fields)('%s representation and upgrade semantics', (field) => {
  const components = field === 'allowedGroups' ? ['team-a', 'team-b'] : ['alice@example.test', 'bob@example.test'];
  const combined = components.join(',');

  it('demonstrates why an already-stored comma annotation grants component identities instead of the literal principal', async () => {
    // Native/legacy annotations retain their CSV meaning; validation prevents new
    // array writes from accidentally producing this ambiguous stored value.
    const store = await setup(liveWith({ [annotations[field]]: combined }));
    for (const principal of components) {
      await signIn(identity(field, principal));
      expect((await read()).status).toBe(200);
    }
    await signIn(identity(field, combined));
    expect((await read()).status).toBe(403);
    expect(store.core.readNamespacedConfigMap).not.toHaveBeenCalled();
  });

  it('demonstrates how an already-stored whitespace-only annotation disappears into open fallback', async () => {
    await setup(liveWith({ [annotations[field]]: ' \t\u00a0' }));
    await signIn(outsider);
    const response = await read();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ secret: { allowedGroups: [], allowedUsers: [] } });
  });

  it.each([false, true])(
    'keeps a namespace JSON comma principal exact (surrounding whitespace=%s) at read/list/create routes',
    async (padded) => {
      const principal = padded ? ` ${combined} ` : combined;
      const policyField = field === 'allowedGroups' ? 'groups' : 'users';
      const store = await setup(liveWith({}), { [namespace]: { [policyField]: [principal] } });
      const candidates: Array<[SessionUser, boolean]> = [
        [identity(field, field === 'allowedUsers' ? principal.toUpperCase() : principal), true],
        ...components.map((part): [SessionUser, boolean] => [identity(field, part), false]),
        [outsider, false],
      ];
      if (padded) candidates.push([identity(field, combined), false]);
      if (field === 'allowedGroups') candidates.push([{ ...outsider, groups: components }, false]);
      for (const [index, [user, allowed]] of candidates.entries()) {
        await signIn(user);
        expect((await read()).status).toBe(allowed ? 200 : 403);
        const response = await list();
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.canCreate).toBe(allowed);
        expect(body.secrets).toHaveLength(allowed ? 1 : 0);
        expect((await write('create', { name: `candidate-${index}` })).status).toBe(allowed ? 201 : 403);
      }
      expect(store.core.readNamespacedConfigMap).toHaveBeenCalledTimes(1);
      expect(store.core.createNamespacedSecret).toHaveBeenCalledTimes(1);
    },
  );
});
