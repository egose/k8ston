'use client';

import { useId, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { IconHistory, IconRotateClockwise } from '@tabler/icons-react';
import { Button } from '@egose/shadcn-theme/components/ui/button';
import { Alert } from '@egose/shadcn-theme/components/ui/alert';
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
import { api, ApiError } from '@/lib/api-client';
import { historyQueryOptions, reloadSecretWithHistory, secretQueryOptions } from '@/lib/secret-queries';
import type { SecretVersion } from '@/lib/secrets';
import type { RestoreSecretInput } from '@/lib/validation';
import { RevealValue } from './reveal-value';
import { SecretMutationError } from './secret-mutation-error';

interface Props {
  namespace: string;
  name: string;
  currentKeys: string[];
  resourceVersion: string;
  restoreDisabledReason?: string;
}

export function VersionHistory({ namespace, name, currentKeys, resourceVersion, restoreDisabledReason }: Props) {
  const queryClient = useQueryClient();
  const titleId = useId();
  const [confirm, setConfirm] = useState<{ snapshot: SecretVersion; resourceVersion: string } | null>(null);
  const { data, isPending, isFetching, isSuccess, error, refetch } = useQuery(historyQueryOptions(namespace, name));

  const restore = useMutation({
    mutationFn: (input: RestoreSecretInput) => api.restoreVersion(namespace, name, input),
    onSuccess: async (res) => {
      const queryKey = secretQueryOptions(namespace, name).queryKey;
      await queryClient.cancelQueries({ queryKey, exact: true });
      queryClient.setQueryData(queryKey, res);
      toast.success(`Rolled back — now at v${res.secret.version}`);
      void queryClient.invalidateQueries({ queryKey: ['versions', namespace, name] });
      void queryClient.invalidateQueries({ queryKey: ['secrets', namespace] });
      setConfirm(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  async function reloadLatest() {
    await reloadSecretWithHistory(queryClient, namespace, name);
    restore.reset();
    setConfirm(null);
  }

  const versions = data?.versions ?? [];
  const conflict = restore.error instanceof ApiError && restore.error.status === 409;

  return (
    <Card role="region" aria-labelledby={titleId}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconHistory size={18} /> <span id={titleId}>Version history</span>
          {isSuccess && (
            <Badge variant="secondary" size="sm">
              {versions.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {restore.error && !confirm && <SecretMutationError error={restore.error} onReload={reloadLatest} />}
        <p className="text-xs text-muted-foreground">
          A copy is saved before each accepted change. Restores preserve native data and lifecycle restrictions.
        </p>
        {restoreDisabledReason && <p className="text-xs text-muted-foreground">{restoreDisabledReason}</p>}
        {(isPending || isFetching) && (
          <p role="status" className="text-sm text-muted-foreground">
            {isPending ? 'Loading history…' : 'Refreshing history…'}
          </p>
        )}
        {error && (
          <Alert variant="danger" role="alert">
            <div className="flex flex-col gap-2 text-sm">
              <p>
                {error instanceof ApiError && error.status === 403
                  ? 'You do not have permission to view version history.'
                  : 'Unable to load version history.'}{' '}
                {error.message}
              </p>
              <div>
                <Button
                  variant="secondary"
                  appearance="outline"
                  size="sm"
                  loading={isFetching}
                  onClick={() => void refetch()}
                >
                  Retry history
                </Button>
              </div>
            </div>
          </Alert>
        )}
        {isSuccess && !isFetching && versions.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No previous versions yet. They&apos;ll appear here after the first edit.
          </p>
        )}
        {isSuccess &&
          versions.map((v) => {
            const added = v.keys.filter((k) => !currentKeys.includes(k));
            const removed = currentKeys.filter((k) => !v.keys.includes(k));
            return (
              <div key={v.snapshotName} className="rounded-md border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="primary" appearance="outline" size="sm">
                    v{v.version}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {v.snapshotAt ? new Date(v.snapshotAt).toLocaleString() : '—'}
                    {v.snapshotBy ? ` · by ${v.snapshotBy}` : ''}
                  </span>
                  <div className="flex-1" />
                  <Button
                    variant="warning"
                    appearance="outline"
                    size="sm"
                    disabled={!!restoreDisabledReason || restore.isPending}
                    onClick={() => setConfirm({ snapshot: v, resourceVersion })}
                  >
                    <IconRotateClockwise size={14} /> Restore
                  </Button>
                </div>
                {(added.length > 0 || removed.length > 0) && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {added.length > 0 && <>keys only in this version: {added.join(', ')} </>}
                    {removed.length > 0 && <>keys removed since: {removed.join(', ')}</>}
                  </p>
                )}
                <div className="mt-2 flex flex-col gap-1.5">
                  {v.keys.map((k) => (
                    <div key={k} className="flex items-center gap-2">
                      <code className="w-40 shrink-0 truncate font-mono text-xs font-medium">{k}</code>
                      <RevealValue
                        value={
                          Object.hasOwn(v.binaryData, k) ? v.binaryData[k] : Object.hasOwn(v.data, k) ? v.data[k] : ''
                        }
                        binary={v.binaryKeys.includes(k)}
                        keyName={k}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
      </CardContent>

      <Dialog open={confirm !== null} onOpenChange={(open) => !open && !restore.isPending && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore v{confirm?.snapshot.version}?</DialogTitle>
            <DialogDescription>
              Your current version will be saved first, so you can undo this restore. Some apps may need a restart to
              pick up the restored values.
            </DialogDescription>
          </DialogHeader>
          {restore.error && <SecretMutationError error={restore.error} onReload={reloadLatest} />}
          <DialogFooter>
            <Button
              variant="secondary"
              appearance="outline"
              disabled={restore.isPending}
              onClick={() => setConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              variant="warning"
              loading={restore.isPending}
              disabled={conflict || !!restoreDisabledReason || !isSuccess}
              onClick={() =>
                confirm &&
                restore.mutate({ version: confirm.snapshot.version, resourceVersion: confirm.resourceVersion })
              }
            >
              Restore v{confirm?.snapshot.version}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
