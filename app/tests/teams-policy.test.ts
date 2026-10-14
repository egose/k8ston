import { ApiException, type V1ConfigMap, type V1Secret } from '@kubernetes/client-node';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TEST_APP_URL } from './helpers/environment';
import { persistedSnapshot } from './helpers/history';
import { mockKubernetes } from './helpers/kubernetes';

const namespace = 'unit-test';
const nsMember = { sub: 'ns-id', email: 'ns@example.test', name: 'NS', groups: ['platform-leads'] };
const team1Member = { sub: 't1-id', email: 't1@example.test', name: 'T1', groups: ['team1-dev'] };
const team2Member = { sub: 'bob-id', email: 'bob@example.test', name: 'Bob', groups: [] };
const outsider = { sub: 'out-id', email: 'out@example.test', name: 'Out', groups: ['other'] };

const policyValue = {
  [namespace]: {
    groups: ['platform-leads'],
    users: ['alice@example.test'],
    teams: [
      { name: 'team1', groups: ['team1-dev'], users: [] },
      { name: 'team2', groups: [], users: ['bob@example.test'] },
      { name: 'empty-team', groups: [], users: [] },
    ],
  },
};
const openTeamsValue = {
  [namespace]: {
    groups: [],
    users: [],
    teams: [{ name: 'team1', groups: ['team1-dev'], users: [] }],
  },
};
const policy = (value: unknown): V1ConfigMap => ({ data: { 'access.json': JSON.stringify(value) } });

function liveWith(name: string, annotations: Record<string, string> = {}): V1Secret {
  return {
    metadata: {
      namespace,
      name,
      uid: 'synthetic-live-uid',
      resourceVersion: '17',
      annotations: { 'k8ston.io/managed-by': 'k8ston', ...annotations },
    },
    data: { credential: Buffer.from('synthetic-live-value').toString('base64') },
  };
}
const teamAnn = (team: string) => ({ 'k8ston.io/team': team });

async function signIn(identity = nsMember) {
  const auth = await import('@/lib/auth');
  await auth.setSessionCookie(await auth.createSessionToken(identity));
}

async function setupPolicy(value: unknown = policyValue) {
  const mock = await mockKubernetes();
  mock.core.readNamespacedConfigMap.mockResolvedValue(policy(value));
  mock.core.listNamespacedSecret.mockResolvedValue({ items: [] });
  mock.core.createNamespacedSecret.mockImplementation(async ({ body }) => body);
  return mock;
}

async function readStatus(secret: V1Secret, identity = nsMember) {
  const mock = await mockKubernetes();
  mock.core.readNamespacedConfigMap.mockResolvedValue(policy(policyValue));
  mock.core.readNamespacedSecret.mockResolvedValue(secret);
  await signIn(identity);
  const named = await import('@/app/api/namespaces/[namespace]/secrets/[name]/route');
  const response = await named.GET(
    new Request(`${TEST_APP_URL}/api/namespaces/${namespace}/secrets/${secret.metadata!.name}`),
    { params: Promise.resolve({ namespace, name: secret.metadata!.name! }) },
  );
  return response.status;
}

async function createStatus(body: Record<string, unknown>, identity = nsMember, value: unknown = policyValue) {
  const mock = await mockKubernetes();
  mock.core.readNamespacedConfigMap.mockResolvedValue(policy(value));
  mock.core.createNamespacedSecret.mockImplementation(async ({ body }) => body);
  await signIn(identity);
  const collection = await import('@/app/api/namespaces/[namespace]/secrets/route');
  const response = await collection.POST(
    new Request(`${TEST_APP_URL}/api/namespaces/${namespace}/secrets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'new-secret', data: { key: 'synthetic-new-value' }, ...body }),
    }),
    { params: Promise.resolve({ namespace }) },
  );
  return { status: response.status, body: await response.json() };
}

async function updateTeam(live: V1Secret, team: string | undefined, identity = nsMember) {
  const mock = await mockKubernetes();
  mock.core.readNamespacedConfigMap.mockResolvedValue(policy(policyValue));
  mock.core.readNamespacedSecret.mockResolvedValue(live);
  mock.core.replaceNamespacedSecret.mockImplementation(async ({ body }) => body);
  // Snapshot save + prune verification needs created snapshots visible on re-list.
  const snapshots: V1Secret[] = [];
  mock.core.listNamespacedSecret.mockImplementation(async () => ({ items: snapshots }));
  mock.core.createNamespacedSecret.mockImplementation(async ({ body }) => {
    const saved = persistedSnapshot(body);
    snapshots.push(saved);
    return saved;
  });
  await signIn(identity);
  const named = await import('@/app/api/namespaces/[namespace]/secrets/[name]/route');
  const input: Record<string, unknown> = { resourceVersion: '17', description: 'team move' };
  if (team !== undefined) input.team = team;
  const response = await named.PUT(
    new Request(`${TEST_APP_URL}/api/namespaces/${namespace}/secrets/${live.metadata!.name}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
    { params: Promise.resolve({ namespace, name: live.metadata!.name! }) },
  );
  return response.status;
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('teams policy schema', () => {
  it('parses valid teams and defaults missing teams and nested lists', async () => {
    const { namespaceAccessSchema } = await import('@/lib/validation');
    expect(namespaceAccessSchema.parse(policyValue)).toEqual(policyValue);
    expect(namespaceAccessSchema.parse({ [namespace]: {} })).toEqual({
      [namespace]: { groups: [], users: [], teams: [] },
    });
    expect(namespaceAccessSchema.parse({ [namespace]: { teams: [{ name: 'team1' }] } })).toEqual({
      [namespace]: { groups: [], users: [], teams: [{ name: 'team1', groups: [], users: [] }] },
    });
  });

  it.each([
    { label: 'duplicate names', teams: [{ name: 'team1' }, { name: 'team1' }] },
    { label: 'uppercase name', teams: [{ name: 'Team1' }] },
    { label: 'name with spaces', teams: [{ name: 'team 1' }] },
    { label: 'empty name', teams: [{ name: '' }] },
    { label: 'name over 63 bytes', teams: [{ name: 't'.repeat(64) }] },
    { label: 'leading dash', teams: [{ name: '-team' }] },
    { label: 'non-array teams', teams: 'team1' },
    { label: 'non-object team', teams: ['team1'] },
    { label: 'unknown team field', teams: [{ name: 'team1', owners: [] }] },
    { label: 'unknown namespace field', extra: { owners: [] } },
    { label: 'non-array team groups', teams: [{ name: 'team1', groups: 'team1-dev' }] },
    { label: 'non-string team member', teams: [{ name: 'team1', groups: [42] }] },
  ])('rejects $label as invalid_schema', async ({ teams, extra }) => {
    const { namespaceAccessSchema } = await import('@/lib/validation');
    const entry = { ...(extra ?? {}), ...(teams === undefined ? {} : { teams }) };
    expect(namespaceAccessSchema.safeParse({ [namespace]: entry }).success).toBe(false);
  });

  it('enforces the team count and nested entry bounds', async () => {
    const { ACL_ENTRY_LIMIT, ACL_ENTRY_BYTE_LIMIT, TEAM_LIMIT, namespaceAccessSchema } =
      await import('@/lib/validation');
    const maxTeams = Array.from({ length: TEAM_LIMIT }, (_, i) => ({ name: `team${i}` }));
    expect(namespaceAccessSchema.safeParse({ [namespace]: { teams: maxTeams } }).success).toBe(true);
    expect(namespaceAccessSchema.safeParse({ [namespace]: { teams: [...maxTeams, { name: 'extra' }] } }).success).toBe(
      false,
    );
    for (const field of ['groups', 'users'] as const) {
      const tooMany = { [namespace]: { teams: [{ name: 'team1', [field]: Array(ACL_ENTRY_LIMIT + 1).fill('m') }] } };
      expect(namespaceAccessSchema.safeParse(tooMany).success).toBe(false);
      const tooLong = {
        [namespace]: { teams: [{ name: 'team1', [field]: ['é'.repeat(ACL_ENTRY_BYTE_LIMIT / 2 + 1)] }] },
      };
      expect(namespaceAccessSchema.safeParse(tooLong).success).toBe(false);
    }
  });

  it('validates the secret team field on create, update, and direct builds', async () => {
    const { createSecretSchema, updateSecretSchema } = await import('@/lib/validation');
    expect(createSecretSchema.parse({ name: 'credentials' })).not.toHaveProperty('team');
    expect(createSecretSchema.parse({ name: 'credentials', team: 'team1' }).team).toBe('team1');
    expect(createSecretSchema.safeParse({ name: 'credentials', team: '' }).success).toBe(false);
    expect(createSecretSchema.safeParse({ name: 'credentials', team: 'Team1' }).success).toBe(false);
    expect(updateSecretSchema.parse({ resourceVersion: '17' })).toEqual({ resourceVersion: '17' });
    expect(updateSecretSchema.parse({ resourceVersion: '17', team: '' }).team).toBe('');
    expect(updateSecretSchema.parse({ resourceVersion: '17', team: 'team1' }).team).toBe('team1');
    expect(updateSecretSchema.safeParse({ resourceVersion: '17', team: 'Team1' }).success).toBe(false);

    const { buildLiveSecret, toSummary } = await import('@/lib/secrets');
    const args = { name: 'credentials', namespace, user: nsMember };
    expect(toSummary(namespace, buildLiveSecret({ ...args, data: {} })).team).toBe('');
    const assigned = buildLiveSecret({ ...args, team: 'team1', data: {} });
    expect(assigned.metadata?.annotations?.['k8ston.io/team']).toBe('team1');
    expect(toSummary(namespace, assigned).team).toBe('team1');
    // Undefined preserves, "" clears, invalid rejects without mutating.
    const preserved = buildLiveSecret({ ...args, live: assigned, description: 'kept' });
    expect(preserved.metadata?.annotations?.['k8ston.io/team']).toBe('team1');
    const cleared = buildLiveSecret({ ...args, live: assigned, team: '' });
    expect(cleared.metadata?.annotations?.['k8ston.io/team']).toBe('');
    expect(() => buildLiveSecret({ ...args, team: 'Team1', data: {} })).toThrow();
    expect(assigned.metadata?.annotations?.['k8ston.io/team']).toBe('team1');
  });
});

describe('teams read authorization', () => {
  it.each([
    { label: 'namespace member reads unassigned', secret: 'unassigned', identity: nsMember, status: 200 },
    { label: 'namespace member reads team1', secret: 'team1', identity: nsMember, status: 200 },
    { label: 'namespace member reads team2', secret: 'team2', identity: nsMember, status: 200 },
    { label: 'namespace member reads unknown team', secret: 'ghost', identity: nsMember, status: 200 },
    { label: 'team1 member reads own team', secret: 'team1', identity: team1Member, status: 200 },
    { label: 'team1 member denied other team', secret: 'team2', identity: team1Member, status: 403 },
    { label: 'team1 member denied unassigned', secret: 'unassigned', identity: team1Member, status: 403 },
    { label: 'team2 user reads own team', secret: 'team2', identity: team2Member, status: 200 },
    { label: 'team2 user denied team1', secret: 'team1', identity: team2Member, status: 403 },
    { label: 'outsider denied team secret', secret: 'team1', identity: outsider, status: 403 },
    { label: 'outsider denied unassigned', secret: 'unassigned', identity: outsider, status: 403 },
    { label: 'unknown team fails closed', secret: 'ghost', identity: team1Member, status: 403 },
    { label: 'empty team grants nothing', secret: 'empty-team', identity: team1Member, status: 403 },
    { label: 'namespace member reads empty team', secret: 'empty-team', identity: nsMember, status: 200 },
  ])('$label', async ({ secret, identity, status }) => {
    const annotations = secret === 'unassigned' ? {} : teamAnn(secret);
    expect(await readStatus(liveWith('credentials', annotations), identity)).toBe(status);
  });

  it('treats blank team annotations as unassigned', async () => {
    expect(await readStatus(liveWith('credentials', teamAnn('  ')), nsMember)).toBe(200);
    expect(await readStatus(liveWith('credentials', teamAnn('  ')), team1Member)).toBe(403);
  });

  it('matches team names exactly and users case-insensitively', async () => {
    const { canAccessSecret } = await import('@/lib/authz');
    await setupPolicy();
    // Case differs from the defined "team1" → unknown team → denied.
    expect(await canAccessSecret(team1Member, namespace, liveWith('s', teamAnn('Team1')))).toBe(false);
    // Team user match is case-insensitive on email.
    expect(
      await canAccessSecret({ ...team2Member, email: 'BOB@EXAMPLE.TEST' }, namespace, liveWith('s', teamAnn('team2'))),
    ).toBe(true);
  });

  it('keeps per-secret ACLs above team rules in both directions', async () => {
    // Team member locked out by an explicit non-matching ACL.
    expect(
      await readStatus(
        liveWith('credentials', { ...teamAnn('team1'), 'k8ston.io/allowed-users': 'alice@example.test' }),
        team1Member,
      ),
    ).toBe(403);
    // Outsider admitted by an explicit matching ACL on a team secret.
    expect(
      await readStatus(
        liveWith('credentials', { ...teamAnn('team1'), 'k8ston.io/allowed-users': outsider.email }),
        outsider,
      ),
    ).toBe(200);
  });

  it('opens unassigned secrets when the namespace has no rules, while teams stay restricted', async () => {
    const { canAccessSecret } = await import('@/lib/authz');
    await setupPolicy(openTeamsValue);
    expect(await canAccessSecret(outsider, namespace, liveWith('s'))).toBe(true);
    expect(await canAccessSecret(team1Member, namespace, liveWith('s', teamAnn('team1')))).toBe(true);
    expect(await canAccessSecret(outsider, namespace, liveWith('s', teamAnn('team1')))).toBe(false);
    // Unknown team with teams defined still fails closed for non-members.
    expect(await canAccessSecret(outsider, namespace, liveWith('s', teamAnn('ghost')))).toBe(false);
  });

  it('opens unknown and empty teams only when the namespace is completely unrestricted', async () => {
    const { canAccessSecret } = await import('@/lib/authz');
    await setupPolicy({ [namespace]: { groups: [], users: [], teams: [] } });
    expect(await canAccessSecret(outsider, namespace, liveWith('s', teamAnn('ghost')))).toBe(true);
    await setupPolicy({ [namespace]: { groups: [], users: [], teams: [{ name: 'team1', groups: [], users: [] }] } });
    expect(await canAccessSecret(outsider, namespace, liveWith('s', teamAnn('team1')))).toBe(true);
  });
});

describe('teams list and creation', () => {
  async function listBody(identity = nsMember, value: unknown = policyValue) {
    const mock = await setupPolicy(value);
    mock.core.listNamespacedSecret.mockResolvedValue({
      items: [liveWith('unassigned'), liveWith('t1', teamAnn('team1')), liveWith('t2', teamAnn('team2'))],
    });
    await signIn(identity);
    const collection = await import('@/app/api/namespaces/[namespace]/secrets/route');
    const response = await collection.GET(new Request(`${TEST_APP_URL}/api/namespaces/${namespace}/secrets`), {
      params: Promise.resolve({ namespace }),
    });
    return response.json() as Promise<{
      secrets: Array<{ name: string; team: string }>;
      canCreate: boolean;
      teams: string[];
      creatableTeams: string[];
    }>;
  }

  it('lists per-team visibility plus teams and creatableTeams hints', async () => {
    const nsView = await listBody(nsMember);
    expect(nsView.secrets.map((s) => s.name)).toEqual(['unassigned', 't1', 't2']);
    expect(nsView.secrets.find((s) => s.name === 't1')?.team).toBe('team1');
    expect(nsView.canCreate).toBe(true);
    expect(nsView.teams).toEqual(['team1', 'team2', 'empty-team']);
    expect(nsView.creatableTeams).toEqual(['team1', 'team2', 'empty-team']);

    const t1View = await listBody(team1Member);
    expect(t1View.secrets.map((s) => s.name)).toEqual(['t1']);
    expect(t1View.canCreate).toBe(false);
    expect(t1View.teams).toEqual(['team1', 'team2', 'empty-team']);
    expect(t1View.creatableTeams).toEqual(['team1']);

    const outView = await listBody(outsider);
    expect(outView.secrets).toEqual([]);
    expect(outView.canCreate).toBe(false);
    expect(outView.creatableTeams).toEqual([]);
  });

  it('omits empty teams from creatableTeams when the namespace is restricted', async () => {
    const { listCreatableTeams } = await import('@/lib/authz');
    await setupPolicy();
    expect(await listCreatableTeams(outsider, namespace)).toEqual([]);
  });

  it('lists empty teams as creatable when the namespace is open', async () => {
    const { listCreatableTeams, canCreateInNamespace } = await import('@/lib/authz');
    await setupPolicy({
      [namespace]: {
        groups: [],
        users: [],
        teams: [
          { name: 'team1', groups: ['team1-dev'], users: [] },
          { name: 'empty-team', groups: [], users: [] },
        ],
      },
    });
    expect(await listCreatableTeams(outsider, namespace)).toEqual(['empty-team']);
    expect(await canCreateInNamespace(outsider, namespace, 'empty-team')).toBe(true);
    expect(await canCreateInNamespace(outsider, namespace, 'team1')).toBe(false);
  });

  it.each([
    { label: 'ns member creates unassigned', team: undefined, identity: nsMember, status: 201 },
    { label: 'ns member creates in team1', team: 'team1', identity: nsMember, status: 201 },
    { label: 'team1 member creates in own team', team: 'team1', identity: team1Member, status: 201 },
    { label: 'team1 member denied other team', team: 'team2', identity: team1Member, status: 403 },
    { label: 'team1 member denied unassigned', team: undefined, identity: team1Member, status: 403 },
    { label: 'outsider denied team creation', team: 'team1', identity: outsider, status: 403 },
  ])('$label', async ({ team, identity, status }) => {
    const { status: actual } = await createStatus(team === undefined ? {} : { team }, identity);
    expect(actual).toBe(status);
  });

  it('rejects unknown teams as bad requests, not forbidden', async () => {
    const { status, body } = await createStatus({ team: 'ghost' }, nsMember);
    expect(status).toBe(400);
    expect(body).toEqual({ error: `Unknown team "ghost" in "${namespace}"` });
  });

  it('rejects malformed teams before any Kubernetes write', async () => {
    const mock = await mockKubernetes();
    await signIn(nsMember);
    const collection = await import('@/app/api/namespaces/[namespace]/secrets/route');
    const response = await collection.POST(
      new Request(`${TEST_APP_URL}/api/namespaces/${namespace}/secrets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'new-secret', data: { key: 'synthetic-new-value' }, team: 'Team1' }),
      }),
      { params: Promise.resolve({ namespace }) },
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: 'Validation failed' });
    expect(mock.core.createNamespacedSecret).not.toHaveBeenCalled();
    expect(mock.core.readNamespacedConfigMap).not.toHaveBeenCalled();
  });
});

describe('teams secret moves', () => {
  it.each([
    { label: 'ns member moves team1 to team2', from: 'team1', to: 'team2', identity: nsMember, status: 200 },
    { label: 'ns member moves team1 to unassigned', from: 'team1', to: '', identity: nsMember, status: 200 },
    { label: 'ns member moves unassigned to team1', from: '', to: 'team1', identity: nsMember, status: 200 },
    { label: 'team1 member keeps own team', from: 'team1', to: 'team1', identity: team1Member, status: 200 },
    { label: 'team1 member denied move to team2', from: 'team1', to: 'team2', identity: team1Member, status: 403 },
    { label: 'team1 member denied move to unassigned', from: 'team1', to: '', identity: team1Member, status: 403 },
  ])('$label', async ({ from, to, identity, status }) => {
    const live = liveWith('credentials', from === '' ? {} : teamAnn(from));
    expect(await updateTeam(live, to, identity)).toBe(status);
  });

  it('rejects moves to unknown teams as bad requests', async () => {
    expect(await updateTeam(liveWith('credentials', teamAnn('team1')), 'ghost', nsMember)).toBe(400);
  });

  it('omitted team preserves the assignment', async () => {
    const mock = await mockKubernetes();
    mock.core.readNamespacedConfigMap.mockResolvedValue(policy(policyValue));
    mock.core.readNamespacedSecret.mockResolvedValue(liveWith('credentials', teamAnn('team1')));
    mock.core.replaceNamespacedSecret.mockImplementation(async ({ body }) => body);
    const snapshots: V1Secret[] = [];
    mock.core.listNamespacedSecret.mockImplementation(async () => ({ items: snapshots }));
    mock.core.createNamespacedSecret.mockImplementation(async ({ body }) => {
      const saved = persistedSnapshot(body);
      snapshots.push(saved);
      return saved;
    });
    await signIn(nsMember);
    const named = await import('@/app/api/namespaces/[namespace]/secrets/[name]/route');
    const response = await named.PUT(
      new Request(`${TEST_APP_URL}/api/namespaces/${namespace}/secrets/credentials`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceVersion: '17', description: 'metadata only' }),
      }),
      { params: Promise.resolve({ namespace, name: 'credentials' }) },
    );
    expect(response.status).toBe(200);
    expect((await response.json()).secret.team).toBe('team1');
  });
});

describe('teams policy failures', () => {
  it('fails closed on invalid team policy without logging contents', async () => {
    const mock = await mockKubernetes();
    const marker = 'synthetic-team-content-must-not-be-logged';
    // Duplicated names are invalid_schema (each name alone would be valid).
    mock.core.readNamespacedConfigMap.mockResolvedValue(
      policy({ [namespace]: { teams: [{ name: marker }, { name: marker }] } }),
    );
    mock.core.readNamespacedSecret.mockResolvedValue(liveWith('credentials', teamAnn('team1')));
    await signIn(team1Member);
    const named = await import('@/app/api/namespaces/[namespace]/secrets/[name]/route');
    const response = await named.GET(new Request(`${TEST_APP_URL}/api/namespaces/${namespace}/secrets/credentials`), {
      params: Promise.resolve({ namespace, name: 'credentials' }),
    });
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'Namespace access policy is unavailable' });
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain(marker);
  });

  it('returns duplicate team names as invalid policy, never open', async () => {
    const { canAccessSecret } = await import('@/lib/authz');
    const mock = await setupPolicy({ [namespace]: { teams: [{ name: 'team1' }, { name: 'team1' }] } });
    await expect(canAccessSecret(nsMember, namespace, liveWith('s'))).rejects.toMatchObject({ status: 503 });
    expect(mock.core.readNamespacedConfigMap).toHaveBeenCalledTimes(1);
  });

  it('treats a missing policy ConfigMap as open for team reads', async () => {
    const { canAccessSecret } = await import('@/lib/authz');
    const { core } = await mockKubernetes();
    core.readNamespacedConfigMap.mockRejectedValue(new ApiException(404, 'not found', '', {}));
    expect(await canAccessSecret(outsider, namespace, liveWith('s', teamAnn('ghost')))).toBe(true);
  });

  it('fails team reads when the policy read is denied', async () => {
    const { canAccessSecret } = await import('@/lib/authz');
    const { core } = await mockKubernetes();
    core.readNamespacedConfigMap.mockRejectedValue(new ApiException(403, 'denied', '', {}));
    await expect(canAccessSecret(outsider, namespace, liveWith('s', teamAnn('team1')))).rejects.toMatchObject({
      status: 503,
    });
  });
});
