import { cookies } from 'next/headers';
import * as jose from 'jose';
import * as openid from 'openid-client';
import { config } from './config';

export interface SessionUser {
  sub: string;
  email: string;
  name: string;
  groups: string[];
}

const SESSION_COOKIE = 'k8ston_session';
const PKCE_COOKIE = 'k8ston_pkce';
const NONCE_COOKIE = 'k8ston_nonce';
const STATE_COOKIE = 'k8ston_state';

function sessionKey(): Uint8Array {
  // Validate at use time, not module import: the same image can be built
  // without runtime secrets, and AUTH_DISABLED does not need session JWTs.
  const secret = config.sessionSecret.trim();
  if (secret.length < 32 || secret === 'dev-only-insecure-secret-change-me-32chars!!') {
    throw new Error('SESSION_SECRET must be an explicit key of at least 32 characters, not the development fallback');
  }
  return new TextEncoder().encode(config.sessionSecret);
}

export const DEV_USER: SessionUser = {
  sub: 'dev',
  email: 'dev@k8ston.local',
  name: 'Local Developer',
  groups: ['k8ston-admin'],
};

// ---------------------------------------------------------------------------
// Session JWT (stateless, no DB)
// ---------------------------------------------------------------------------

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new jose.SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('k8ston')
    .setExpirationTime(`${config.sessionMaxAgeSec}s`)
    .sign(sessionKey());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jose.jwtVerify(token, sessionKey(), {
      issuer: 'k8ston',
      algorithms: ['HS256'],
      requiredClaims: ['sub', 'email', 'iat', 'exp'],
    });
    const { sub, email, name, groups, iat, exp } = payload;
    if (typeof sub !== 'string' || !sub.trim() || typeof email !== 'string' || !email.trim()) return null;
    if (typeof iat !== 'number' || typeof exp !== 'number' || iat > Math.floor(Date.now() / 1000) || exp <= iat)
      return null;
    if (name !== undefined && typeof name !== 'string') return null;
    if (groups !== undefined && (!Array.isArray(groups) || !groups.every((g) => typeof g === 'string'))) return null;
    return {
      sub,
      email,
      name: name ?? email,
      groups: groups ?? [],
    };
  } catch {
    return null;
  }
}

/** Current request user, or null when unauthenticated. */
export async function getSessionUser(): Promise<SessionUser | null> {
  // Read cookies unconditionally (even in dev-bypass mode): the session is
  // request data, and this keeps every caller request-time rendered instead
  // of statically prerendered with a baked-in user.
  const store = await cookies();
  if (config.authDisabled) return DEV_USER;
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: config.sessionMaxAgeSec,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

// ---------------------------------------------------------------------------
// OIDC (SSO) — generic provider: Keycloak, Entra ID, Okta, Google, GitHub
// ---------------------------------------------------------------------------

let oidcConfig: openid.Configuration | null = null;

export function isOidcConfigured(): boolean {
  return Boolean(config.oidc.issuer && config.oidc.clientId);
}

function isLoopbackHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1';
}

async function getOidcConfiguration(): Promise<openid.Configuration> {
  if (oidcConfig) return oidcConfig;
  if (!isOidcConfigured()) throw new Error('OIDC is not configured');
  const server = new URL(config.oidc.issuer);
  // Fail closed on http:// issuers: only loopback, only with explicit opt-in,
  // and never in production. The `execute` extension flips the Configuration
  // to allow insecure requests for discovery, grants, userinfo, and JWKS.
  const insecure = server.protocol === 'http:';
  if (insecure) {
    if (!isLoopbackHostname(server.hostname)) {
      throw new Error('OIDC issuer must use HTTPS (plain HTTP is only allowed for loopback issuers)');
    }
    if (process.env.NODE_ENV === 'production') {
      throw new Error('OIDC_ALLOW_HTTP is rejected when NODE_ENV=production');
    }
    if (!config.oidc.allowHttp) {
      throw new Error('OIDC issuer uses plain HTTP: set OIDC_ALLOW_HTTP=true to allow it (loopback sandbox only)');
    }
  }
  oidcConfig = await openid.discovery(
    server,
    config.oidc.clientId,
    config.oidc.clientSecret || undefined,
    undefined,
    insecure ? { execute: [openid.allowInsecureRequests] } : undefined,
  );
  return oidcConfig;
}

function cookieOpts(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

function extractGroups(claims: Record<string, unknown>): string[] {
  const candidates = [config.oidc.groupsClaim, 'groups', 'roles', 'realm_access.roles'].filter(Boolean);
  for (const path of candidates) {
    const value = path.split('.').reduce<unknown>((acc, key) => {
      if (typeof acc === 'object' && acc !== null && key in acc) {
        return (acc as Record<string, unknown>)[key];
      }
      return undefined;
    }, claims);
    if (Array.isArray(value)) {
      const groups = value.filter((v): v is string => typeof v === 'string');
      if (groups.length > 0) return groups;
    }
  }
  return [];
}

function extractClaim(claims: Record<string, unknown>, primary: string, fallbacks: string[]): string {
  for (const key of [primary, ...fallbacks]) {
    const v = claims[key];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return '';
}

/** Build the IdP login URL and stash PKCE/nonce/state in short-lived cookies. */
export async function getAuthorizationUrl(): Promise<URL> {
  sessionKey();
  const oidc = await getOidcConfiguration();
  const codeVerifier = openid.randomPKCECodeVerifier();
  const codeChallenge = await openid.calculatePKCECodeChallenge(codeVerifier);
  const nonce = openid.randomNonce();
  const state = `${randomToken()}:${randomToken()}`;

  const store = await cookies();
  store.set(PKCE_COOKIE, codeVerifier, cookieOpts(600));
  store.set(NONCE_COOKIE, nonce, cookieOpts(600));
  store.set(STATE_COOKIE, state, cookieOpts(600));

  const parameters: Record<string, string> = {
    redirect_uri: config.oidc.redirectUri,
    scope: config.oidc.scopes,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    nonce,
    state,
  };
  return openid.buildAuthorizationUrl(oidc, parameters);
}

/** Exchange the callback code for tokens and derive the SessionUser. */
export async function handleOidcCallback(currentUrl: URL): Promise<SessionUser> {
  const store = await cookies();
  const expectedState = store.get(STATE_COOKIE)?.value;
  const nonce = store.get(NONCE_COOKIE)?.value;
  const codeVerifier = store.get(PKCE_COOKIE)?.value;

  // Consume even incomplete or failed transactions. A retry must start a new
  // login; never downgrade missing cookies into optional openid-client checks.
  store.delete(PKCE_COOKIE);
  store.delete(NONCE_COOKIE);
  store.delete(STATE_COOKIE);
  if (!expectedState || !nonce || !codeVerifier) {
    throw new Error('OIDC login transaction is missing or expired; start a new sign-in');
  }
  sessionKey();
  const oidc = await getOidcConfiguration();

  // openid-client derives the token-request `redirect_uri` from `currentUrl`
  // by stripping query params. Behind a TLS-terminating Ingress/Route,
  // `req.url` is http://internal-host/... while the authorize request used
  // the public https://... appUrl — Keycloak then rejects the code exchange
  // with `invalid_grant: Incorrect redirect_uri`. Normalize to the configured
  // redirect URI (same value sent at authorize time), preserving the IdP's
  // response params (code/state/error). Assumes the registered redirect has
  // no own query string (the standard `<appUrl>/api/auth/callback` shape).
  const registered = new URL(config.oidc.redirectUri);
  const normalized = new URL(registered.toString());
  for (const [k, v] of currentUrl.searchParams) {
    normalized.searchParams.append(k, v);
  }
  if (!normalized.hash && currentUrl.hash) normalized.hash = currentUrl.hash;

  const tokens = await openid.authorizationCodeGrant(oidc, normalized, {
    pkceCodeVerifier: codeVerifier,
    expectedState,
    expectedNonce: nonce,
    idTokenExpected: true,
  });

  const claims = tokens.claims();
  if (!claims) throw new Error('OIDC callback did not return ID token claims');
  const record = claims as unknown as Record<string, unknown>;
  const sub = record.sub;
  if (typeof sub !== 'string' || !sub.trim()) throw new Error('OIDC ID token is missing a subject');

  // Prefer userinfo when available for fresh group membership.
  let merged: Record<string, unknown> = { ...record };
  try {
    if (tokens.access_token && oidc.serverMetadata().userinfo_endpoint) {
      const info = await openid.fetchUserInfo(oidc, tokens.access_token, sub);
      merged = { ...merged, ...(info as unknown as Record<string, unknown>) };
    }
  } catch (err) {
    // openid-client reports a UserInfo sub mismatch with this code. Do not
    // mistake a different identity for an unavailable optional endpoint, and
    // do not expose the error cause (which contains the returned claims).
    if (err instanceof openid.ClientError && err.code === 'OAUTH_JSON_ATTRIBUTE_COMPARISON_FAILED') {
      throw new Error('OIDC UserInfo subject does not match the ID token');
    }
    // Preserve ID-token-only login when optional UserInfo is unavailable.
  }

  const email = extractClaim(merged, config.oidc.usernameClaim, ['email', 'preferred_username', 'upn']).toLowerCase();
  const name = extractClaim(merged, config.oidc.nameClaim, ['name', 'preferred_username']);
  if (!sub || !email) throw new Error('OIDC claims are missing sub/email');

  return { sub, email, name: name || email, groups: extractGroups(merged) };
}

function randomToken(): string {
  return [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------------------
// Error reporting — classify OIDC failures without copying provider values
// ---------------------------------------------------------------------------

export interface AuthErrorDetails {
  message: string;
  /** Allowlisted system/library or application classification only. */
  code?: string;
  /** Known OAuth/OIDC code, or the fixed provider_error fallback. */
  idpError?: string;
  descriptionCode?: 'redirect_uri' | 'provided' | 'omitted';
  hint?: string;
}

const idpCodes = new Set([
  'invalid_request',
  'unauthorized_client',
  'access_denied',
  'unsupported_response_type',
  'invalid_scope',
  'server_error',
  'temporarily_unavailable',
  'interaction_required',
  'login_required',
  'account_selection_required',
  'consent_required',
  'invalid_request_uri',
  'invalid_request_object',
  'request_not_supported',
  'request_uri_not_supported',
  'registration_not_supported',
  'invalid_grant',
  'invalid_client',
  'unsupported_grant_type',
]);

export function classifyIdpError(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  return typeof value === 'string' && value.length <= 64 && idpCodes.has(value) ? value : 'provider_error';
}

const systemCodes = new Set([
  'EAI_AGAIN',
  'ENOTFOUND',
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'CERT_HAS_EXPIRED',
  'ERR_TLS_CERT_ALTNAME_INVALID',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'OAUTH_INVALID_RESPONSE',
  'OAUTH_RESPONSE_IS_NOT_JSON',
  'OAUTH_RESPONSE_BODY_ERROR',
  'OAUTH_AUTHORIZATION_RESPONSE_ERROR',
  'OAUTH_JSON_ATTRIBUTE_COMPARISON_FAILED',
  'OAUTH_JWT_CLAIM_COMPARISON_FAILED',
  'OAUTH_KEY_SELECTION_FAILED',
  'OAUTH_HTTP_REQUEST_FORBIDDEN',
]);

const localAuthErrors = new Map([
  [
    'SESSION_SECRET must be an explicit key of at least 32 characters, not the development fallback',
    'session_configuration',
  ],
  ['OIDC is not configured', 'oidc_configuration'],
  ['OIDC issuer must use HTTPS (plain HTTP is only allowed for loopback issuers)', 'oidc_configuration'],
  ['OIDC_ALLOW_HTTP is rejected when NODE_ENV=production', 'oidc_configuration'],
  ['OIDC issuer uses plain HTTP: set OIDC_ALLOW_HTTP=true to allow it (loopback sandbox only)', 'oidc_configuration'],
  ['OIDC login transaction is missing or expired; start a new sign-in', 'transaction_expired'],
  ['OIDC callback did not return ID token claims', 'identity_invalid'],
  ['OIDC ID token is missing a subject', 'identity_invalid'],
  ['OIDC UserInfo subject does not match the ID token', 'identity_mismatch'],
  ['OIDC claims are missing sub/email', 'identity_invalid'],
]);

function causeChain(err: unknown): Record<string, unknown>[] {
  const chain: Record<string, unknown>[] = [];
  let cur: unknown = err;
  const seen = new Set<unknown>();
  while (cur && typeof cur === 'object' && !seen.has(cur) && chain.length < 8) {
    seen.add(cur);
    chain.push(cur as Record<string, unknown>);
    cur = (cur as { cause?: unknown }).cause;
  }
  return chain;
}

/**
 * Error messages, descriptions, hostnames, and arbitrary string codes can all
 * carry tokens/claims/headers. Examine at most eight causes and 2 KiB per text
 * diagnostic, then emit fixed classifications/guidance only.
 */
export function describeAuthError(err: unknown, params?: URLSearchParams): AuthErrorDetails {
  const out: AuthErrorDetails = { message: 'Sign-in failed.' };
  const describeProvider = (code: unknown, description: unknown) => {
    out.idpError = classifyIdpError(code);
    if (typeof description === 'string' && description) {
      out.descriptionCode =
        description.length > 2048 || Buffer.byteLength(description, 'utf8') > 2048
          ? 'omitted'
          : /redirect_uri/i.test(description)
            ? 'redirect_uri'
            : 'provided';
    }
  };
  for (const link of causeChain(err)) {
    if (link.error !== undefined && !out.idpError) describeProvider(link.error, link.error_description);
    if (typeof link.code === 'string' && link.code.length <= 64 && systemCodes.has(link.code) && !out.code) {
      out.code = link.code;
    }
    if (
      typeof link.message === 'string' &&
      link.message.length <= 2048 &&
      Buffer.byteLength(link.message, 'utf8') <= 2048 &&
      !out.code
    ) {
      out.code = localAuthErrors.get(link.message);
      if (!out.code && /issuer/i.test(link.message) && /match|mismatch|expected/i.test(link.message))
        out.code = 'issuer_mismatch';
    }
  }
  if (!out.idpError && params?.has('error')) describeProvider(params.get('error'), params.get('error_description'));

  if (
    (out.idpError === 'invalid_request' || out.idpError === 'invalid_grant') &&
    out.descriptionCode === 'redirect_uri'
  ) {
    const phase = out.idpError === 'invalid_grant' ? 'token' : 'authorize';
    out.hint = `Check redirect_uri registration (${phase} phase), OIDC_REDIRECT_URI, and the public ingress scheme/host.`;
  } else if (out.idpError === 'invalid_scope') {
    out.hint = 'IdP rejected the requested scopes. Review OIDC_SCOPES.';
  } else if (out.idpError) {
    out.hint = 'IdP rejected the login. Verify client, realm, and redirect URI registration.';
  } else if (out.code === 'session_configuration') {
    out.hint =
      'Configure SESSION_SECRET with an explicit key of at least 32 characters, excluding the development fallback.';
  } else if (out.code === 'oidc_configuration') {
    out.hint =
      'Check OIDC_ISSUER/OIDC_CLIENT_ID and the HTTPS requirement; HTTP is permitted only for explicitly enabled local development.';
  } else if (out.code === 'transaction_expired') {
    out.hint = 'Start a new sign-in. The transaction cookies were missing or expired.';
  } else if (out.code === 'EAI_AGAIN' || out.code === 'ENOTFOUND') {
    out.hint = 'Pod DNS cannot resolve the IdP. Check DNS configuration and UDP/TCP 53 egress.';
  } else if (out.code && /^(ECONNREFUSED|ECONNRESET|ETIMEDOUT|EHOSTUNREACH|ENETUNREACH)$/.test(out.code)) {
    out.hint = 'Cannot reach the IdP. Check TCP 443 egress, NetworkPolicy, and the cluster egress firewall.';
  } else if (out.code && /CERT|SELF_SIGNED|UNABLE_TO_VERIFY|DEPTH_ZERO/.test(out.code)) {
    out.hint = 'Check the IdP certificate trust chain, hostname, and validity in the container.';
  } else if (out.code === 'issuer_mismatch') {
    out.hint = 'OIDC_ISSUER must exactly match the issuer in provider discovery metadata.';
  } else if (out.code === 'identity_mismatch' || out.code === 'identity_invalid') {
    out.hint = 'The provider identity could not be verified. Check ID-token and UserInfo subject/claim configuration.';
  }
  return out;
}
