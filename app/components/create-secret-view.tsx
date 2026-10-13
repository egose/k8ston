'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { IconArrowLeft } from '@tabler/icons-react';
import { Button } from '@egose/shadcn-theme/components/ui/button';
import { Alert } from '@egose/shadcn-theme/components/ui/alert';
import { ApiError } from '@/lib/api-client';
import { secretListQueryOptions } from '@/lib/secret-queries';
import { SecretForm } from './secret-form';

/**
 * Guards the create form: when the namespace rules exclude the current user,
 * explain upfront instead of letting them fill the form and fail on submit.
 * (The POST endpoint still enforces this server-side; this is purely UX.)
 */
export function CreateSecretView({ namespace }: { namespace: string }) {
  const router = useRouter();
  // Shared with the dashboard — no extra fetch when navigating from there.
  const { data, isPending, isFetching, isSuccess, error, refetch } = useQuery(secretListQueryOptions(namespace));

  if (isPending)
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Checking create permission…
      </p>
    );
  return (
    <div className="flex flex-col gap-3">
      {isFetching && (
        <p role="status" className="text-sm text-muted-foreground">
          Checking create permission…
        </p>
      )}
      {(error || typeof data?.canCreate !== 'boolean') && (
        <Alert variant="danger" role="alert">
          <div className="flex flex-col gap-2 text-sm">
            <p>
              {error instanceof ApiError && error.status === 403
                ? 'You do not have permission to access this namespace.'
                : 'Create permission is unavailable.'}{' '}
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
                Retry create permission
              </Button>
            </div>
          </div>
        </Alert>
      )}
      {!error && data?.canCreate === false && (
        <>
          <Alert variant="warning" role="alert">
            <div>
              You are not allowed to create secrets in &ldquo;{namespace}&rdquo;. Contact your administrator if you need
              access.
            </div>
          </Alert>
          <div className="flex gap-2">
            <Button variant="secondary" appearance="outline" size="sm" onClick={() => router.back()}>
              <IconArrowLeft size={14} /> Back
            </Button>
            <Button
              variant="secondary"
              appearance="outline"
              size="sm"
              loading={isFetching}
              onClick={() => void refetch()}
            >
              Retry create permission
            </Button>
          </div>
        </>
      )}
      {/* A failed background check disables submission without discarding a draft. */}
      {data?.canCreate === true && (
        <SecretForm key={namespace} mode="create" namespace={namespace} canCreate={isSuccess && !isFetching} />
      )}
    </div>
  );
}
