import { cookies } from 'next/headers';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TEST_APP_URL } from './helpers/environment';

const marker = 'synthetic-private-provider-value';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('OIDC classified diagnostics and bounded redirects', () => {
  it.each([
    { label: 'known code', value: 'invalid_grant', expected: 'invalid_grant' },
    { label: 'unknown code', value: marker, expected: 'provider_error' },
    { label: 'header text', value: `access_denied\nAuthorization: ${marker}`, expected: 'provider_error' },
    { label: 'large code', value: marker.repeat(4000), expected: 'provider_error' },
    { label: 'Unicode code', value: '秘密🔐', expected: 'provider_error' },
    { label: 'inherited property', value: 'constructor', expected: 'provider_error' },
  ])('classifies $label in a real callback and never logs the raw response parameters', async ({ value, expected }) => {
    const url = new URL('/api/auth/callback', TEST_APP_URL);
    url.searchParams.set('error', value);
    url.searchParams.set('error_description', `Incorrect redirect_uri ${marker}`);
    url.searchParams.set('code', marker);
    url.searchParams.set('state', marker);
    const { GET } = await import('@/app/api/auth/callback/route');
    const response = await GET(new Request(url));
    const redirect = new URL(response.headers.get('location')!);
    expect(response.status).toBe(307);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(redirect.pathname).toBe('/login');
    expect(redirect.searchParams.get('idp_error')).toBe(expected);
    expect(redirect.searchParams.get('auth')).toBe('error');
    expect(redirect.toString().length).toBeLessThan(150);
    expect(redirect.toString()).not.toContain(marker);
    const log = JSON.stringify(vi.mocked(console.error).mock.calls);
    expect(log).not.toContain(marker);
    expect(log).not.toMatch(/error_description|idpDescription|callbackUri|clientId/);
    expect(log).toContain('redirect_uri');
    expect(log).toContain('redirectBaseMatches');
    expect((await cookies()).get('krypton_session')).toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('bounds description processing and omits hostnames, raw messages, unknown codes, and headers', async () => {
    const { describeAuthError } = await import('@/lib/auth');
    const error = Object.assign(new Error(`${marker} Headers: Authorization=${marker}`), {
      error: 'invalid_grant',
      error_description: `redirect_uri ${marker}`.repeat(500),
      code: `CERT_${marker}`,
      hostname: marker,
      headers: { authorization: marker },
      cause: { code: 'EAI_AGAIN', hostname: marker, message: marker },
    });
    const result = describeAuthError(error);
    expect(result).toMatchObject({ idpError: 'invalid_grant', descriptionCode: 'omitted', code: 'EAI_AGAIN' });
    expect(JSON.stringify(result)).not.toContain(marker);
    expect(JSON.stringify(result).length).toBeLessThan(500);
  });

  it('bounds and cycle-checks cause traversal without serializing arbitrary objects', async () => {
    const { describeAuthError } = await import('@/lib/auth');
    const cycle: { cause?: unknown; message: string; toString: () => never } = {
      message: marker,
      toString: () => {
        throw new Error('Do not stringify unknown errors');
      },
    };
    cycle.cause = cycle;
    expect(describeAuthError(cycle)).toEqual({ message: 'Sign-in failed.' });
    let deep: unknown = { code: 'EAI_AGAIN' };
    for (let i = 0; i < 9; i++) deep = { cause: deep, message: marker };
    expect(describeAuthError(deep).code).toBeUndefined();
  });

  it.each(['EAI_AGAIN', 'ECONNREFUSED', 'CERT_HAS_EXPIRED'])(
    'retains useful %s guidance at the login error boundary',
    async (code) => {
      process.env.OIDC_ISSUER = `https://idp.example.test/${marker}?credential=${marker}`;
      const auth = await import('@/lib/auth');
      vi.spyOn(auth, 'getAuthorizationUrl').mockRejectedValue(
        Object.assign(new Error(marker), {
          cause: { code, hostname: marker, message: marker, headers: { authorization: marker } },
        }),
      );
      const { GET } = await import('@/app/api/auth/login/route');
      const response = await GET();
      expect(response.status).toBe(502);
      expect(response.headers.get('cache-control')).toBe('no-store');
      const result = await response.json();
      expect(result.code).toBe(code);
      expect(result.hint).toBeTruthy();
      expect(result).not.toHaveProperty('issuer');
      expect(JSON.stringify([result, vi.mocked(console.error).mock.calls])).not.toContain(marker);
    },
  );

  it('does not mistake raw provider text for a Next prerender bailout', async () => {
    const auth = await import('@/lib/auth');
    vi.spyOn(auth, 'handleOidcCallback').mockRejectedValue(new Error(`bail out of prerendering ${marker}`));
    const { GET } = await import('@/app/api/auth/callback/route');
    const response = await GET(new Request(`${TEST_APP_URL}/api/auth/callback`));
    expect(response.headers.get('location')).toBe(`${TEST_APP_URL}/login?auth=error`);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(marker);
  });

  it('handles cyclic provider causes at the actual callback boundary', async () => {
    const auth = await import('@/lib/auth');
    const error = new Error(marker, { cause: undefined });
    error.cause = error;
    vi.spyOn(auth, 'handleOidcCallback').mockRejectedValue(error);
    const { GET } = await import('@/app/api/auth/callback/route');
    const response = await GET(new Request(`${TEST_APP_URL}/api/auth/callback`));
    expect(response.status).toBe(307);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(marker);
  });

  it.each(['unconfigured', 'bypass', 'login redirect', 'logout redirect'])('uses no-store for %s', async (mode) => {
    if (mode === 'unconfigured') delete process.env.OIDC_ISSUER;
    if (mode === 'bypass') process.env.AUTH_DISABLED = 'true';
    const auth = await import('@/lib/auth');
    if (mode === 'login redirect')
      vi.spyOn(auth, 'getAuthorizationUrl').mockResolvedValue(new URL('https://idp.example.test/authorize'));
    const response =
      mode === 'logout redirect'
        ? await (await import('@/app/api/auth/logout/route')).GET()
        : await (await import('@/app/api/auth/login/route')).GET();
    expect(response.status).toBe(mode === 'unconfigured' ? 501 : 307);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
});
