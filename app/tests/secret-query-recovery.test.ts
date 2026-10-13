import { QueryClient } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import type { SecretDetail } from '@/lib/secrets';

const clients: QueryClient[] = [];
function client() {
  const result = new QueryClient({
    defaultOptions: { queries: { staleTime: 15_000, gcTime: Infinity, retry: false, structuralSharing: false } },
  });
  clients.push(result);
  return result;
}
function detail(resourceVersion: string): { secret: SecretDetail } {
  return {
    secret: {
      namespace: 'unit-test',
      name: 'credentials',
      type: 'Opaque',
      resourceVersion,
      version: 2,
      description: resourceVersion,
      keys: ['__proto__'],
      keyCount: 1,
      allowedGroups: [],
      allowedUsers: [],
      immutable: false,
      managedByKrypton: true,
      binaryKeys: [],
      binaryData: {},
      data: { ['__proto__']: resourceVersion },
    },
  };
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
afterEach(() => {
  for (const queryClient of clients.splice(0)) queryClient.clear();
});

it('uses the typed revision contract for both client requests, including URL-encoded keepHistory deletion', async () => {
  const { api } = await import('@/lib/api-client');
  const fetch = vi.mocked(globalThis.fetch).mockResolvedValue(
    Response.json({
      status: 'pending',
      name: 'credentials',
      uid: 'synthetic',
      history: 'retained',
      resourceVersion: 'next',
    }),
  );
  const revision = 'opaque/rv?x=1&y=2';
  const deleted = await api.deleteSecret('unit-test', 'credentials', { resourceVersion: revision, keepHistory: true });
  expect(deleted.status).toBe('pending');
  const [path, init] = fetch.mock.calls[0];
  expect(new URL(String(path), 'https://unit.test').searchParams.get('resourceVersion')).toBe(revision);
  expect(new URL(String(path), 'https://unit.test').searchParams.get('keepHistory')).toBe('true');
  expect(init?.method).toBe('DELETE');
  fetch.mockResolvedValueOnce(Response.json(detail('restored-rv')));
  await api.restoreVersion('unit-test', 'credentials', { version: 1, resourceVersion: revision });
  expect(JSON.parse(fetch.mock.calls[1][1]?.body as string)).toEqual({ version: 1, resourceVersion: revision });
});

it('explicit reload bypasses fresh cached data and HTTP caching; failed reload preserves the previous data', async () => {
  const { reloadSecret, secretQueryOptions } = await import('@/lib/secret-queries');
  const queryClient = client();
  const options = secretQueryOptions('unit-test', 'credentials');
  queryClient.setQueryData(options.queryKey, detail('old-rv'));
  const fetch = vi
    .mocked(globalThis.fetch)
    .mockResolvedValueOnce(Response.json({ error: 'temporarily unavailable' }, { status: 503 }));
  await expect(reloadSecret(queryClient, 'unit-test', 'credentials')).rejects.toMatchObject({ status: 503 });
  expect(queryClient.getQueryData(options.queryKey)).toEqual(detail('old-rv'));
  expect(fetch).toHaveBeenCalledTimes(1);
  fetch.mockResolvedValueOnce(Response.json(detail('new-rv')));
  expect(await reloadSecret(queryClient, 'unit-test', 'credentials')).toEqual(detail('new-rv'));
  expect(queryClient.getQueryData(options.queryKey)).toEqual(detail('new-rv'));
  expect(fetch.mock.calls.every(([, init]) => init?.cache === 'no-store')).toBe(true);
});

it('conflict recovery cancels an older in-flight detail read and fetches fresh restore choices too', async () => {
  const { reloadSecretWithHistory, secretQueryOptions, historyQueryOptions } = await import('@/lib/secret-queries');
  const queryClient = client();
  const options = secretQueryOptions('unit-test', 'credentials');
  const historyOptions = historyQueryOptions('unit-test', 'credentials');
  queryClient.setQueryData(historyOptions.queryKey, { namespace: 'unit-test', name: 'credentials', versions: [] });
  const old = deferred<Response>();
  const fetch = vi
    .mocked(globalThis.fetch)
    .mockImplementationOnce(() => old.promise)
    .mockResolvedValueOnce(Response.json(detail('current-rv')))
    .mockResolvedValueOnce(Response.json({ namespace: 'unit-test', name: 'credentials', versions: [{ version: 3 }] }));
  const staleRead = queryClient.fetchQuery(options).catch(() => undefined);
  expect(await reloadSecretWithHistory(queryClient, 'unit-test', 'credentials')).toEqual(detail('current-rv'));
  expect((fetch.mock.calls[0][1]?.signal as AbortSignal).aborted).toBe(true);
  old.resolve(Response.json(detail('late-stale-rv')));
  await staleRead;
  expect(queryClient.getQueryData(options.queryKey)).toEqual(detail('current-rv'));
  expect(queryClient.getQueryData(historyOptions.queryKey)).toMatchObject({ versions: [{ version: 3 }] });
  expect(fetch).toHaveBeenCalledTimes(3);
});

it('confirmed deletion drops only the affected detail/history and late reads cannot resurrect old values over a replacement', async () => {
  const { removeSecretQueries, secretQueryOptions, historyQueryOptions } = await import('@/lib/secret-queries');
  const queryClient = client();
  const options = secretQueryOptions('unit-test', 'credentials');
  const historyOptions = historyQueryOptions('unit-test', 'credentials');
  queryClient.setQueryData(['secret', 'unit-test', 'other'], detail('other-rv'));
  queryClient.setQueryData(['versions', 'other-namespace', 'credentials'], { versions: ['other-history'] });
  const reads = [deferred<Response>(), deferred<Response>()];
  const fetch = vi
    .mocked(globalThis.fetch)
    .mockImplementationOnce(() => reads[0].promise)
    .mockImplementationOnce(() => reads[1].promise);
  const pending = [
    queryClient.fetchQuery(options).catch(() => undefined),
    queryClient.fetchQuery(historyOptions).catch(() => undefined),
  ];
  await removeSecretQueries(queryClient, 'unit-test', 'credentials');
  expect(queryClient.getQueryState(options.queryKey)).toBeUndefined();
  expect(queryClient.getQueryState(historyOptions.queryKey)).toBeUndefined();
  expect(fetch.mock.calls.every(([, init]) => init?.signal?.aborted)).toBe(true);
  queryClient.setQueryData(options.queryKey, detail('replacement-rv'));
  reads[0].resolve(Response.json(detail('old-rv')));
  reads[1].resolve(Response.json({ versions: ['old-history'] }));
  await Promise.all(pending);
  expect(queryClient.getQueryData(options.queryKey)).toEqual(detail('replacement-rv'));
  expect(queryClient.getQueryData(historyOptions.queryKey)).toBeUndefined();
  expect(queryClient.getQueryData(['secret', 'unit-test', 'other'])).toEqual(detail('other-rv'));
  expect(queryClient.getQueryData(['versions', 'other-namespace', 'credentials'])).toEqual({
    versions: ['other-history'],
  });
});
