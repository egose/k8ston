import { connection, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { createSessionToken, describeAuthError, handleOidcCallback, setSessionCookie } from '@/lib/auth';

export async function GET(req: Request) {
  // Never prerender: token exchange needs request cookies + deploy-time env.
  await connection();
  try {
    const user = await handleOidcCallback(new URL(req.url));
    await setSessionCookie(await createSessionToken(user));
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        app: 'krypton',
        action: 'auth.login',
        user: user.email,
        result: 'allow',
      }),
    );
    return NextResponse.redirect(new URL('/', config.appUrl));
  } catch (err) {
    // Next.js probes this route during prerendering; rethrow the bailout
    // signal instead of logging it as a real auth failure.
    if ((err as Error)?.message?.includes('bail out of prerendering')) throw err;
    const details = describeAuthError(err);
    // Belt & braces: the IdP's verdict is also in the callback query string.
    const params = new URL(req.url).searchParams;
    const idpError = details.idpError ?? params.get('error') ?? undefined;
    const idpDescription = details.idpDescription ?? params.get('error_description') ?? undefined;
    console.error(
      JSON.stringify({
        ts: new Date().toISOString(),
        app: 'krypton',
        action: 'auth.callback',
        result: 'error',
        detail: details.message,
        ...(details.code ? { code: details.code } : {}),
        ...(details.hostname ? { hostname: details.hostname } : {}),
        ...(idpError ? { idpError } : {}),
        ...(idpDescription ? { idpDescription } : {}),
        ...(details.hint ? { hint: details.hint } : {}),
      }),
    );
    // Land on /login (not /) so the error banner actually renders, carrying
    // the short IdP code for bug reports. error_description stays server-side:
    // it can echo back request details and would bloat the URL.
    const next = new URL('/login?auth=error', config.appUrl);
    if (idpError) next.searchParams.set('idp_error', idpError);
    return NextResponse.redirect(next);
  }
}
