'use client';

import { queryOptions, type QueryClient } from '@tanstack/react-query';
import { api } from './api-client';

export function namespaceQueryOptions() {
  return queryOptions({ queryKey: ['namespaces'] as const, queryFn: api.namespaces });
}

export function secretListQueryOptions(namespace: string) {
  return queryOptions({
    queryKey: ['secrets', namespace] as const,
    queryFn: () => api.listSecrets(namespace),
  });
}

export function secretQueryOptions(namespace: string, name: string) {
  return queryOptions({
    queryKey: ['secret', namespace, name] as const,
    queryFn: ({ signal }) => api.getSecret(namespace, name, signal),
  });
}

export function historyQueryOptions(namespace: string, name: string) {
  return queryOptions({
    queryKey: ['versions', namespace, name] as const,
    queryFn: ({ signal }) => api.listVersions(namespace, name, signal),
  });
}

/** Explicit recovery must bypass staleTime and await real data, not router.refresh. */
export async function reloadSecret(client: QueryClient, namespace: string, name: string) {
  const options = secretQueryOptions(namespace, name);
  await client.cancelQueries({ queryKey: options.queryKey, exact: true });
  return client.fetchQuery({ ...options, staleTime: 0, retry: false });
}

/** Destructive-operation recovery also refreshes the UID-scoped restore choices. */
export async function reloadSecretWithHistory(client: QueryClient, namespace: string, name: string) {
  const detail = await reloadSecret(client, namespace, name);
  const options = historyQueryOptions(namespace, name);
  await client.cancelQueries({ queryKey: options.queryKey, exact: true });
  await client.fetchQuery({ ...options, staleTime: 0, retry: false });
  void client.invalidateQueries({ queryKey: ['secrets', namespace] });
  return detail;
}

/** Cancel outstanding reads before removing values, including cached history. */
export async function removeSecretQueries(client: QueryClient, namespace: string, name: string) {
  const keys = [secretQueryOptions(namespace, name).queryKey, historyQueryOptions(namespace, name).queryKey];
  await Promise.all(keys.map((queryKey) => client.cancelQueries({ queryKey, exact: true })));
  for (const queryKey of keys) client.removeQueries({ queryKey, exact: true });
}
