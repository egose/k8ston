import { cookies } from 'next/headers';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TEST_APP_URL, TEST_ISSUER } from './helpers/environment';
import { createOidcProvider, IDENTITY } from './helpers/oidc';

const transactionCookies = ['krypton_state', 'krypton_nonce', 'krypton_pkce'];
let provider: ReturnType<typeof createOidcProvider>;

beforeEach(() => {
  provider = createOidcProvider();
  vi.stubGlobal('fetch', provider.fetch);
});

async function startLogin() {
  const auth = await import('@/lib/auth');
  const authorization = await auth.getAuthorizationUrl();
  return { auth, authorization, callback: provider.authorize(authorization) };
}

async function expectConsumed() {
  const store = await cookies();
  for (const name of transactionCookies) expect(store.get(name)).toBeUndefined();
}

describe('OIDC transactions', () => {
  it('uses S256, expiring HttpOnly cookies, and the public redirect behind a proxy', async () => {
    Object.assign(process.env, { NODE_ENV: 'production' });
    const { auth, authorization, callback } = await startLogin();
    expect(authorization.origin).toBe(TEST_ISSUER);
    expect(authorization.searchParams.get('code_challenge_method')).toBe('S256');
    expect(authorization.searchParams.get('response_type')).toBe('code');
    const store = await cookies();
    for (const name of transactionCookies) {
      expect(store.set).toHaveBeenCalledWith(name, expect.any(String), {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 600,
      });
    }
    provider.onTokenRequest = () => {
      for (const name of transactionCookies) expect(store.get(name)).toBeUndefined();
    };
    expect(await auth.handleOidcCallback(callback)).toEqual({ ...IDENTITY, email: IDENTITY.email.toLowerCase() });
    expect(provider.tokenRequests).toHaveLength(1);
    expect(provider.tokenRequests[0].get('redirect_uri')).toBe(`${TEST_APP_URL}/api/auth/callback`);
    await expectConsumed();
    await expect(auth.handleOidcCallback(callback)).rejects.toThrow();
    expect(provider.tokenRequests).toHaveLength(1);
  });

  it('preserves an explicitly registered public redirect URI', async () => {
    process.env.OIDC_REDIRECT_URI = `${TEST_APP_URL}/custom/callback`;
    const { auth, authorization, callback } = await startLogin();
    expect(authorization.searchParams.get('redirect_uri')).toBe(process.env.OIDC_REDIRECT_URI);
    await expect(auth.handleOidcCallback(callback)).resolves.toHaveProperty('sub', IDENTITY.sub);
    expect(provider.tokenRequests[0].get('redirect_uri')).toBe(process.env.OIDC_REDIRECT_URI);
  });

  it.each(
    transactionCookies.flatMap((name) => [
      [name, 'missing'],
      [name, 'empty'],
    ]),
  )('rejects a %s cookie that is %s before exchange and consumes the rest', async (name, condition) => {
    const { auth, callback } = await startLogin();
    const store = await cookies();
    if (condition === 'empty') store.set(name, '');
    else store.delete(name);
    await expect(auth.handleOidcCallback(callback)).rejects.toThrow();
    expect(provider.tokenRequests).toHaveLength(0);
    await expectConsumed();
  });

  it('rejects a callback without any transaction before discovery or exchange', async () => {
    const { handleOidcCallback } = await import('@/lib/auth');
    await expect(handleOidcCallback(new URL(`${TEST_APP_URL}/api/auth/callback?code=unsolicited`))).rejects.toThrow();
    expect(provider.fetch).not.toHaveBeenCalled();
  });

  it.each(['missing', 'mismatch', 'duplicate'])('rejects %s response state before token exchange', async (kind) => {
    const { auth, callback } = await startLogin();
    if (kind === 'missing') callback.searchParams.delete('state');
    if (kind === 'mismatch') callback.searchParams.set('state', 'different-transaction');
    if (kind === 'duplicate') callback.searchParams.append('state', 'different-transaction');
    await expect(auth.handleOidcCallback(callback)).rejects.toThrow();
    expect(provider.tokenRequests).toHaveLength(0);
    await expectConsumed();
  });

  it.each(['missing', 'duplicate', 'provider error'])('rejects a %s authorization code', async (kind) => {
    const { auth, callback } = await startLogin();
    if (kind !== 'duplicate') callback.searchParams.delete('code');
    if (kind === 'duplicate') callback.searchParams.append('code', 'another-code');
    if (kind === 'provider error') callback.searchParams.set('error', 'access_denied');
    await expect(auth.handleOidcCallback(callback)).rejects.toThrow();
    expect(provider.tokenRequests).toHaveLength(0);
    await expectConsumed();
  });

  it.each([
    ['wrong nonce', { nonce: 'another-transaction' }],
    ['missing nonce', { nonce: undefined }],
    ['wrong issuer', { iss: 'https://other.example.test' }],
    ['wrong audience', { aud: 'another-client' }],
    ['expired ID token', { exp: 1 }],
    ['missing subject', { sub: undefined }],
    ['empty subject', { sub: '' }],
  ])('rejects an ID token with %s', async (_label, claims) => {
    provider.idClaims = claims;
    const { auth, callback } = await startLogin();
    await expect(auth.handleOidcCallback(callback)).rejects.toThrow();
    expect(provider.userInfoRequests).toBe(0);
    await expectConsumed();
  });

  it('requires an ID token even when UserInfo would supply an identity', async () => {
    provider.omitIdToken = true;
    const { auth, callback } = await startLogin();
    await expect(auth.handleOidcCallback(callback)).rejects.toThrow();
    expect(provider.userInfoRequests).toBe(0);
    await expectConsumed();
  });

  it("cannot exchange a code using another transaction's PKCE verifier", async () => {
    const { auth, callback } = await startLogin();
    (await cookies()).set('krypton_pkce', 'another-valid-length-verifier-from-a-different-transaction');
    await expect(auth.handleOidcCallback(callback)).rejects.toThrow();
    expect(provider.tokenRequests).toHaveLength(1);
    expect(provider.userInfoRequests).toBe(0);
    await expectConsumed();
    await expect(auth.handleOidcCallback(callback)).rejects.toThrow();
    expect(provider.tokenRequests).toHaveLength(1);
  });

  it('consumes cookies even if discovery fails', async () => {
    const store = await cookies();
    for (const name of transactionCookies) store.set(name, 'synthetic-transaction-value');
    provider.discoveryStatus = 503;
    const { handleOidcCallback } = await import('@/lib/auth');
    await expect(handleOidcCallback(new URL(`${TEST_APP_URL}/api/auth/callback?code=test`))).rejects.toThrow();
    await expectConsumed();
    expect(provider.tokenRequests).toHaveLength(0);
  });

  it('consumes cookies before rejecting an invalid runtime signing key', async () => {
    delete process.env.SESSION_SECRET;
    const store = await cookies();
    for (const name of transactionCookies) store.set(name, 'synthetic-transaction-value');
    const { handleOidcCallback } = await import('@/lib/auth');
    await expect(handleOidcCallback(new URL(`${TEST_APP_URL}/api/auth/callback?code=test`))).rejects.toThrow(
      /SESSION_SECRET/,
    );
    await expectConsumed();
    expect(provider.fetch).not.toHaveBeenCalled();
  });

  it('consumes cookies on token-endpoint failure and requires a new login', async () => {
    provider.tokenStatus = 400;
    const { auth, callback } = await startLogin();
    await expect(auth.handleOidcCallback(callback)).rejects.toThrow();
    await expectConsumed();
    provider.tokenStatus = 200;
    await expect(auth.handleOidcCallback(callback)).rejects.toThrow();
    expect(provider.tokenRequests).toHaveLength(1);
  });
});

describe('OIDC identity and group mapping', () => {
  it('sets a verifiable session and redirects to the public app after a valid callback', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const { auth, callback } = await startLogin();
    const { GET } = await import('@/app/api/auth/callback/route');
    const response = await GET(new Request(callback));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(`${TEST_APP_URL}/`);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const token = (await cookies()).get('krypton_session')?.value;
    expect(token).toBeDefined();
    expect(await auth.verifySessionToken(token!)).toEqual({ ...IDENTITY, email: IDENTITY.email.toLowerCase() });
    await expectConsumed();
  });

  it('redirects a subject-mismatched callback to login without a session or leaked claims', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    provider.userInfo = { sub: 'other-subject', email: 'admin@example.test', groups: ['unit-test-admins'] };
    const { callback } = await startLogin();
    const { GET } = await import('@/app/api/auth/callback/route');
    const response = await GET(new Request(callback));
    expect(response.headers.get('location')).toBe(`${TEST_APP_URL}/login?auth=error`);
    expect((await cookies()).get('krypton_session')).toBeUndefined();
    expect(JSON.stringify(log.mock.calls)).not.toMatch(
      /other-subject|admin@example\.test|unit-test-admins|synthetic-access-token/,
    );
    await expectConsumed();
  });

  it('merges fresh UserInfo only for the verified ID-token subject', async () => {
    provider.userInfo = { sub: IDENTITY.sub, email: 'Fresh@Example.test', name: 'Fresh Name', groups: ['fresh-team'] };
    const { auth, callback } = await startLogin();
    expect(await auth.handleOidcCallback(callback)).toEqual({
      sub: IDENTITY.sub,
      email: 'fresh@example.test',
      name: 'Fresh Name',
      groups: ['fresh-team'],
    });
    expect(provider.userInfoRequests).toBe(1);
  });

  it('rejects mismatched UserInfo rather than merging or silently accepting it', async () => {
    provider.userInfo = { sub: 'other-subject', email: 'admin@example.test', groups: ['unit-test-admins'] };
    const { auth, callback } = await startLogin();
    await expect(auth.handleOidcCallback(callback)).rejects.toThrow(/subject/i);
    await expectConsumed();
  });

  it('never fills missing ID-token identity from unbound UserInfo', async () => {
    provider.idClaims = { email: undefined };
    provider.userInfo = { email: 'admin@example.test', groups: ['unit-test-admins'] };
    const { auth, callback } = await startLogin();
    await expect(auth.handleOidcCallback(callback)).rejects.toThrow();
  });

  it('supports providers that supply identity only through ID-token claims', async () => {
    provider.userInfoEnabled = false;
    const { auth, callback } = await startLogin();
    expect(await auth.handleOidcCallback(callback)).toEqual({ ...IDENTITY, email: IDENTITY.email.toLowerCase() });
    expect(provider.userInfoRequests).toBe(0);
  });

  it('preserves ID-token fallback when optional UserInfo is unavailable', async () => {
    provider.userInfoStatus = 503;
    const { auth, callback } = await startLogin();
    expect(await auth.handleOidcCallback(callback)).toEqual({ ...IDENTITY, email: IDENTITY.email.toLowerCase() });
  });

  it.each([
    ['nested Keycloak realm roles', {}, { realm_access: { roles: ['realm-team', 42] } }, ['realm-team']],
    [
      'configured nested claim first',
      { OIDC_GROUPS_CLAIM: 'teams.memberships' },
      {
        teams: { memberships: ['configured-team'] },
        groups: ['group-team'],
        roles: ['role-team'],
        realm_access: { roles: ['realm-team'] },
      },
      ['configured-team'],
    ],
    [
      'groups before roles',
      {},
      { groups: ['group-team'], roles: ['role-team'], realm_access: { roles: ['realm-team'] } },
      ['group-team'],
    ],
    ['roles before realm roles', {}, { roles: ['role-team'], realm_access: { roles: ['realm-team'] } }, ['role-team']],
    [
      'empty configured claim fallback',
      { OIDC_GROUPS_CLAIM: 'teams' },
      { teams: [], realm_access: { roles: ['realm-team'] } },
      ['realm-team'],
    ],
  ])('resolves %s', async (_label, env, claims, expected) => {
    Object.assign(process.env, env);
    provider.userInfoEnabled = false;
    provider.idClaims = { groups: undefined, ...claims };
    const { auth, callback } = await startLogin();
    expect((await auth.handleOidcCallback(callback)).groups).toEqual(expected);
  });

  it('preserves configured username/name mappings and lowercase identities', async () => {
    Object.assign(process.env, { OIDC_USERNAME_CLAIM: 'upn', OIDC_NAME_CLAIM: 'display' });
    provider.userInfoEnabled = false;
    provider.idClaims = { upn: 'Mapped@Example.test', display: 'Mapped Name' };
    const { auth, callback } = await startLogin();
    expect(await auth.handleOidcCallback(callback)).toMatchObject({
      email: 'mapped@example.test',
      name: 'Mapped Name',
    });
  });
});
