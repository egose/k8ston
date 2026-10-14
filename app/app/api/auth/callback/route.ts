import { connection, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { createSessionToken, describeAuthError, handleOidcCallback, setSessionCookie } from '@/lib/auth';
import { noStore } from '@/lib/http';

export async function GET(req: Request) {
  // Never prerender: token exchange needs request cookies + deploy-time env.
  await connection();
  try {
    const user = await handleOidcCallback(new URL(req.url));
    await setSessionCookie(await createSessionToken(user));
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        app: 'k8ston',
        action: 'auth.login',
        user: user.email,
        result: 'allow',
      }),
    );
    return noStore(NextResponse.redirect(new URL('/', config.appUrl)));
  } catch (err) {
    // connection() is outside this try: prerendering bails out before auth work.
    // Never rethrow based on text/cause fields controlled by the provider.
    const callbackUrl = new URL(req.url);
    const details = describeAuthError(err, callbackUrl.searchParams);
    // Classify proxy/registration mismatch without logging request or config URLs.
    let redirectBaseMatches = false;
    try {
      const expected = new URL(config.oidc.redirectUri);
      redirectBaseMatches = callbackUrl.origin === expected.origin && callbackUrl.pathname === expected.pathname;
    } catch {
      /* Invalid configuration remains a classified sign-in failure. */
    }
    console.error(
      JSON.stringify({
        ts: new Date().toISOString(),
        app: 'k8ston',
        action: 'auth.callback',
        result: 'error',
        ...details,
        redirectBaseMatches,
      }),
    );
    // Only allowlisted OAuth/OIDC codes (or provider_error) reach the login URL.
    const next = new URL('/login?auth=error', config.appUrl);
    if (details.idpError) next.searchParams.set('idp_error', details.idpError);
    return noStore(NextResponse.redirect(next));
  }
}
