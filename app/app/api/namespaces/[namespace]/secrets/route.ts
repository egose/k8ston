import { getCoreApi, requestOptions } from '@/lib/k8s';
import { HttpError, isConflict, jsonError, jsonResponse, readJson, requireUser } from '@/lib/http';
import { assertNamespaceAllowed } from '@/lib/namespaces';
import {
  canCreateInNamespace,
  filterVisibleSecrets,
  getNamespaceAccessMap,
  isAdmin,
  listCreatableTeams,
  listNamespaceTeams,
} from '@/lib/authz';
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
    // UX hints so the UI can disable creation upfront (POST still enforces).
    // canCreate = unassigned (namespace default); creatableTeams = assigned targets.
    // Non-admins already read policy above (filter/canCreate throw 503 on failure,
    // so the cached teams reads below cannot newly fail). Admins never needed
    // policy for listing — a teams outage degrades to [] instead of blocking them.
    const canCreate = await canCreateInNamespace(user, namespace);
    let teams: string[] = [];
    let creatableTeams: string[] = [];
    try {
      teams = await listNamespaceTeams(namespace);
      creatableTeams = await listCreatableTeams(user, namespace);
    } catch (err) {
      if (!isAdmin(user)) throw err;
    }
    return jsonResponse({
      namespace,
      secrets: visible.map((s) => toSummary(namespace, s)),
      canCreate,
      teams,
      creatableTeams,
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

    // Parse first: the target team determines both existence (400) and creation (403) checks.
    const body = createSecretSchema.parse(await readJson(req));

    // Unknown teams fail as bad requests when the policy defines teams.
    // Policy failures (503) surface from this read, same as the creation check.
    if (body.team) {
      const nsMap = await getNamespaceAccessMap();
      const nsRules = Object.hasOwn(nsMap, namespace) ? nsMap[namespace] : undefined;
      if (nsRules && nsRules.teams.length > 0 && !nsRules.teams.some((t) => t.name === body.team)) {
        throw new HttpError(400, `Unknown team "${body.team}" in "${namespace}"`);
      }
    }

    if (!(await canCreateInNamespace(user, namespace, body.team))) {
      auditLog({
        action: 'secret.create',
        user: user.email,
        namespace,
        result: 'deny',
      });
      throw new HttpError(
        403,
        body.team
          ? `You are not allowed to create secrets for team "${body.team}" in "${namespace}"`
          : `You are not allowed to create secrets in "${namespace}"`,
      );
    }

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
            team: body.team,
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
