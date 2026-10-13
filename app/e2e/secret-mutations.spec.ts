import { expect, test, type Page } from '@playwright/test';
import type { DeleteSecretResult, SecretDetail, SecretVersion } from '../lib/secrets';
import type { DeleteSecretInput, RestoreSecretInput } from '../lib/validation';
import { detail, mockApi, summary } from './helpers';

const initial: SecretDetail = {
  ...detail,
  description: 'Initially loaded secret',
  resourceVersion: 'loaded/rv:17?x=1',
  version: 3,
};
const snapshots = (): SecretVersion[] =>
  [2, 1].map((version) => ({
    version,
    snapshotName: `synthetic-uid-history-v${version}`,
    keys: [`PRIOR_${version}`],
    data: { [`PRIOR_${version}`]: `synthetic-prior-${version}` },
    binaryData: {},
    binaryKeys: [],
  }));
const conflict = 'This secret changed since you loaded it (resourceVersion mismatch). Reload and retry.';
const secretPath = '/secrets/demo/app-config';

interface State {
  live: SecretDetail | null;
  uid: string;
  versions: SecretVersion[];
  retained: SecretVersion[];
  finalizers: boolean;
  cleanupFailures: number;
  loadFailure?: number;
  historyFailure?: number;
  beforeDelete?: () => Promise<void>;
  beforeRestore?: () => Promise<void>;
  deletes: DeleteSecretInput[];
  restores: RestoreSecretInput[];
  reads: number;
  historyReads: number;
}

/** Browser-only API model; native Kubernetes CAS is tested by the offline SDK suite. */
async function mockMutations(page: Page): Promise<State> {
  await mockApi(page, { loggedIn: true });
  const state: State = {
    live: structuredClone(initial),
    uid: 'initial-synthetic-uid',
    versions: snapshots(),
    retained: [],
    finalizers: false,
    cleanupFailures: 0,
    deletes: [],
    restores: [],
    reads: 0,
    historyReads: 0,
  };
  await page.route('**/api/namespaces/demo/secrets', (route) =>
    route.fulfill({
      json: {
        namespace: 'demo',
        canCreate: true,
        secrets: state.live
          ? [
              summary({
                resourceVersion: state.live.resourceVersion,
                version: state.live.version,
                description: state.live.description,
                keys: state.live.keys,
                keyCount: state.live.keyCount,
                deletionTimestamp: state.live.deletionTimestamp,
              }),
            ]
          : [],
      },
    }),
  );
  await page.route(/\/api\/namespaces\/demo\/secrets\/app-config(?:\?.*)?$/, async (route) => {
    if (route.request().method() === 'GET') {
      state.reads++;
      if (state.loadFailure)
        return route.fulfill({ status: state.loadFailure, json: { error: 'Latest live data unavailable' } });
      return state.live
        ? route.fulfill({ json: { secret: state.live } })
        : route.fulfill({ status: 404, json: { error: 'Secret not found' } });
    }
    expect(route.request().method()).toBe('DELETE');
    const query = new URL(route.request().url()).searchParams;
    const input: DeleteSecretInput = {
      resourceVersion: query.get('resourceVersion') ?? '',
      keepHistory: query.get('keepHistory') === 'true',
    };
    state.deletes.push(input);
    const before = state.beforeDelete;
    state.beforeDelete = undefined;
    await before?.();
    if (!state.live || input.resourceVersion !== state.live.resourceVersion)
      return route.fulfill({ status: 409, json: { error: conflict } });
    if (state.cleanupFailures > 0 && !input.keepHistory) {
      state.cleanupFailures--;
      state.versions = state.versions.slice(1);
      return route.fulfill({
        status: 503,
        json: {
          error:
            'History cleanup incomplete: 1/2 confirmed absent, 0 still present, 1 failed. Live deletion was not attempted; snapshot copies may remain. Reload and retry cleanup.',
        },
      });
    }
    if (input.keepHistory) state.retained = [...state.versions];
    else state.versions = [];
    const common = {
      name: 'app-config',
      uid: state.uid,
      history: input.keepHistory ? ('retained' as const) : ('cleaned' as const),
    };
    if (state.finalizers) {
      if (!state.live.deletionTimestamp)
        state.live = {
          ...state.live,
          resourceVersion: 'terminating-rv',
          deletionTimestamp: '2026-10-12T12:00:00.000Z',
        };
      const result: DeleteSecretResult = {
        ...common,
        status: 'pending',
        resourceVersion: state.live.resourceVersion,
        deletionTimestamp: state.live.deletionTimestamp,
      };
      return route.fulfill({ status: 202, json: result });
    }
    state.live = null;
    const result: DeleteSecretResult = { ...common, status: 'deleted', deleted: 'app-config' };
    return route.fulfill({ json: result });
  });
  await page.route('**/api/namespaces/demo/secrets/app-config/versions', (route) => {
    state.historyReads++;
    if (state.historyFailure)
      return route.fulfill({ status: state.historyFailure, json: { error: 'Latest history unavailable' } });
    if (!state.live) return route.fulfill({ status: 404, json: { error: 'Secret not found' } });
    return route.fulfill({ json: { namespace: 'demo', name: 'app-config', versions: state.versions } });
  });
  await page.route('**/api/namespaces/demo/secrets/app-config/restore', async (route) => {
    const input: RestoreSecretInput = route.request().postDataJSON();
    state.restores.push(input);
    const before = state.beforeRestore;
    state.beforeRestore = undefined;
    await before?.();
    if (!state.live || input.resourceVersion !== state.live.resourceVersion)
      return route.fulfill({ status: 409, json: { error: conflict } });
    const snapshot = state.versions.find((version) => version.version === input.version);
    if (!snapshot) return route.fulfill({ status: 404, json: { error: 'Snapshot not found' } });
    state.versions = [
      {
        version: state.live.version,
        snapshotName: `synthetic-uid-history-v${state.live.version}`,
        keys: state.live.keys,
        data: state.live.data,
        binaryKeys: state.live.binaryKeys,
        binaryData: state.live.binaryData,
      },
      ...state.versions,
    ];
    state.live = {
      ...state.live,
      version: state.live.version + 1,
      resourceVersion: `restored-rv-${state.restores.length}`,
      keys: snapshot.keys,
      keyCount: snapshot.keys.length,
      data: snapshot.data,
      binaryData: snapshot.binaryData,
      binaryKeys: snapshot.binaryKeys,
    };
    return route.fulfill({ json: { secret: state.live } });
  });
  return state;
}

async function openDelete(page: Page, keepHistory = false) {
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Keep history for operator recovery').setChecked(keepHistory);
  return dialog;
}
async function openRestore(page: Page) {
  await page.getByRole('button', { name: 'Restore', exact: true }).first().click();
  return page.getByRole('dialog');
}
function gate() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}

test('valid restore sends the loaded revision and the next delete uses the returned live revision', async ({
  page,
}) => {
  const state = await mockMutations(page);
  await page.goto(secretPath, { waitUntil: 'networkidle' });
  const restore = await openRestore(page);
  await restore.getByRole('button', { name: 'Restore v2', exact: true }).click();
  await expect(restore).toHaveCount(0);
  expect(state.restores).toEqual([{ version: 2, resourceVersion: initial.resourceVersion }]);
  await expect(page.getByText('v4', { exact: true }).first()).toBeVisible();
  const latest = state.live!.resourceVersion;
  const dialog = await openDelete(page);
  await dialog.getByRole('button', { name: 'Request deletion', exact: true }).click();
  await expect(page).toHaveURL(/\/\?ns=demo$/);
  expect(state.deletes).toEqual([{ resourceVersion: latest, keepHistory: false }]);
  await expect(page.getByText('No secrets found')).toBeVisible();
});

test('stale delete remains visible and Reload latest fetches fresh live/history data before retry', async ({
  page,
}) => {
  const state = await mockMutations(page);
  await page.goto(secretPath, { waitUntil: 'networkidle' });
  state.live = { ...state.live!, resourceVersion: 'colleague-rv', version: 4, description: 'Changed by a colleague' };
  const dialog = await openDelete(page);
  await dialog.getByRole('button', { name: 'Request deletion' }).click();
  await expect(dialog.getByRole('alert')).toContainText('resourceVersion mismatch');
  await expect(dialog.getByRole('button', { name: 'Request deletion' })).toBeDisabled();
  expect(state.deletes).toEqual([{ resourceVersion: initial.resourceVersion, keepHistory: false }]);
  expect(state.versions).toHaveLength(2);
  const reads = state.reads;
  const historyReads = state.historyReads;
  await dialog.getByRole('button', { name: 'Reload latest' }).click();
  await expect(dialog).toHaveCount(0);
  expect(state.reads).toBeGreaterThan(reads);
  expect(state.historyReads).toBeGreaterThan(historyReads);
  await expect(page.getByText('Changed by a colleague', { exact: true })).toBeVisible();
  const retry = await openDelete(page);
  await retry.getByRole('button', { name: 'Request deletion' }).click();
  await expect(page).toHaveURL(/\/\?ns=demo$/);
  expect(state.deletes[1].resourceVersion).toBe('colleague-rv');
});

test('stale restore and failed reload preserve the conflict; successful reload allows a fresh revision retry', async ({
  page,
}) => {
  const state = await mockMutations(page);
  await page.goto(secretPath, { waitUntil: 'networkidle' });
  state.live = {
    ...state.live!,
    resourceVersion: 'fresh-restore-rv',
    version: 4,
    description: 'Latest restore source',
  };
  const dialog = await openRestore(page);
  await dialog.getByRole('button', { name: 'Restore v2', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('resourceVersion mismatch');
  state.loadFailure = 503;
  await dialog.getByRole('button', { name: 'Reload latest' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Reload failed: Latest live data unavailable');
  await expect(dialog.getByRole('button', { name: 'Restore v2', exact: true })).toBeDisabled();
  expect(state.restores).toEqual([{ version: 2, resourceVersion: initial.resourceVersion }]);
  state.loadFailure = undefined;
  await dialog.getByRole('button', { name: 'Reload latest' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText('Latest restore source', { exact: true })).toBeVisible();
  const retry = await openRestore(page);
  await retry.getByRole('button', { name: 'Restore v2', exact: true }).click();
  await expect(retry).toHaveCount(0);
  expect(state.restores[1]).toEqual({ version: 2, resourceVersion: 'fresh-restore-rv' });
  await expect(page.getByText('v5', { exact: true }).first()).toBeVisible();
});

test('in-flight same-name replacement conflicts with delete and reload removes predecessor restore choices', async ({
  page,
}) => {
  const state = await mockMutations(page);
  await page.goto(secretPath, { waitUntil: 'networkidle' });
  const blocked = gate();
  state.beforeDelete = () => blocked.promise;
  const dialog = await openDelete(page);
  await dialog.getByRole('button', { name: 'Request deletion' }).click();
  await expect.poll(() => state.deletes.length).toBe(1);
  state.live = {
    ...initial,
    version: 1,
    resourceVersion: 'replacement-rv',
    description: 'Replacement under the same name',
  };
  state.uid = 'replacement-uid';
  state.versions = [];
  blocked.release();
  await expect(dialog.getByRole('alert')).toContainText('resourceVersion mismatch');
  await expect(page).toHaveURL(new RegExp(`${secretPath}$`));
  await dialog.getByRole('button', { name: 'Reload latest' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText('Replacement under the same name', { exact: true })).toBeVisible();
  await expect(page.getByText(/No previous versions yet/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Restore', exact: true })).toHaveCount(0);
  expect(state.live.resourceVersion).toBe('replacement-rv');
  expect(state.deletes).toHaveLength(1);
});

test('in-flight restore revision conflict preserves newer state and permission-denied reload keeps the failure visible', async ({
  page,
}) => {
  const state = await mockMutations(page);
  await page.goto(secretPath, { waitUntil: 'networkidle' });
  const blocked = gate();
  state.beforeRestore = () => blocked.promise;
  const dialog = await openRestore(page);
  await dialog.getByRole('button', { name: 'Restore v2', exact: true }).click();
  await expect.poll(() => state.restores.length).toBe(1);
  state.live = { ...initial, resourceVersion: 'revoked-acl-rv', description: 'New owner state' };
  state.loadFailure = 403;
  blocked.release();
  await expect(dialog.getByRole('alert')).toContainText('resourceVersion mismatch');
  await dialog.getByRole('button', { name: 'Reload latest' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Reload failed: Latest live data unavailable');
  await expect(dialog.getByRole('button', { name: 'Restore v2', exact: true })).toBeDisabled();
  expect(state.live.data).toEqual(initial.data);
  expect(state.restores).toHaveLength(1);
});

test('partial history cleanup leaves a retryable deletion error and only confirmed success navigates away', async ({
  page,
}) => {
  const state = await mockMutations(page);
  await page.goto('/?ns=demo', { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: 'app-config', exact: true }).click();
  await expect(page.getByText('Version history')).toBeVisible();
  state.cleanupFailures = 1;
  const dialog = await openDelete(page);
  await dialog.getByRole('button', { name: 'Request deletion' }).click();
  await expect(dialog.getByRole('alert')).toContainText('1/2 confirmed absent');
  await expect(dialog.getByRole('alert')).toContainText('Live deletion was not attempted');
  await expect(page).toHaveURL(new RegExp(`${secretPath}$`));
  expect(state.live?.resourceVersion).toBe(initial.resourceVersion);
  expect(state.versions).toHaveLength(1);
  await dialog.getByRole('button', { name: 'Request deletion' }).click();
  await expect(page).toHaveURL(/\/\?ns=demo$/);
  expect(state.deletes.map((input) => input.resourceVersion)).toEqual([
    initial.resourceVersion,
    initial.resourceVersion,
  ]);
  await expect(page.locator('table tbody tr', { hasText: 'app-config' })).toHaveCount(0);
  expect(state.versions).toHaveLength(0);
});

test('keepHistory uses the typed option, clears cached values, and a client-side return loads the new lifetime', async ({
  page,
}) => {
  const state = await mockMutations(page);
  await page.goto(secretPath, { waitUntil: 'networkidle' });
  await expect(page.getByText('PRIOR_2', { exact: true })).toBeVisible();
  const dialog = await openDelete(page, true);
  await expect(dialog.getByText(/will not attach to a same-name replacement/)).toBeVisible();
  await dialog.getByRole('button', { name: 'Request deletion' }).click();
  await expect(page).toHaveURL(/\/\?ns=demo$/);
  expect(state.deletes[0]).toEqual({ resourceVersion: initial.resourceVersion, keepHistory: true });
  expect(state.retained).toHaveLength(2);
  state.live = {
    ...initial,
    version: 1,
    resourceVersion: 'new-lifetime-rv',
    description: 'New lifetime loaded from API',
  };
  state.uid = 'new-lifetime-uid';
  state.versions = [];
  const reads = state.reads;
  // A full page.goto would discard QueryClient and miss stale in-memory values.
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`${secretPath}$`));
  await expect(page.getByText('New lifetime loaded from API', { exact: true })).toBeVisible();
  await expect(page.getByText('PRIOR_2', { exact: true })).toHaveCount(0);
  await expect(page.getByText(/No previous versions yet/)).toBeVisible();
  expect(state.reads).toBeGreaterThan(reads);
  expect(state.retained).toHaveLength(2);
});

for (const keepHistory of [false, true]) {
  test(`finalizer-pending deletion stays visible across reload and retries with the latest revision (keepHistory=${keepHistory})`, async ({
    page,
  }) => {
    const state = await mockMutations(page);
    state.finalizers = true;
    await page.goto(secretPath, { waitUntil: 'networkidle' });
    const dialog = await openDelete(page, keepHistory);
    await dialog.getByRole('button', { name: 'Request deletion' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page).toHaveURL(new RegExp(`${secretPath}$`));
    await expect(page.getByText(/Deletion is pending/).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit', exact: true })).toBeDisabled();
    await expect(page.getByText(/deletion confirmed|permanently deleted/i)).toHaveCount(0);
    if (keepHistory)
      for (const button of await page.getByRole('button', { name: 'Restore', exact: true }).all())
        await expect(button).toBeDisabled();
    else await expect(page.getByText(/No previous versions yet/)).toBeVisible();
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByText(/Deletion is pending/).first()).toBeVisible();
    const pendingRetry = await openDelete(page, keepHistory);
    await pendingRetry.getByRole('button', { name: 'Request deletion' }).click();
    await expect(pendingRetry).toHaveCount(0);
    expect(state.deletes[1].resourceVersion).toBe('terminating-rv');
    state.finalizers = false;
    state.live = {
      ...state.live!,
      resourceVersion: 'finalizer-repaired-rv',
      description: 'Finalizer metadata repaired',
    };
    await page.getByRole('button', { name: 'Reload', exact: true }).click();
    await expect(page.getByText('Finalizer metadata repaired', { exact: true })).toBeVisible();
    const retry = await openDelete(page, keepHistory);
    await retry.getByRole('button', { name: 'Request deletion' }).click();
    await expect(page).toHaveURL(/\/\?ns=demo$/);
    expect(state.deletes.at(-1)?.resourceVersion).toBe('finalizer-repaired-rv');
  });
}

test('conflict recovery waits for fresh history too and discards a vanished restore selection', async ({ page }) => {
  const state = await mockMutations(page);
  await page.goto(secretPath, { waitUntil: 'networkidle' });
  state.live = { ...initial, resourceVersion: 'fresh-rv', description: 'Fresh live data' };
  const dialog = await openRestore(page);
  await dialog.getByRole('button', { name: 'Restore v2', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('resourceVersion mismatch');
  state.historyFailure = 503;
  await dialog.getByRole('button', { name: 'Reload latest' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Reload failed: Latest history unavailable');
  await expect(dialog.getByRole('button', { name: 'Restore v2', exact: true })).toBeDisabled();
  state.historyFailure = undefined;
  state.versions = [];
  await dialog.getByRole('button', { name: 'Reload latest' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText('Fresh live data', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Restore', exact: true })).toHaveCount(0);
  expect(state.restores).toHaveLength(1);
});
