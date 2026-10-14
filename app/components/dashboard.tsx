'use client';

import { useId } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { IconPlus } from '@tabler/icons-react';
import { Button } from '@egose/shadcn-theme/components/ui/button';
import { Alert } from '@egose/shadcn-theme/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@egose/shadcn-theme/components/ui/card';
import { ApiError } from '@/lib/api-client';
import { namespaceQueryOptions, secretListQueryOptions } from '@/lib/secret-queries';
import { NamespaceSelector } from './namespace-selector';
import { SecretTable } from './secret-table';
import { ALL_TEAMS, NO_TEAM } from './team-selector';

export function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createHintId = useId();
  const nsQuery = useQuery(namespaceQueryOptions());

  // Derived state: URL param wins, otherwise first allowed namespace.
  // No useState/useEffect needed — the URL is the source of truth.
  const namespaces = nsQuery.data?.namespaces ?? [];
  const fromUrl = searchParams.get('ns');
  const namespace = fromUrl ?? namespaces[0] ?? '';
  const namespaceReady = nsQuery.isSuccess && namespaces.includes(namespace);

  const secretsQuery = useQuery({
    ...secretListQueryOptions(namespace),
    enabled: namespaceReady,
  });
  const teams = secretsQuery.data?.teams ?? [];
  const creatableTeams = secretsQuery.data?.creatableTeams ?? [];
  // Team filter is also URL-driven; unknown values fall back to all teams.
  const teamParam = searchParams.get('team') ?? ALL_TEAMS;
  const selectedTeam =
    teamParam === ALL_TEAMS || teamParam === NO_TEAM || teams.includes(teamParam) ? teamParam : ALL_TEAMS;
  // A cached allow hint cannot enable creation after either query fails. The
  // server still authorizes every POST; this is only an upfront usability hint.
  // Team members without unassigned rights can still create in their teams.
  const canCreate =
    namespaceReady &&
    !nsQuery.isFetching &&
    secretsQuery.isSuccess &&
    !secretsQuery.isFetching &&
    (secretsQuery.data.canCreate === true || creatableTeams.length > 0);
  const createHint =
    nsQuery.isPending || nsQuery.isFetching
      ? 'Loading namespaces before creation…'
      : nsQuery.isError
        ? 'Creation is unavailable until namespaces load successfully.'
        : !namespaceReady
          ? 'Choose an available namespace to create secrets.'
          : secretsQuery.isPending || secretsQuery.isFetching
            ? 'Checking create permission…'
            : secretsQuery.isError || typeof secretsQuery.data?.canCreate !== 'boolean'
              ? 'Create permission is unavailable. Retry loading secrets.'
              : !secretsQuery.data.canCreate && creatableTeams.length === 0
                ? 'You are not allowed to create secrets in this namespace.'
                : undefined;

  const pick = (ns: string) => {
    // Teams are per-namespace; switching namespaces clears the team filter.
    router.replace(`/?ns=${encodeURIComponent(ns)}`, { scroll: false });
  };
  const pickTeam = (team: string) => {
    const params = new URLSearchParams({ ns: namespace });
    if (team !== ALL_TEAMS) params.set('team', team);
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <NamespaceSelector
          value={namespaceReady ? namespace : ''}
          onChange={pick}
          namespaces={namespaces}
          disabled={!nsQuery.isSuccess || nsQuery.isFetching || namespaces.length === 0}
          placeholder={
            nsQuery.isPending
              ? 'Loading…'
              : nsQuery.isError
                ? 'Namespaces unavailable'
                : namespaces.length === 0
                  ? 'No namespaces available'
                  : 'Select namespace'
          }
        />
        <div className="flex-1" />
        {createHint && (
          <span id={createHintId} className="text-xs text-muted-foreground">
            {createHint}
          </span>
        )}
        <Button
          variant="primary"
          size="sm"
          disabled={!canCreate}
          aria-describedby={createHint ? createHintId : undefined}
          title={createHint}
          onClick={() => canCreate && router.push(`/secrets/${namespace}/new`)}
        >
          <IconPlus size={15} /> New secret
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Secrets{namespace ? ` in ${namespace}` : ''}</CardTitle>
        </CardHeader>
        <CardContent>
          {nsQuery.isPending ? (
            <p role="status" className="text-sm text-muted-foreground">
              Loading namespaces…
            </p>
          ) : nsQuery.isError ? (
            <Alert variant="danger" role="alert">
              <div className="flex flex-col gap-2 text-sm">
                <p>
                  {nsQuery.error instanceof ApiError && nsQuery.error.status === 403
                    ? 'You do not have permission to list namespaces.'
                    : 'Unable to load namespaces.'}{' '}
                  {nsQuery.error.message}
                </p>
                <div>
                  <Button
                    variant="secondary"
                    appearance="outline"
                    size="sm"
                    loading={nsQuery.isFetching}
                    onClick={() => void nsQuery.refetch()}
                  >
                    Retry namespaces
                  </Button>
                </div>
              </div>
            </Alert>
          ) : namespaces.length === 0 ? (
            <div className="flex flex-col items-start gap-2">
              <p className="text-sm text-muted-foreground">
                No namespaces are available. Contact your administrator to check namespace scope and access.
              </p>
              <Button
                variant="secondary"
                appearance="outline"
                size="sm"
                loading={nsQuery.isFetching}
                onClick={() => void nsQuery.refetch()}
              >
                Retry namespaces
              </Button>
            </div>
          ) : !namespaceReady ? (
            <p className="text-sm text-muted-foreground">
              The selected namespace is unavailable. Choose an available namespace.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {secretsQuery.isPending && (
                <p role="status" className="text-sm text-muted-foreground">
                  Loading secrets and create permission…
                </p>
              )}
              {secretsQuery.error && (
                <Alert variant="danger" role="alert">
                  <div className="flex flex-col gap-2 text-sm">
                    <p>
                      {secretsQuery.error instanceof ApiError && secretsQuery.error.status === 403
                        ? 'You do not have permission to list secrets in this namespace.'
                        : 'Unable to load secrets and create permission.'}{' '}
                      {secretsQuery.error.message}
                    </p>
                    <div>
                      <Button
                        variant="secondary"
                        appearance="outline"
                        size="sm"
                        loading={secretsQuery.isFetching}
                        onClick={() => void secretsQuery.refetch()}
                      >
                        Retry secrets
                      </Button>
                    </div>
                  </div>
                </Alert>
              )}
              {secretsQuery.isSuccess && (
                <>
                  {typeof secretsQuery.data.canCreate !== 'boolean' && (
                    <Alert variant="warning" role="alert">
                      <div className="flex flex-col gap-2 text-sm">
                        <p>The namespace response did not include create permission.</p>
                        <div>
                          <Button
                            variant="secondary"
                            appearance="outline"
                            size="sm"
                            loading={secretsQuery.isFetching}
                            onClick={() => void secretsQuery.refetch()}
                          >
                            Retry secrets
                          </Button>
                        </div>
                      </div>
                    </Alert>
                  )}
                  <SecretTable
                    namespace={namespace}
                    secrets={secretsQuery.data.secrets}
                    teams={teams}
                    selectedTeam={selectedTeam}
                    onTeamChange={pickTeam}
                  />
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
