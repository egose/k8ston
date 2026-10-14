import { HttpError, jsonError, jsonResponse, requireUser } from '@/lib/http';
import { assertNamespaceAllowed } from '@/lib/namespaces';
import { loadAuthorizedLiveSecret } from '@/lib/secret-access';
import { consumerRequestFailure, restartConsumers } from '@/lib/consumers';
import { auditLog } from '@/lib/validation';
import { config } from '@/lib/config';

type Ctx = RouteContext<'/api/namespaces/[namespace]/secrets/[name]/restart-consumers'>;

/**
 * Request pod-template rollouts; completion/readiness/credential uptake is not checked.
 * Disabled entirely when K8STON_RESTART_ENABLED=false (403).
 */
export async function POST(_req: Request, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { namespace, name } = await ctx.params;
    if (!config.restartEnabled) {
      auditLog({ action: 'secret.restart', user: user.email, namespace, name, result: 'deny' });
      throw new HttpError(403, 'Restarting apps is disabled on this deployment');
    }
    await assertNamespaceAllowed(namespace, user);

    await loadAuthorizedLiveSecret('secret.restart', user, namespace, name);

    const result = await restartConsumers(namespace, name, user).catch((err: unknown) => {
      auditLog({
        action: 'secret.restart',
        user: user.email,
        namespace,
        name,
        result: 'error',
        detail: JSON.stringify({ stage: 'prepare', ...consumerRequestFailure(err) }),
      });
      throw err;
    });
    auditLog({
      action: 'secret.restart',
      user: user.email,
      namespace,
      name,
      result: result.status === 'partial' || result.status === 'failed' ? 'error' : 'allow',
      detail: JSON.stringify({
        status: result.status,
        matched: result.matched,
        requested: result.requested,
        failures: result.failures,
        discoveryFailures: result.discoveryFailures,
      }),
    });
    return jsonResponse(result.status === 'failed' ? { ...result, error: result.message } : result, {
      status: result.status === 'failed' ? 503 : result.status === 'partial' ? 207 : 200,
    });
  } catch (err) {
    return jsonError(err);
  }
}
