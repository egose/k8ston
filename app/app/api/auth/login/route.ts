import { connection, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import {
  createSessionToken,
  describeAuthError,
  DEV_USER,
  getAuthorizationUrl,
  isOidcConfigured,
  setSessionCookie,
} from '@/lib/auth';

/** Start SSO login — or short-circuit to a dev session when AUTH_DISABLED. */
export async function GET() {
  // OIDC discovery must never run at build time (see /api/config): env at
  // build time (e.g. sandbox http issuer) differs from deploy time.
  await connection();
  if (config.authDisabled) {
    await setSessionCookie(await createSessionToken(DEV_USER));
    return NextResponse.redirect(new URL('/', config.appUrl));
  }
  if (!isOidcConfigured()) {
    return NextResponse.json(
      {
        error:
          'Sign-in is not configured. Contact your administrator. (Operator: set OIDC_ISSUER/OIDC_CLIENT_ID, or AUTH_DISABLED=true for local dev.)',
      },
      { status: 501 },
    );
  }
  try {
    const url = await getAuthorizationUrl();
    return NextResponse.redirect(url);
  } catch (err) {
    // Discovery/network failure talking to the IdP: log the actionable
    // detail (cause code, hostname, hint) and answer 502 instead of the
    // default Next.js 500 stack trace.
    const details = describeAuthError(err);
    console.error(
      JSON.stringify({
        ts: new Date().toISOString(),
        app: 'krypton',
        action: 'auth.login',
        result: 'error',
        detail: details.message,
        issuer: config.oidc.issuer,
        ...(details.code ? { code: details.code } : {}),
        ...(details.hostname ? { hostname: details.hostname } : {}),
        ...(details.hint ? { hint: details.hint } : {}),
      }),
    );
    return NextResponse.json(
      {
        error:
          'Sign-in is temporarily unavailable: the app cannot reach the identity provider. Please try again later or contact your administrator.',
        issuer: config.oidc.issuer,
        ...(details.code ? { code: details.code } : {}),
        ...(details.hint ? { hint: details.hint } : {}),
      },
      { status: 502 },
    );
  }
}
