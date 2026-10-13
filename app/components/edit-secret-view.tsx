'use client';

import { useQuery } from '@tanstack/react-query';
import { Alert } from '@egose/shadcn-theme/components/ui/alert';
import { Button } from '@egose/shadcn-theme/components/ui/button';
import { ApiError } from '@/lib/api-client';
import { secretQueryOptions } from '@/lib/secret-queries';
import { SecretForm } from './secret-form';

export function EditSecretView({ namespace, name }: { namespace: string; name: string }) {
  const { data, isPending, isFetching, error, refetch } = useQuery(secretQueryOptions(namespace, name));

  if (isPending)
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Loading secret…
      </p>
    );
  if (!data) {
    return (
      <Alert variant="danger" role="alert">
        <div className="flex flex-col gap-2 text-sm">
          <p>
            {error instanceof ApiError && error.status === 403
              ? 'You do not have permission to edit this secret.'
              : 'Unable to load secret.'}{' '}
            {error?.message}
          </p>
          <div>
            <Button
              variant="secondary"
              appearance="outline"
              size="sm"
              loading={isFetching}
              onClick={() => void refetch()}
            >
              Retry secret
            </Button>
          </div>
        </div>
      </Alert>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {error && (
        <Alert variant="danger" role="alert">
          <div>
            Latest secret data is unavailable: {error.message} Your draft is retained; use Reload latest to retry.
          </div>
        </Alert>
      )}
      {/* Activity and query refreshes retain the draft. Only identity changes remount it. */}
      <SecretForm key={`${namespace}/${name}`} mode="edit" namespace={namespace} initial={data.secret} />
    </div>
  );
}
