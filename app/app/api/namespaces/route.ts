import { config } from '@/lib/config';
import { jsonError, jsonResponse, requireUser } from '@/lib/http';
import { listAllowedNamespaces } from '@/lib/namespaces';

export async function GET() {
  try {
    const user = await requireUser();
    const namespaces = await listAllowedNamespaces(user);
    return jsonResponse({ scope: config.scope, namespaces });
  } catch (err) {
    return jsonError(err);
  }
}
