import { jsonError, jsonResponse, requireUser } from '@/lib/http';
import { assertNamespaceAllowed } from '@/lib/namespaces';
import { loadAuthorizedLiveSecret } from '@/lib/secret-access';
import { toSecretVersion } from '@/lib/secrets';
import { listSnapshots } from '@/lib/snapshot-store';

type Ctx = RouteContext<'/api/namespaces/[namespace]/secrets/[name]/versions'>;

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { namespace, name } = await ctx.params;
    await assertNamespaceAllowed(namespace, user);

    const live = await loadAuthorizedLiveSecret('secret.history', user, namespace, name);
    const versions = (await listSnapshots(namespace, live, user)).map(toSecretVersion);
    return jsonResponse({ namespace, name, versions });
  } catch (err) {
    return jsonError(err);
  }
}
