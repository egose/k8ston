'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { IconArrowLeft, IconPencil, IconRefresh, IconRocket, IconTrash } from '@tabler/icons-react';
import { Button } from '@egose/shadcn-theme/components/ui/button';
import { Badge } from '@egose/shadcn-theme/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@egose/shadcn-theme/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@egose/shadcn-theme/components/ui/dialog';
import { Alert } from '@egose/shadcn-theme/components/ui/alert';
import { api, ApiError } from '@/lib/api-client';
import { reloadSecretWithHistory, removeSecretQueries, secretQueryOptions } from '@/lib/secret-queries';
import type { DeleteSecretInput } from '@/lib/validation';
import { RevealValue } from './reveal-value';
import { VersionHistory } from './version-history';
import { SecretMutationError } from './secret-mutation-error';
import { ConsumerRestartFeedback } from './consumer-restart-feedback';
import { IMMUTABLE_EDIT_GUIDANCE, unsupportedSecretTypeReason } from '@/lib/secret-rules';

interface Props {
  namespace: string;
  name: string;
}

export function SecretDetail({ namespace, name }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [keepHistory, setKeepHistory] = useState(false);

  const { data, isLoading, error } = useQuery(secretQueryOptions(namespace, name));

  // Feature flag (K8STON_RESTART_ENABLED): shows the restart button + hint.
  // Defaults to false while loading — matches the server default.
  const { data: publicConfig } = useQuery({ queryKey: ['public-config'], queryFn: api.config });
  const restartEnabled = publicConfig?.restartEnabled ?? false;

  const del = useMutation({
    mutationFn: (input: DeleteSecretInput) => api.deleteSecret(namespace, name, input),
    onSuccess: async (result) => {
      setConfirmDelete(null);
      if (result.status === 'pending') {
        toast.info('Deletion requested; the secret is still present. Reload to check finalizers and progress.');
        void queryClient.invalidateQueries({ queryKey: ['secret', namespace, name] });
        void queryClient.invalidateQueries({ queryKey: ['versions', namespace, name] });
        void queryClient.invalidateQueries({ queryKey: ['secrets', namespace] });
        return;
      }
      await removeSecretQueries(queryClient, namespace, name);
      toast.success(`Secret "${name}" deletion confirmed`);
      void queryClient.invalidateQueries({ queryKey: ['secrets', namespace] });
      router.push(`/?ns=${encodeURIComponent(namespace)}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  async function reloadLatest() {
    await reloadSecretWithHistory(queryClient, namespace, name);
    del.reset();
    setConfirmDelete(null);
  }

  const reload = useMutation({ mutationFn: reloadLatest, onError: (err: Error) => toast.error(err.message) });

  const restart = useMutation({
    mutationFn: () => api.restartConsumers(namespace, name),
    onSuccess: (res) => {
      if (res.status === 'requested') toast.success(res.message);
      else if (res.status === 'partial') toast.warning(res.message);
      else if (res.status === 'failed') toast.error(res.message);
      else toast.info(res.message);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading secret…</p>;
  if (!data) {
    return (
      <div className="flex flex-col gap-3">
        <Alert variant="danger">
          <div>{error instanceof Error ? error.message : 'Failed to load secret'}</div>
        </Alert>
        <div>
          <Button variant="secondary" appearance="outline" size="sm" onClick={() => router.back()}>
            <IconArrowLeft size={14} /> Back
          </Button>
        </div>
      </div>
    );
  }

  const secret = data.secret;
  const readOnlyReason = unsupportedSecretTypeReason(secret.type);
  const deletionPending =
    !!secret.deletionTimestamp ||
    (del.data?.status === 'pending' && secret.resourceVersion === del.variables?.resourceVersion);
  const deletionReason = deletionPending
    ? 'Deletion is pending. The secret still exists; finalizers may need operator attention. Reload to check progress.'
    : undefined;
  const deleteConflict = del.error instanceof ApiError && del.error.status === 409;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" appearance="ghost" size="sm" onClick={() => router.back()}>
          <IconArrowLeft size={14} /> Back
        </Button>
        <div className="flex-1" />
        <Button
          variant="secondary"
          appearance="outline"
          size="sm"
          loading={reload.isPending}
          onClick={() => reload.mutate()}
        >
          <IconRefresh size={14} /> Reload
        </Button>
        {restartEnabled && (
          <Button
            variant="info"
            appearance="outline"
            size="sm"
            loading={restart.isPending}
            disabled={deletionPending || restart.isPending}
            onClick={() => restart.mutate()}
            title="Request pod-template rollouts for workloads referencing this secret"
          >
            <IconRocket size={14} /> Restart apps
          </Button>
        )}
        <Button
          variant="primary"
          appearance="outline"
          size="sm"
          disabled={readOnlyReason !== null || deletionPending}
          onClick={() => router.push(`/secrets/${namespace}/${name}/edit`)}
        >
          <IconPencil size={14} /> Edit
        </Button>
        <Button
          variant="danger"
          appearance="outline"
          size="sm"
          onClick={() => setConfirmDelete(secret.resourceVersion)}
        >
          <IconTrash size={14} /> Delete
        </Button>
      </div>

      {error && (
        <Alert variant="danger">
          <div>Reload failed: {error.message}. The displayed data may be stale.</div>
        </Alert>
      )}
      {deletionReason && (
        <Alert variant="warning">
          <div>{deletionReason}</div>
        </Alert>
      )}
      {del.error && confirmDelete === null && <SecretMutationError error={del.error} onReload={reloadLatest} />}
      {restart.isPending && (
        <p role="status" className="text-sm text-muted-foreground">
          Requesting consumer rollouts…
        </p>
      )}
      {restart.error && (
        <Alert variant="danger">
          <div>{restart.error.message}</div>
        </Alert>
      )}
      {restart.data && <ConsumerRestartFeedback result={restart.data} />}

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <span className="font-mono">{secret.name}</span>
            <Badge variant="secondary" size="sm">
              {secret.namespace}
            </Badge>
            <Badge variant="secondary" size="sm">
              {secret.type}
            </Badge>
            {secret.team ? (
              <Badge variant="secondary" size="sm">
                team: {secret.team}
              </Badge>
            ) : null}
            {secret.version > 0 && (
              <Badge variant="primary" appearance="outline" size="sm">
                v{secret.version}
              </Badge>
            )}
            {!secret.managedByK8ston && (
              <Badge variant="warning" size="sm">
                created outside K8ston
              </Badge>
            )}
            {secret.immutable && (
              <Badge variant="secondary" size="sm">
                Immutable
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          {secret.description && <p className="text-muted-foreground">{secret.description}</p>}
          <div className="grid gap-2 text-xs sm:grid-cols-2">
            <div>
              <span className="text-muted-foreground">created: </span>
              {secret.creationTimestamp ? new Date(secret.creationTimestamp).toLocaleString() : '—'}
            </div>
            <div>
              <span className="text-muted-foreground">allowed groups: </span>
              {secret.allowedGroups.length > 0
                ? secret.allowedGroups.join(', ')
                : `— (${secret.team ? `team "${secret.team}" or namespace` : 'namespace'} default)`}
            </div>
            <div>
              <span className="text-muted-foreground">allowed users: </span>
              {secret.allowedUsers.length > 0 ? secret.allowedUsers.join(', ') : '—'}
            </div>
          </div>
        </CardContent>
      </Card>

      {(readOnlyReason || secret.immutable) && (
        <Alert variant="info">
          <div>{readOnlyReason ?? IMMUTABLE_EDIT_GUIDANCE}</div>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            Data{' '}
            <Badge variant="secondary" size="sm">
              {secret.keyCount}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {secret.binaryKeys.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Binary values are shown as base64 to preserve their bytes. You can edit metadata or restore history; use
              Kubernetes tooling to change binary data.
            </p>
          )}
          {secret.keys.length === 0 && <p className="text-sm text-muted-foreground">This secret has no keys.</p>}
          {secret.keys.map((k) => (
            <div key={k} className="flex items-center gap-2">
              <code className="w-48 shrink-0 truncate font-mono text-xs font-medium">{k}</code>
              <div className="flex-1">
                <RevealValue
                  value={
                    Object.hasOwn(secret.binaryData, k)
                      ? secret.binaryData[k]
                      : Object.hasOwn(secret.data, k)
                        ? secret.data[k]
                        : ''
                  }
                  binary={secret.binaryKeys.includes(k)}
                  keyName={k}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {restartEnabled && (
        <Alert variant="info">
          <div className="text-xs">
            If your app still shows old values after editing, <strong>Restart apps</strong> requests rollouts for
            matching workloads. Check rollout progress, readiness, and credential uptake separately.
          </div>
        </Alert>
      )}

      <VersionHistory
        namespace={namespace}
        name={name}
        currentKeys={secret.keys}
        resourceVersion={secret.resourceVersion}
        restoreDisabledReason={
          deletionReason ?? readOnlyReason ?? (secret.immutable ? IMMUTABLE_EDIT_GUIDANCE : undefined)
        }
      />

      <Dialog open={confirmDelete !== null} onOpenChange={(open) => !open && !del.isPending && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {name}?</DialogTitle>
            <DialogDescription>
              Request deletion of &ldquo;{name}&rdquo;. UID-bound history is cleaned up first unless you keep it.
              Cleanup is not atomic: partial changes can remain after a failure, and finalizers can delay live deletion.
            </DialogDescription>
          </DialogHeader>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={keepHistory}
              disabled={del.isPending}
              onChange={(event) => setKeepHistory(event.target.checked)}
            />
            Keep history for operator recovery
          </label>
          {keepHistory && (
            <p className="text-xs text-muted-foreground">
              Kept copies require operator access and will not attach to a same-name replacement.
            </p>
          )}
          {del.error && <SecretMutationError error={del.error} onReload={reloadLatest} />}
          <DialogFooter>
            <Button
              variant="secondary"
              appearance="outline"
              disabled={del.isPending}
              onClick={() => setConfirmDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={del.isPending}
              disabled={deleteConflict || !confirmDelete}
              onClick={() => confirmDelete && del.mutate({ resourceVersion: confirmDelete, keepHistory })}
            >
              Request deletion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
