import { getCoreApi, requestOptions, toK8sError } from '@/lib/k8s';
import { HttpError, jsonError, jsonResponse, readJson, requireUser } from '@/lib/http';
import { assertNamespaceAllowed } from '@/lib/namespaces';
import { loadAuthorizedLiveSecret } from '@/lib/secret-access';
import { assertExpectedResourceVersion, recheckLiveSecret } from '@/lib/secret-mutations';
import { assertSecretMutationSupported, buildRawRestoreSecret, toDetail } from '@/lib/secrets';
import { createSnapshot, readSnapshotVersion } from '@/lib/snapshot-store';
import { auditLog, restoreSecretSchema } from '@/lib/validation';

type Ctx = RouteContext<'/api/namespaces/[namespace]/secrets/[name]/restore'>;

export async function POST(req: Request, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { namespace, name } = await ctx.params;
    await assertNamespaceAllowed(namespace, user);
    const { version, resourceVersion } = restoreSecretSchema.parse(await readJson(req));

    const core = getCoreApi();
    const live = await loadAuthorizedLiveSecret('secret.restore', user, namespace, name);
    assertExpectedResourceVersion(live, resourceVersion);
    if (live.metadata?.deletionTimestamp)
      throw new HttpError(409, 'This secret is being deleted and cannot be restored. Reload to check its status.');
    assertSecretMutationSupported(live.type ?? 'Opaque');

    const target = await readSnapshotVersion(namespace, live, version, user);

    // Raw data and live lifecycle/type rules are checked before saving history.
    const next = buildRawRestoreSecret({ live, snapshot: target.secret, name, namespace, user });
    await recheckLiveSecret(namespace, live, user);
    await createSnapshot(namespace, live, user);
    const restored = await core
      .replaceNamespacedSecret(
        {
          namespace,
          name,
          body: next,
        },
        requestOptions(user),
      )
      .catch((err: unknown) => {
        const { status } = toK8sError(err);
        if (status === 409 || status === 404) {
          throw new HttpError(
            409,
            'Restore conflict: the secret changed or was replaced concurrently. Earlier history changes are not rolled back. Reload and retry.',
          );
        }
        throw err;
      });
    auditLog({
      action: 'secret.restore',
      user: user.email,
      namespace,
      name,
      resourceVersion: restored.metadata?.resourceVersion,
      result: 'allow',
      detail: `restored to v${version}`,
    });
    return jsonResponse({ secret: toDetail(namespace, restored) });
  } catch (err) {
    return jsonError(err);
  }
}
