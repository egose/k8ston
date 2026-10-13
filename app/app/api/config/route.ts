import { connection } from 'next/server';
import { config } from '@/lib/config';
import { isOidcConfigured } from '@/lib/auth';
import { jsonError, jsonResponse } from '@/lib/http';

/** Public-safe client configuration (no secrets). */
export async function GET() {
  // Env differs between build and deploy (one image, many clusters):
  // always resolve at request time, never prerender.
  await connection();
  try {
    return jsonResponse({
      scope: config.scope,
      etcdEncrypted: config.etcdEncrypted,
      authDisabled: config.authDisabled,
      oidcConfigured: isOidcConfigured(),
      historyLimit: config.historyLimit,
      managedOnly: config.managedOnly,
      restartEnabled: config.restartEnabled,
      appNamespace: config.appNamespace,
    });
  } catch (err) {
    return jsonError(err);
  }
}
