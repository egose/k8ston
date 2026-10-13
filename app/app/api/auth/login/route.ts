import { connection, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { describeAuthError, getAuthorizationUrl, isOidcConfigured } from '@/lib/auth';
import { jsonResponse, noStore } from '@/lib/http';

/** Start SSO login — or short-circuit to the local bypass when AUTH_DISABLED. */
export async function GET() {
  // OIDC discovery must never run at build time (see /api/config): env at
  // build time (e.g. sandbox http issuer) differs from deploy time.
  await connection();
  if (config.authDisabled) {
    // getSessionUser supplies the mock user at request time; no signing key
    // or reusable development session token is needed for explicit bypass.
    return noStore(NextResponse.redirect(new URL('/', config.appUrl)));
  }
  if (!isOidcConfigured()) {
    return jsonResponse(
      {
        error:
          'Sign-in is not configured. Contact your administrator. (Operator: set OIDC_ISSUER/OIDC_CLIENT_ID, or AUTH_DISABLED=true for local dev.)',
      },
      { status: 501 },
    );
  }
  try {
    const url = await getAuthorizationUrl();
    return noStore(NextResponse.redirect(url));
  } catch (err) {
    // Only classified diagnostics, never upstream payloads or headers.
    const details = describeAuthError(err);
    console.error(
      JSON.stringify({
        ts: new Date().toISOString(),
        app: 'krypton',
        action: 'auth.login',
        result: 'error',
        ...details,
      }),
    );
    return jsonResponse(
      {
        error: 'Sign-in is temporarily unavailable. Please try again later or contact your administrator.',
        ...(details.code ? { code: details.code } : {}),
        ...(details.hint ? { hint: details.hint } : {}),
      },
      { status: 502 },
    );
  }
}
