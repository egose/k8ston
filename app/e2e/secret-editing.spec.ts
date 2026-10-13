import { expect, test, type Locator, type Page } from '@playwright/test';
import type { SecretDetail, SecretVersion } from '../lib/secrets';
import type { CreateSecretInput, UpdateSecretInput } from '../lib/validation';
import { detail, mockApi, reconnectQueries, responseGate, summary } from './helpers';

const path = '/secrets/demo/app-config';
const initial: SecretDetail = {
  ...detail,
  description: 'Initial description',
  allowedGroups: ['original-group'],
  allowedUsers: ['original@example.test'],
  keys: ['ORIGINAL'],
  keyCount: 1,
  data: { ORIGINAL: 'original value' },
  resourceVersion: 'loaded/rv:1?x=1',
  version: 1,
};
const latest: SecretDetail = {
  ...initial,
  description: 'Colleague description',
  allowedGroups: ['new-group'],
  allowedUsers: ['new@example.test'],
  type: 'example.test/updated-type',
  keys: ['FRESH'],
  data: { FRESH: 'new source=value' },
  resourceVersion: 'external/rv:2?x=2',
  version: 2,
};

async function mockEditing(page: Page) {
  await mockApi(page, { loggedIn: true });
  const state = {
    live: structuredClone(initial),
    versions: [] as SecretVersion[],
    reads: 0,
    successfulWrites: 0,
    puts: [] as UpdateSecretInput[],
    creates: [] as CreateSecretInput[],
    readFailure: undefined as number | undefined,
    beforeRead: undefined as (() => Promise<void>) | undefined,
  };
  await page.route('**/api/namespaces/demo/secrets', (route) => {
    if (route.request().method() === 'POST') {
      const input: CreateSecretInput = route.request().postDataJSON();
      state.creates.push(input);
      state.live = {
        ...initial,
        ...input,
        resourceVersion: 'created-rv',
        keys: Object.keys(input.data),
        keyCount: Object.keys(input.data).length,
      };
      return route.fulfill({
        status: 201,
        json: { secret: summary({ name: input.name, resourceVersion: 'created-rv' }) },
      });
    }
    return route.fulfill({
      json: {
        namespace: 'demo',
        canCreate: true,
        secrets: [summary({ name: state.live.name, description: state.live.description })],
      },
    });
  });
  await page.route('**/api/namespaces/demo/secrets/*', async (route) => {
    if (route.request().method() === 'GET') {
      state.reads++;
      const before = state.beforeRead;
      state.beforeRead = undefined;
      await before?.();
      if (state.readFailure)
        return route.fulfill({ status: state.readFailure, json: { error: 'Latest live data unavailable' } });
      return route.fulfill({ json: { secret: state.live } });
    }
    expect(route.request().method()).toBe('PUT');
    const input: UpdateSecretInput = route.request().postDataJSON();
    state.puts.push(input);
    if (input.resourceVersion !== state.live.resourceVersion) {
      return route.fulfill({
        status: 409,
        json: { error: 'This secret changed since you loaded it (resourceVersion mismatch). Reload and retry.' },
      });
    }
    state.versions.unshift({
      version: state.live.version,
      snapshotName: `synthetic-history-v${state.live.version}`,
      keys: state.live.keys,
      data: state.live.data,
      binaryKeys: state.live.binaryKeys,
      binaryData: state.live.binaryData,
    });
    state.successfulWrites++;
    const data = input.data ?? state.live.data;
    state.live = {
      ...state.live,
      ...input,
      data,
      keys: [...Object.keys(data), ...state.live.binaryKeys],
      keyCount: Object.keys(data).length + state.live.binaryKeys.length,
      version: state.live.version + 1,
      resourceVersion: `saved-rv-${state.successfulWrites}`,
    };
    return route.fulfill({ json: { secret: state.live } });
  });
  await page.route('**/api/namespaces/demo/secrets/*/versions', (route) =>
    route.fulfill({
      json: { namespace: 'demo', name: state.live.name, versions: state.versions },
    }),
  );
  return state;
}

function editForm(page: Page) {
  return page.getByRole('form', { name: 'Edit app-config', exact: true });
}
function bulk(form: Locator) {
  return form.getByLabel('Bulk entries (KEY=value per line)', { exact: true });
}
function keys(form: Locator) {
  return form.getByRole('textbox', { name: /^Data key \d+/ });
}

async function enterDraft(form: Locator) {
  await form.getByLabel('Description', { exact: true }).fill('Unsaved description');
  await form.getByLabel(/^Allowed SSO groups/).fill('draft-group');
  await form.getByLabel(/^Allowed users/).fill('draft@example.test');
  await form.getByLabel('Data key 1', { exact: true }).fill('DRAFT_KEY');
  await form.getByLabel('Value for DRAFT_KEY', { exact: true }).fill('unsaved=value');
}

async function expectDraft(form: Locator) {
  await expect(form.getByLabel('Description', { exact: true })).toHaveValue('Unsaved description');
  await expect(form.getByLabel(/^Allowed SSO groups/)).toHaveValue('draft-group');
  await expect(form.getByLabel(/^Allowed users/)).toHaveValue('draft@example.test');
  await expect(keys(form)).toHaveCount(1);
  await expect(form.getByLabel('Data key 1', { exact: true })).toHaveValue('DRAFT_KEY');
  await expect(form.getByLabel('Value for DRAFT_KEY', { exact: true })).toHaveValue('unsaved=value');
  await expect(form.getByLabel('Type', { exact: true })).toHaveValue('Opaque');
}

test('an initial edit load failure has a working retry before exposing the form', async ({ page }) => {
  const state = await mockEditing(page);
  state.readFailure = 503;
  await page.goto(`${path}/edit`);
  await expect(page.getByRole('button', { name: 'Retry secret', exact: true })).toBeVisible();
  await expect(page.getByRole('form')).toHaveCount(0);
  state.readFailure = undefined;
  await page.getByRole('button', { name: 'Retry secret', exact: true }).click();
  await expect(editForm(page).getByLabel('Value for ORIGINAL', { exact: true })).toHaveValue('original value');
});

test('stale save → conflict → explicit fetch/reset → reviewed save uses the new revision', async ({ page }) => {
  const state = await mockEditing(page);
  await page.goto(`${path}/edit`);
  const form = editForm(page);
  await enterDraft(form);
  state.live = structuredClone(latest);
  await form.getByRole('button', { name: 'Save changes' }).click();
  await expect(form.getByText(/This secret changed since you loaded it/)).toBeVisible();
  expect(state.puts).toEqual([
    {
      data: { DRAFT_KEY: 'unsaved=value' },
      description: 'Unsaved description',
      allowedGroups: ['draft-group'],
      allowedUsers: ['draft@example.test'],
      resourceVersion: initial.resourceVersion,
    },
  ]);
  expect(state.successfulWrites).toBe(0);
  expect(state.live).toEqual(latest);
  await bulk(form).fill('PENDING=not imported');
  const reads = state.reads;
  const pending = responseGate();
  state.beforeRead = () => pending.promise;
  await form.getByRole('button', { name: 'Reload latest' }).click();
  await expect.poll(() => state.reads).toBe(reads + 1);
  await expectDraft(form);
  await expect(bulk(form)).toHaveValue('PENDING=not imported');
  await expect(form.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  pending.release();
  await expect(form.getByLabel('Description', { exact: true })).toHaveValue(latest.description);
  await expect(form.getByLabel(/^Allowed SSO groups/)).toHaveValue('new-group');
  await expect(form.getByLabel(/^Allowed users/)).toHaveValue('new@example.test');
  await expect(form.getByLabel('Type', { exact: true })).toHaveValue(latest.type);
  await expect(keys(form)).toHaveCount(1);
  await expect(form.getByLabel('Data key 1', { exact: true })).toHaveValue('FRESH');
  await expect(form.getByLabel('Value for FRESH', { exact: true })).toHaveValue('new source=value');
  await expect(bulk(form)).toHaveValue('');
  await expect(form.getByText(/This secret changed since you loaded it/)).toHaveCount(0);
  await form.getByLabel('Value for FRESH', { exact: true }).fill('reviewed=value');
  await form.getByRole('button', { name: 'Save changes' }).click();
  await expect(page).toHaveURL(new RegExp(`${path}$`));
  expect(state.puts[1]).toEqual({
    data: { FRESH: 'reviewed=value' },
    description: latest.description,
    allowedGroups: latest.allowedGroups,
    allowedUsers: latest.allowedUsers,
    resourceVersion: latest.resourceVersion,
  });
  expect(state.successfulWrites).toBe(1);
  await expect(page.getByText(latest.description, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(editForm(page).getByLabel('Value for FRESH', { exact: true })).toHaveValue('reviewed=value');
  await editForm(page).getByRole('button', { name: 'Save changes' }).click();
  await expect(page).toHaveURL(new RegExp(`${path}$`));
  expect(state.puts[2].resourceVersion).toBe('saved-rv-1');
});

for (const status of [503, 403]) {
  test(`failed explicit reload (${status}) retains every draft field, bulk text, and the original save revision`, async ({
    page,
  }) => {
    const state = await mockEditing(page);
    await page.goto(`${path}/edit`);
    const form = editForm(page);
    await enterDraft(form);
    await bulk(form).fill('PENDING=retained');
    state.live = structuredClone(latest);
    state.readFailure = status;
    const reads = state.reads;
    await form.getByRole('button', { name: 'Reload latest' }).click();
    await expect(form.getByText(/^Reload failed:/)).toContainText(
      'Your draft and its original revision are unchanged.',
    );
    expect(state.reads).toBe(reads + 1); // Explicit reload does not silently retry.
    await expectDraft(form);
    await expect(bulk(form)).toHaveValue('PENDING=retained');
    await bulk(form).fill('');
    await form.getByRole('button', { name: 'Save changes' }).click();
    await expect(form.getByText(/This secret changed since you loaded it/)).toBeVisible();
    expect(state.puts[0]).toMatchObject({
      resourceVersion: initial.resourceVersion,
      data: { DRAFT_KEY: 'unsaved=value' },
    });
    expect(state.successfulWrites).toBe(0);
    await expectDraft(form);
  });
}

test('background reconnect and Activity back/forward retain the draft AND its original revision', async ({ page }) => {
  const state = await mockEditing(page);
  await page.goto(path);
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  const form = editForm(page);
  await enterDraft(form);
  state.live = structuredClone(latest);
  const reads = state.reads;
  await reconnectQueries(page);
  await expect(form.getByText(/A newer revision is available/)).toBeVisible();
  expect(state.reads).toBeGreaterThan(reads);
  await expectDraft(form);
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`${path}$`));
  // This proves the shared query really changed, rather than only a GET being issued.
  await expect(page.getByText(latest.description, { exact: true })).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(new RegExp(`${path}/edit$`));
  await expectDraft(form);
  await form.getByRole('button', { name: 'Save changes' }).click();
  await expect(form.getByText(/This secret changed since you loaded it/)).toBeVisible();
  expect(state.puts[0]).toMatchObject({
    resourceVersion: initial.resourceVersion,
    description: 'Unsaved description',
    data: { DRAFT_KEY: 'unsaved=value' },
  });
  expect(state.live).toEqual(latest);
  expect(state.successfulWrites).toBe(0);
});

test('create → edit client navigation associates every active label with its own unique control', async ({ page }) => {
  const state = await mockEditing(page);
  await page.goto('/secrets/demo/new');
  const create = page.getByRole('form', { name: 'New secret', exact: true });
  await create.getByLabel('Name', { exact: true }).fill('navigation-secret');
  await create.getByLabel('Description', { exact: true }).fill('Created description');
  await create.getByLabel('Data key 1', { exact: true }).fill('ENTRY');
  await create.getByLabel('Value for ENTRY', { exact: true }).fill('created value');
  await create.getByRole('button', { name: 'Create secret' }).click();
  await expect(page).toHaveURL(/\/secrets\/demo\/navigation-secret$/);
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  const active = page.getByRole('form', { name: 'Edit navigation-secret', exact: true });
  await expect(active).toBeVisible();
  await expect(page.locator('form')).toHaveCount(2); // The completed create is still hidden by Activity.
  await expect(page.locator('form').filter({ visible: false }).getByLabel('Name', { exact: true })).toHaveValue('');
  const associations = await active.locator('label[for]').evaluateAll((labels) =>
    labels.map((node) => {
      const label = node as HTMLLabelElement;
      const control = label.control;
      return (
        !!control &&
        control.closest('form') === label.closest('form') &&
        [...document.querySelectorAll('[id]')].filter((element) => element.id === control.id).length === 1
      );
    }),
  );
  expect(associations.length).toBeGreaterThanOrEqual(8);
  expect(associations.every(Boolean)).toBe(true);
  await active
    .locator('label')
    .filter({ hasText: /^Description$/ })
    .click();
  await expect(active.getByRole('textbox', { name: 'Description', exact: true })).toBeFocused();
  await active.getByRole('textbox', { name: 'Description', exact: true }).fill('Edited via active label');
  await active.getByLabel(/^Allowed SSO groups/).fill('team-one, , team-two');
  await active.getByLabel(/^Allowed users/).fill('person@example.test');
  await active.getByRole('button', { name: 'Save changes' }).click();
  await expect(page).toHaveURL(/\/secrets\/demo\/navigation-secret$/);
  expect(state.puts[0]).toMatchObject({
    description: 'Edited via active label',
    allowedGroups: ['team-one', 'team-two'],
    allowedUsers: ['person@example.test'],
    resourceVersion: 'created-rv',
  });
});

test('typing and pasting keep bulk text until explicit import; saving cannot silently omit it', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const state = await mockEditing(page);
  await page.goto('/secrets/demo/new');
  const form = page.getByRole('form', { name: 'New secret', exact: true });
  await form.getByLabel('Name', { exact: true }).fill('bulk-secret');
  await bulk(form).pressSequentially('TYPED=');
  await expect(bulk(form)).toHaveValue('TYPED=');
  await expect(keys(form)).toHaveCount(1);
  await expect(keys(form)).toHaveValue('');
  await bulk(form).pressSequentially('alpha=beta');
  await form.getByRole('button', { name: 'Create secret' }).click();
  await expect(form.getByText('Import or clear the bulk draft before saving.')).toBeVisible();
  expect(state.creates).toHaveLength(0);
  await form.getByRole('button', { name: 'Import entries' }).click();
  await expect(bulk(form)).toHaveValue('');
  await expect(form.getByLabel('Value for TYPED', { exact: true })).toHaveValue('alpha=beta');
  const pasted = '  __proto__ = café 🔐=one==  \r\nconstructor=\r\ntoString=pasted\r\n';
  await page.evaluate((text) => navigator.clipboard.writeText(text), pasted);
  await bulk(form).focus();
  await bulk(form).press('Control+V');
  await expect(bulk(form)).toHaveValue(pasted.replaceAll('\r\n', '\n'));
  await expect(keys(form)).toHaveCount(1);
  await form.getByRole('button', { name: 'Import entries' }).click();
  await expect(keys(form)).toHaveCount(4);
  await expect(form.getByLabel('Value for __proto__', { exact: true })).toHaveValue(' café 🔐=one==  ');
  await expect(form.getByLabel('Value for constructor', { exact: true })).toHaveValue('');
  await expect(bulk(form)).toHaveValue('');
  await form.getByRole('button', { name: 'Create secret' }).click();
  await expect(page).toHaveURL(/\/secrets\/demo\/bulk-secret$/);
  expect(state.creates[0].data).toEqual({
    TYPED: 'alpha=beta',
    ['__proto__']: ' café 🔐=one==  ',
    constructor: '',
    toString: 'pasted',
  });
  expect(Object.hasOwn(state.creates[0].data, '__proto__')).toBe(true);
});

for (const [source, message] of [
  ['VALID=new\nunfinished', 'Line 2 must use KEY=value.'],
  ['VALID=new\nBAD KEY=value', 'Line 2: Keys must be 1–253 characters'],
  ['VALID=new\nVALID=duplicate', 'Line 2: duplicate key "VALID"'],
  ['VALID=new\nEXISTING=overwrite', 'Line 2: duplicate key "EXISTING"'],
  ['VALID=new\n=value-only', 'Line 2 needs a key before "=".'],
]) {
  test(`bulk validation is atomic and preserves the import draft: ${message}`, async ({ page }) => {
    const state = await mockEditing(page);
    await page.goto('/secrets/demo/new');
    const form = page.getByRole('form', { name: 'New secret', exact: true });
    await form.getByLabel('Data key 1', { exact: true }).fill('EXISTING');
    await form.getByLabel('Value for EXISTING', { exact: true }).fill('kept value');
    await bulk(form).fill(source);
    await form.getByRole('button', { name: 'Import entries' }).click();
    await expect(form.getByText(message, { exact: false })).toBeVisible();
    await expect(bulk(form)).toHaveAttribute('aria-invalid', 'true');
    await expect(bulk(form)).toHaveValue(source);
    await expect(keys(form)).toHaveCount(1);
    await expect(keys(form)).toHaveValue('EXISTING');
    await expect(form.getByLabel('Value for EXISTING', { exact: true })).toHaveValue('kept value');
    expect(state.creates).toHaveLength(0);
    await bulk(form).fill('VALID=repaired');
    await form.getByRole('button', { name: 'Import entries' }).click();
    await expect(keys(form)).toHaveCount(2);
    await expect(form.getByLabel('Value for VALID', { exact: true })).toHaveValue('repaired');
    await expect(form.getByLabel('Value for EXISTING', { exact: true })).toHaveValue('kept value');
  });
}

test('a value without a key is rejected on import AND submit rather than being dropped', async ({ page }) => {
  const state = await mockEditing(page);
  await page.goto('/secrets/demo/new');
  const form = page.getByRole('form', { name: 'New secret', exact: true });
  await form.getByLabel('Name', { exact: true }).fill('orphan-entry');
  await form.getByLabel('Value for entry 1', { exact: true }).fill('orphan value');
  await bulk(form).fill('VALID=imported');
  await form.getByRole('button', { name: 'Import entries' }).click();
  await expect(form.getByText(/Existing entries: Entry 1 has a value but no key/)).toBeVisible();
  await expect(keys(form)).toHaveCount(1);
  await expect(bulk(form)).toHaveValue('VALID=imported');
  await bulk(form).fill('');
  await form.getByRole('button', { name: 'Create secret' }).click();
  await expect(
    form.getByText('Entry 1 has a value but no key. Add a key or remove the entry.', { exact: true }),
  ).toBeVisible();
  await expect(form.getByLabel('Value for entry 1', { exact: true })).toHaveValue('orphan value');
  expect(state.creates).toHaveLength(0);
  await form.getByLabel('Data key 1', { exact: true }).fill('RECOVERED');
  await form.getByRole('button', { name: 'Create secret' }).click();
  await expect(page).toHaveURL(/\/secrets\/demo\/orphan-entry$/);
  expect(state.creates[0].data).toEqual({ RECOVERED: 'orphan value' });
});
