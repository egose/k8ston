import { cookies } from 'next/headers';
import * as jose from 'jose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TEST_APP_URL, TEST_SESSION_SECRET } from './helpers/environment';

const user = { sub: 'alice-id', email: 'alice@example.test', name: 'Alice', groups: ['developers'] };
const formerFallback = 'dev-only-insecure-secret-change-me-32chars!!';
const key = (secret: string) => new TextEncoder().encode(secret);
const now = () => Math.floor(Date.now() / 1000);

async function signClaims(overrides: Record<string, unknown> = {}, secret = TEST_SESSION_SECRET, alg = 'HS256') {
  return new jose.SignJWT({ ...user, iss: 'k8ston', iat: now(), exp: now() + 3600, ...overrides })
    .setProtectedHeader({ alg })
    .sign(key(secret));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-12T12:00:00Z'));
});

describe('session signing configuration', () => {
  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['short', 'synthetic-short-key'],
    ['31 characters', 'a'.repeat(31)],
    ['former public fallback', formerFallback],
    ['whitespace', ' '.repeat(32)],
    ['padded public fallback', ` ${formerFallback} `],
  ])('rejects %s keys for both creation and authentication', async (_label, secret) => {
    if (secret === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = secret;
    const auth = await import('@/lib/auth');
    const forged = await signClaims({}, secret || formerFallback);
    expect(await auth.verifySessionToken(forged)).toBeNull();
    const failure = await auth.createSessionToken(user).catch((error: Error) => error);
    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toMatch(/SESSION_SECRET.*32/);
    if (secret) expect(JSON.stringify(auth.describeAuthError(failure))).not.toContain(secret);

    (await cookies()).set('k8ston_session', forged);
    const { GET } = await import('@/app/api/auth/me/route');
    const response = await GET();
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ user: null });
    const { requireUser } = await import('@/lib/http');
    await expect(requireUser()).rejects.toMatchObject({ status: 401 });

    await expect(auth.getAuthorizationUrl()).rejects.toThrow(/SESSION_SECRET/);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('accepts an explicit key at the 32-character boundary', async () => {
    process.env.SESSION_SECRET = 'a'.repeat(32);
    const { createSessionToken, verifySessionToken } = await import('@/lib/auth');
    const token = await createSessionToken(user);
    expect(await verifySessionToken(token)).toEqual(user);
    const { payload, protectedHeader } = await jose.jwtVerify(token, key('a'.repeat(32)));
    expect(protectedHeader.alg).toBe('HS256');
    expect(payload).toMatchObject({ iss: 'k8ston', iat: now(), exp: now() + 28800 });
  });

  it('allows build-time imports and public configuration without a signing key', async () => {
    delete process.env.SESSION_SECRET;
    await expect(import('@/lib/auth')).resolves.toHaveProperty('getSessionUser');
    const { GET } = await import('@/app/api/config/route');
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ authDisabled: false, oidcConfigured: true });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('keeps explicit bypass request-bound and redirects without minting a JWT', async () => {
    delete process.env.SESSION_SECRET;
    process.env.AUTH_DISABLED = 'true';
    const auth = await import('@/lib/auth');
    expect(await auth.getSessionUser()).toEqual(auth.DEV_USER);
    expect(cookies).toHaveBeenCalled();
    const { GET } = await import('@/app/api/auth/login/route');
    const response = await GET();
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(`${TEST_APP_URL}/`);
    expect((await cookies()).get('k8ston_session')).toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('session JWT validation', () => {
  it('expires exactly at exp and keeps a valid session usable until then', async () => {
    const { createSessionToken, verifySessionToken } = await import('@/lib/auth');
    const token = await createSessionToken(user);
    const exp = jose.decodeJwt(token).exp!;
    vi.setSystemTime((exp - 1) * 1000);
    expect(await verifySessionToken(token)).toEqual(user);
    vi.setSystemTime(exp * 1000);
    expect(await verifySessionToken(token)).toBeNull();
  });

  it.each(['HS384', 'HS512'])('rejects a correctly signed %s JWT', async (alg) => {
    const { verifySessionToken } = await import('@/lib/auth');
    expect(await verifySessionToken(await signClaims({}, TEST_SESSION_SECRET, alg))).toBeNull();
  });

  it('rejects unsigned, malformed, forged, and payload-tampered tokens', async () => {
    const { verifySessionToken } = await import('@/lib/auth');
    const signed = await signClaims();
    const [header, , signature] = signed.split('.');
    const tampered = Buffer.from(JSON.stringify({ ...jose.decodeJwt(signed), groups: ['unit-test-admins'] })).toString(
      'base64url',
    );
    for (const token of [
      new jose.UnsecuredJWT({ ...user, iss: 'k8ston', exp: now() + 3600 }).encode(),
      'not-a-jwt',
      await signClaims({}, 'another-synthetic-signing-secret-012345'),
      `${header}.${tampered}.${signature}`,
    ]) {
      expect(await verifySessionToken(token)).toBeNull();
    }
  });

  it.each([
    ['wrong issuer', { iss: 'another-app' }],
    ['missing expiry', { exp: undefined }],
    ['expired', { exp: 1 }],
    ['non-numeric expiry', { exp: 'tomorrow' }],
    ['missing issued-at', { iat: undefined }],
    ['future issued-at', { iat: 4_000_000_000, exp: 4_000_000_100 }],
    ['missing subject', { sub: undefined }],
    ['empty subject', { sub: '' }],
    ['non-string subject', { sub: 42 }],
    ['missing identity', { email: undefined }],
    ['empty identity', { email: '' }],
    ['blank identity', { email: '   ' }],
    ['non-string identity', { email: 42 }],
    ['malformed display name', { name: {} }],
    ['non-array groups', { groups: 'unit-test-admins' }],
    ['malformed group entry', { groups: ['developers', { role: 'unit-test-admins' }] }],
  ])('rejects %s claims even with a valid signature', async (_label, claims) => {
    const { verifySessionToken } = await import('@/lib/auth');
    expect(await verifySessionToken(await signClaims(claims))).toBeNull();
  });

  it('preserves safe defaults for omitted display name and groups', async () => {
    const { verifySessionToken } = await import('@/lib/auth');
    expect(await verifySessionToken(await signClaims({ name: undefined, groups: undefined }))).toEqual({
      ...user,
      name: user.email,
      groups: [],
    });
  });
});
