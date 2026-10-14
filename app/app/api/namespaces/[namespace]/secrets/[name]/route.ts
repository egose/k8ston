import { getCoreApi, requestOptions } from '@/lib/k8s';
import { HttpError, isConflict, jsonError, jsonResponse, readJson, requireUser } from '@/lib/http';
import { assertNamespaceAllowed } from '@/lib/namespaces';
import { canCreateInNamespace, getNamespaceAccessMap, secretTeam } from '@/lib/authz';
import { loadAuthorizedLiveSecret } from '@/lib/secret-access';
import { assertExpectedResourceVersion, deleteLiveSecret } from '@/lib/secret-mutations';
import { buildLiveSecret, toDetail } from '@/lib/secrets';
import { createSnapshot } from '@/lib/snapshot-store';
import { auditLog, deleteSecretSchema, updateSecretSchema } from '@/lib/validation';

type Ctx = RouteContext<'/api/namespaces/[namespace]/secrets/[name]'>;

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { namespace, name } = await ctx.params;
    await assertNamespaceAllowed(namespace, user);

    const live = await loadAuthorizedLiveSecret('secret.read', user, namespace, name);
    return jsonResponse({ secret: toDetail(namespace, live) });
  } catch (err) {
    return jsonError(err);
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { namespace, name } = await ctx.params;
    await assertNamespaceAllowed(namespace, user);

    const input = updateSecretSchema.parse(await readJson(req));

    const core = getCoreApi();
    const live = await loadAuthorizedLiveSecret('secret.update', user, namespace, name);
    // Optimistic concurrency on resourceVersion (K8s-native versioning).
    if ((live.metadata?.resourceVersion ?? '') !== input.resourceVersion) {
      auditLog({
        action: 'secret.update',
        user: user.email,
        namespace,
        name,
        resourceVersion: live.metadata?.resourceVersion,
        result: 'error',
        detail: 'resourceVersion conflict',
      });
      throw new HttpError(409, 'This secret changed since you loaded it (resourceVersion mismatch). Reload and retry.');
    }

    // Team moves require creation rights in the target (assigned or unassigned),
    // so members cannot escalate secrets into teams they cannot create in.
    // Unknown teams fail as bad requests when the policy defines teams.
    const currentTeam = secretTeam(live) ?? '';
    if (input.team !== undefined && input.team !== currentTeam) {
      const target = input.team === '' ? undefined : input.team;
      if (target) {
        const nsMap = await getNamespaceAccessMap();
        const nsRules = Object.hasOwn(nsMap, namespace) ? nsMap[namespace] : undefined;
        if (nsRules && nsRules.teams.length > 0 && !nsRules.teams.some((t) => t.name === target)) {
          throw new HttpError(400, `Unknown team "${target}" in "${namespace}"`);
        }
      }
      if (!(await canCreateInNamespace(user, namespace, target))) {
        auditLog({
          action: 'secret.update',
          user: user.email,
          namespace,
          name,
          resourceVersion: live.metadata?.resourceVersion,
          result: 'deny',
          detail: target ? `team move to "${target}" denied` : 'team move to unassigned denied',
        });
        throw new HttpError(
          403,
          target
            ? `You are not allowed to move secrets to team "${target}" in "${namespace}"`
            : `You are not allowed to move secrets out of their team in "${namespace}"`,
        );
      }
    }

    // Validate the entire replacement before any history or mutation side effects.
    const next = buildLiveSecret({
      live,
      name,
      namespace,
      data: input.data,
      description: input.description,
      allowedGroups: input.allowedGroups,
      allowedUsers: input.allowedUsers,
      team: input.team,
      user,
    });
    await createSnapshot(namespace, live, user);
    try {
      const updated = await core.replaceNamespacedSecret({ namespace, name, body: next }, requestOptions(user));
      auditLog({
        action: 'secret.update',
        user: user.email,
        namespace,
        name,
        keys: Object.keys(next.data ?? {}),
        resourceVersion: updated.metadata?.resourceVersion,
        result: 'allow',
      });
      return jsonResponse({ secret: toDetail(namespace, updated) });
    } catch (err: unknown) {
      if (isConflict(err)) {
        throw new HttpError(409, 'Write conflict: the secret was modified concurrently. Reload and retry.');
      }
      throw err;
    }
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { namespace, name } = await ctx.params;
    await assertNamespaceAllowed(namespace, user);

    const params = new URL(req.url).searchParams;
    if (
      params.getAll('resourceVersion').length > 1 ||
      params.getAll('keepHistory').length > 1 ||
      (params.has('keepHistory') && !['true', 'false'].includes(params.get('keepHistory')!))
    ) {
      throw new HttpError(400, 'Provide one resourceVersion and, optionally, keepHistory=true or keepHistory=false.');
    }
    const input = deleteSecretSchema.parse({
      resourceVersion: params.get('resourceVersion'),
      keepHistory: params.has('keepHistory') ? params.get('keepHistory') === 'true' : undefined,
    });
    const live = await loadAuthorizedLiveSecret('secret.delete', user, namespace, name);
    assertExpectedResourceVersion(live, input.resourceVersion);
    const result = await deleteLiveSecret(namespace, live, user, input.keepHistory);
    auditLog({
      action: 'secret.delete',
      user: user.email,
      namespace,
      name,
      result: 'allow',
      resourceVersion: live.metadata?.resourceVersion,
      detail: `${result.status}; history=${result.history}`,
    });
    return jsonResponse(result, { status: result.status === 'pending' ? 202 : 200 });
  } catch (err) {
    return jsonError(err);
  }
}
