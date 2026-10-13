'use client';

import { useMutation } from '@tanstack/react-query';
import { Alert } from '@egose/shadcn-theme/components/ui/alert';
import { Button } from '@egose/shadcn-theme/components/ui/button';
import { ApiError } from '@/lib/api-client';

/** A failed reload keeps the operation error and confirmation visible. */
export function SecretMutationError({ error, onReload }: { error: Error; onReload: () => Promise<unknown> }) {
  const reload = useMutation({ mutationFn: onReload });
  return (
    <Alert variant="danger" role="alert">
      <div className="flex flex-col gap-2 text-sm">
        <p>{error.message}</p>
        {error instanceof ApiError && error.status === 409 && (
          <p>Reload the live secret and history, then review them before retrying.</p>
        )}
        {reload.error && <p>Reload failed: {reload.error.message}</p>}
        <div>
          <Button
            variant="secondary"
            appearance="outline"
            size="sm"
            loading={reload.isPending}
            onClick={() => reload.mutate()}
          >
            Reload latest
          </Button>
        </div>
      </div>
    </Alert>
  );
}
