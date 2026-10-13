import { getCoreApi, requestOptions } from '@/lib/k8s';
import { HttpError, isConflict, jsonError, jsonResponse, readJson, requireUser } from '@/lib/http';
import { assertNamespaceAllowed } from '@/lib/namespaces';
import { canCreateInNamespace, filterVisibleSecrets } from '@/lib/authz';
import { assertSizeOk, buildLiveSecret, toSummary } from '@/lib/secrets';
import { auditLog, createSecretSchema } from '@/lib/validation';
import { LABELS } from '@/lib/config';
import { COLLECTION_LIMITS, readK8sCollection } from '@/lib/k8s-list';

export async function GET(_req: Request, ctx: RouteContext<'/api/namespaces/[namespace]/secrets'>) {
  try {
    const user = await requireUser();
    const { namespace } = await ctx.params;
    await assertNamespaceAllowed(namespace, user);

    const core = getCoreApi();
    const opts = requestOptions(user);
    // A negative selector also includes label-less, annotation-managed Secrets.
    // Managed visibility and live ACLs remain enforced after collection.
    const secrets = await readK8sCollection(
      (page) =>
        core.listNamespacedSecret(
          {
            namespace,
            labelSelector: `${LABELS.kind}!=history`,
            ...page,
          },
          opts,
        ),
      COLLECTION_LIMITS.liveSecrets,
      (secret) => secret,
    );
    const visible = await filterVisibleSecrets(user, namespace, secrets);
    return jsonResponse({
      namespace,
      secrets: visible.map((s) => toSummary(namespace, s)),
      // UX hint so the UI can disable creation upfront (POST still enforces).
      canCreate: await canCreateInNamespace(user, namespace),
    });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: Request, ctx: RouteContext<'/api/namespaces/[namespace]/secrets'>) {
  try {
    const user = await requireUser();
    const { namespace } = await ctx.params;
    await assertNamespaceAllowed(namespace, user);

    if (!(await canCreateInNamespace(user, namespace))) {
      auditLog({
        action: 'secret.create',
        user: user.email,
        namespace,
        result: 'deny',
      });
      throw new HttpError(403, `You are not allowed to create secrets in "${namespace}"`);
    }

    const body = createSecretSchema.parse(await readJson(req));
    const data = { ...body.data, ...(body.stringData ?? {}) };
    assertSizeOk(data);

    const core = getCoreApi();
    try {
      const created = await core.createNamespacedSecret(
        {
          namespace,
          body: buildLiveSecret({
            name: body.name,
            namespace,
            type: body.type,
            data,
            description: body.description,
            allowedGroups: body.allowedGroups,
            allowedUsers: body.allowedUsers,
            user,
          }),
        },
        requestOptions(user),
      );
      auditLog({
        action: 'secret.create',
        user: user.email,
        namespace,
        name: body.name,
        keys: Object.keys(data),
        resourceVersion: created.metadata?.resourceVersion,
        result: 'allow',
      });
      return jsonResponse({ secret: toSummary(namespace, created) }, { status: 201 });
    } catch (err: unknown) {
      if (isConflict(err)) {
        throw new HttpError(409, `Secret "${body.name}" already exists in "${namespace}"`);
      }
      throw err;
    }
  } catch (err) {
    return jsonError(err);
  }
}
