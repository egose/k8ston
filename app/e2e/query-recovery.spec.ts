import { expect, test, type Page } from '@playwright/test';
import type { SecretVersion } from '../lib/secrets';
import { mockApi, reconnectQueries, responseGate } from './helpers';

const previous = (version: number): SecretVersion => ({
  version,
  snapshotName: `synthetic-history-v${version}`,
  keys: [`PRIOR_${version}`],
  data: { [`PRIOR_${version}`]: `synthetic history ${version}` },
  binaryData: {},
  binaryKeys: [],
});

async function mockQueries(page: Page) {
  await mockApi(page, { loggedIn: true });
  const state = {
    namespaces: ['demo'],
    namespaceStatus: 200,
    listStatus: 200,
    historyStatus: 200,
    canCreate: true as boolean | undefined,
    versions: [previous(1)],
    namespaceReads: 0,
    listReads: 0,
    historyReads: 0,
    posts: 0,
    holdNamespaces: undefined as Promise<void> | undefined,
    holdList: undefined as Promise<void> | undefined,
    holdHistory: undefined as Promise<void> | undefined,
  };
  await page.route('**/api/namespaces', async (route) => {
    state.namespaceReads++;
    await state.holdNamespaces;
    if (state.namespaceStatus !== 200)
      return route.fulfill({ status: state.namespaceStatus, json: { error: 'Namespace discovery failed' } });
    return route.fulfill({ json: { scope: 'namespace', namespaces: state.namespaces } });
  });
  await page.route('**/api/namespaces/demo/secrets', async (route) => {
    if (route.request().method() === 'POST') {
      state.posts++;
      return route.fulfill({ status: 403, json: { error: 'Permission changed before creation' } });
    }
    state.listReads++;
    await state.holdList;
    if (state.listStatus !== 200)
      return route.fulfill({ status: state.listStatus, json: { error: 'Namespace secret list failed' } });
    return route.fulfill({
      json: {
        namespace: 'demo',
        secrets: [],
        ...(state.canCreate === undefined ? {} : { canCreate: state.canCreate }),
      },
    });
  });
  await page.route('**/api/namespaces/demo/secrets/app-config/versions', async (route) => {
    state.historyReads++;
    await state.holdHistory;
    if (state.historyStatus !== 200)
      return route.fulfill({ status: state.historyStatus, json: { error: 'History request failed' } });
    return route.fulfill({ json: { namespace: 'demo', name: 'app-config', versions: state.versions } });
  });
  return state;
}

for (const status of [503, 403]) {
  test(`namespace loading and ${status} failure disable creation; retry recovers and shares the list cache`, async ({
    page,
  }) => {
    const state = await mockQueries(page);
    const pending = responseGate();
    state.holdNamespaces = pending.promise;
    state.namespaceStatus = status;
    await page.goto('/?ns=demo');
    await expect(page.getByText('Loading namespaces…', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'New secret' })).toBeDisabled();
    await expect(page.getByRole('combobox', { name: 'Namespace', exact: true })).toBeDisabled();
    expect(state.listReads).toBe(0); // A URL namespace cannot bypass unknown namespace discovery.
    pending.release();
    await expect(
      page.getByRole('alert').filter({
        hasText: status === 403 ? 'You do not have permission to list namespaces.' : 'Unable to load namespaces.',
      }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'New secret' })).toBeDisabled();
    await expect(page.getByText(/No namespaces are available|No secrets found|Select a namespace\./)).toHaveCount(0);
    const reads = state.namespaceReads;
    state.namespaceStatus = 200;
    await page.getByRole('button', { name: 'Retry namespaces' }).click();
    await expect(page.getByRole('button', { name: 'New secret' })).toBeEnabled();
    expect(state.namespaceReads).toBeGreaterThan(reads);
    expect(state.listReads).toBe(1);
    await page.getByRole('button', { name: 'New secret' }).click();
    await expect(page.getByRole('form', { name: 'New secret', exact: true })).toBeVisible();
    expect(state.listReads).toBe(1); // Dashboard and create permission use the same query.
  });
}

test('a successful empty namespace list is distinct and retry can discover available namespaces', async ({ page }) => {
  const state = await mockQueries(page);
  state.namespaces = [];
  await page.goto('/?ns=demo');
  await expect(page.getByText(/No namespaces are available\. Contact your administrator/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'New secret' })).toBeDisabled();
  await expect(page.getByRole('combobox', { name: 'Namespace', exact: true })).toBeDisabled();
  await expect(page.getByRole('cell', { name: 'No secrets found in this namespace.', exact: true })).toHaveCount(0);
  expect(state.listReads).toBe(0);
  state.namespaces = ['demo'];
  await page.getByRole('button', { name: 'Retry namespaces' }).click();
  await expect(page.getByRole('button', { name: 'New secret' })).toBeEnabled();
  await expect(page.getByRole('cell', { name: 'No secrets found in this namespace.', exact: true })).toBeVisible();
});

test('an unavailable URL namespace cannot enable creation until an available namespace is selected', async ({
  page,
}) => {
  const state = await mockQueries(page);
  await page.goto('/?ns=unlisted');
  await expect(page.getByText('The selected namespace is unavailable. Choose an available namespace.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'New secret' })).toBeDisabled();
  expect(state.listReads).toBe(0);
  await page.getByRole('combobox', { name: 'Namespace', exact: true }).click();
  await page.getByRole('option', { name: 'demo', exact: true }).click();
  await expect(page.getByRole('button', { name: 'New secret' })).toBeEnabled();
  await expect(page).toHaveURL(/\?ns=demo$/);
});

test('loading, failed, and missing create hints stay disabled and retry must obtain an explicit allow', async ({
  page,
}) => {
  const state = await mockQueries(page);
  const pending = responseGate();
  state.holdList = pending.promise;
  state.listStatus = 503;
  await page.goto('/?ns=demo');
  await expect(page.getByText('Loading secrets and create permission…', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'New secret' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'New secret' })).toHaveAccessibleDescription(
    'Checking create permission…',
  );
  pending.release();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Unable to load secrets and create permission.' }),
  ).toBeVisible();
  await expect(page.getByRole('cell', { name: 'No secrets found in this namespace.', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'New secret' })).toBeDisabled();
  state.listStatus = 200;
  state.canCreate = undefined;
  const reads = state.listReads;
  await page.getByRole('button', { name: 'Retry secrets' }).click();
  await expect(page.getByText('The namespace response did not include create permission.')).toBeVisible();
  expect(state.listReads).toBeGreaterThan(reads);
  await expect(page.getByRole('button', { name: 'New secret' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'New secret' })).toHaveAccessibleDescription(
    'Create permission is unavailable. Retry loading secrets.',
  );
  state.canCreate = true;
  await page.getByRole('button', { name: 'Retry secrets' }).click();
  await expect(page.getByRole('button', { name: 'New secret' })).toBeEnabled();
  await expect(page.getByText('The namespace response did not include create permission.')).toHaveCount(0);
});

test('namespace permission errors and a successful denied-create hint are distinct from load failures', async ({
  page,
}) => {
  const state = await mockQueries(page);
  state.listStatus = 403;
  await page.goto('/?ns=demo');
  await expect(
    page.getByRole('alert').filter({ hasText: 'You do not have permission to list secrets in this namespace.' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'New secret' })).toBeDisabled();
  state.listStatus = 200;
  state.canCreate = false;
  await page.getByRole('button', { name: 'Retry secrets' }).click();
  await expect(
    page.getByText('You are not allowed to create secrets in this namespace.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'New secret' })).toBeDisabled();
  await expect(page.getByRole('cell', { name: 'No secrets found in this namespace.', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry secrets' })).toHaveCount(0);
});

for (const failedQuery of ['namespaces', 'secrets'] as const) {
  test(`a cached allow hint cannot enable creation after background ${failedQuery} failure`, async ({ page }) => {
    const state = await mockQueries(page);
    await page.goto('/?ns=demo');
    await expect(page.getByRole('button', { name: 'New secret' })).toBeEnabled();
    if (failedQuery === 'namespaces') state.namespaceStatus = 503;
    else state.listStatus = 503;
    await reconnectQueries(page);
    await expect(page.getByRole('button', { name: `Retry ${failedQuery}` })).toBeVisible();
    await expect(page.getByRole('button', { name: 'New secret' })).toBeDisabled();
    await expect(page.getByRole('cell', { name: 'No secrets found in this namespace.', exact: true })).toHaveCount(0);
    state.namespaceStatus = state.listStatus = 200;
    await page.getByRole('button', { name: `Retry ${failedQuery}` }).click();
    await expect(page.getByRole('button', { name: 'New secret' })).toBeEnabled();
  });
}

test('direct create retries unknown/failed/denied hints, retains drafts after background failure, and still handles server denial', async ({
  page,
}) => {
  const state = await mockQueries(page);
  const pending = responseGate();
  state.holdList = pending.promise;
  state.listStatus = 503;
  await page.goto('/secrets/demo/new');
  await expect(page.getByText('Checking create permission…', { exact: true })).toBeVisible();
  await expect(page.getByRole('form')).toHaveCount(0);
  pending.release();
  await expect(page.getByRole('alert').filter({ hasText: 'Create permission is unavailable.' })).toBeVisible();
  await expect(page.getByRole('form')).toHaveCount(0);
  state.listStatus = 200;
  state.canCreate = undefined;
  await page.getByRole('button', { name: 'Retry create permission' }).click();
  const permissionError = page.getByRole('alert').filter({ hasText: 'Create permission is unavailable.' });
  await expect(permissionError).toBeVisible();
  await expect(permissionError).not.toContainText('Namespace secret list failed');
  await expect(page.getByRole('form')).toHaveCount(0);
  state.canCreate = false;
  await page.getByRole('button', { name: 'Retry create permission' }).click();
  await expect(page.getByText(/You are not allowed to create secrets in/)).toBeVisible();
  await expect(page.getByRole('form')).toHaveCount(0);
  state.canCreate = true;
  await page.getByRole('button', { name: 'Retry create permission' }).click();
  const form = page.getByRole('form', { name: 'New secret', exact: true });
  await form.getByLabel('Name', { exact: true }).fill('retained-create');
  await form.getByLabel('Data key 1', { exact: true }).fill('DRAFT');
  await form.getByLabel('Value for DRAFT', { exact: true }).fill('retained value');
  state.listStatus = 503;
  await reconnectQueries(page);
  await expect(page.getByRole('button', { name: 'Retry create permission' })).toBeVisible();
  await expect(form.getByRole('button', { name: 'Create secret' })).toBeDisabled();
  await expect(form.getByLabel('Value for DRAFT', { exact: true })).toHaveValue('retained value');
  expect(state.posts).toBe(0);
  state.listStatus = 200;
  await page.getByRole('button', { name: 'Retry create permission' }).click();
  await expect(form.getByRole('button', { name: 'Create secret' })).toBeEnabled();
  await form.getByRole('button', { name: 'Create secret' }).click();
  await expect(page.getByText('Permission changed before creation', { exact: true })).toBeVisible();
  await expect(form.getByLabel('Name', { exact: true })).toHaveValue('retained-create');
  await expect(form.getByLabel('Value for DRAFT', { exact: true })).toHaveValue('retained value');
  expect(state.posts).toBe(1);
});

for (const status of [503, 403]) {
  test(`history loading and ${status} failure are never empty history; retry returns ${status === 403 ? 'a confirmed empty list' : 'versions'}`, async ({
    page,
  }) => {
    const state = await mockQueries(page);
    const pending = responseGate();
    state.holdHistory = pending.promise;
    state.historyStatus = status;
    await page.goto('/secrets/demo/app-config');
    const history = page.getByRole('region', { name: 'Version history', exact: true });
    await expect(history.getByText('Loading history…', { exact: true })).toBeVisible();
    await expect(history.getByText(/No previous versions yet/)).toHaveCount(0);
    await expect(history.getByRole('button', { name: 'Restore', exact: true })).toHaveCount(0);
    pending.release();
    await expect(history.getByRole('alert')).toContainText(
      status === 403 ? 'You do not have permission to view version history.' : 'Unable to load version history.',
    );
    await expect(history.getByText(/No previous versions yet/)).toHaveCount(0);
    state.historyStatus = 200;
    if (status === 403) state.versions = [];
    const reads = state.historyReads;
    await history.getByRole('button', { name: 'Retry history' }).click();
    await expect(history.getByRole('alert')).toHaveCount(0);
    expect(state.historyReads).toBeGreaterThan(reads);
    if (status === 403) await expect(history.getByText(/No previous versions yet/)).toBeVisible();
    else {
      await expect(history.getByRole('button', { name: 'Restore', exact: true })).toBeVisible();
      await expect(history.getByText('PRIOR_1', { exact: true })).toBeVisible();
    }
  });
}

test('failed background history refresh hides stale restore choices and retry installs fresh choices', async ({
  page,
}) => {
  const state = await mockQueries(page);
  await page.goto('/secrets/demo/app-config');
  const history = page.getByRole('region', { name: 'Version history', exact: true });
  await expect(history.getByText('PRIOR_1', { exact: true })).toBeVisible();
  state.historyStatus = 503;
  await reconnectQueries(page);
  await expect(history.getByRole('alert')).toContainText('Unable to load version history.');
  await expect(history.getByRole('button', { name: 'Restore', exact: true })).toHaveCount(0);
  await expect(history.getByText(/No previous versions yet/)).toHaveCount(0);
  state.historyStatus = 200;
  state.versions = [previous(2)];
  await history.getByRole('button', { name: 'Retry history' }).click();
  await expect(history.getByText('PRIOR_2', { exact: true })).toBeVisible();
  await expect(history.getByText('PRIOR_1', { exact: true })).toHaveCount(0);
  await expect(history.getByRole('button', { name: 'Restore', exact: true })).toBeEnabled();
});
