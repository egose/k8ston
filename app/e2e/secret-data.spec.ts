import { expect, test, type Page } from '@playwright/test';
import type { SecretDetail, SecretVersion } from '../lib/secrets';
import { detail, mockApi, summary } from './helpers';

const base64 = 'AP+A/w==';
const binarySecret: SecretDetail = {
  ...detail,
  keys: ['__proto__', 'text'],
  keyCount: 2,
  data: { text: 'unchanged text' },
  binaryKeys: ['__proto__'],
  binaryData: { ['__proto__']: base64 },
};

async function mockData(page: Page, initial: SecretDetail, versions: SecretVersion[] = []) {
  await mockApi(page, { loggedIn: true });
  let current = structuredClone(initial);
  const writes: Array<{ method: string; body: Record<string, unknown> }> = [];
  await page.route('**/api/namespaces/demo/secrets', (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    const body = route.request().postDataJSON();
    writes.push({ method: 'POST', body });
    current = {
      ...detail,
      ...body,
      binaryKeys: [],
      binaryData: {},
      keys: Object.keys(body.data),
      keyCount: Object.keys(body.data).length,
    };
    return route.fulfill({
      status: 201,
      json: {
        secret: summary({ name: current.name, type: current.type, keys: current.keys, keyCount: current.keyCount }),
      },
    });
  });
  await page.route('**/api/namespaces/demo/secrets/*', (route) => {
    if (route.request().method() === 'PUT') {
      const body = route.request().postDataJSON();
      writes.push({ method: 'PUT', body });
      current = { ...current, ...body, resourceVersion: 'next-version', version: current.version + 1 };
    }
    return route.fulfill({ json: { secret: current } });
  });
  await page.route('**/api/namespaces/demo/secrets/*/versions', (route) =>
    route.fulfill({ json: { namespace: 'demo', name: current.name, versions } }),
  );
  return { writes };
}

function versionOf(secret: SecretDetail): SecretVersion {
  return {
    version: 1,
    snapshotName: 'app-config-v1',
    keys: secret.keys,
    data: secret.data,
    binaryKeys: secret.binaryKeys,
    binaryData: secret.binaryData,
  };
}

test('binary detail and history expose exact base64 on demand, without a lossy text preview', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await mockData(page, binarySecret, [versionOf(binarySecret)]);
  await page.goto('/secrets/demo/app-config', { waitUntil: 'networkidle' });
  await expect(page.getByText('Binary · base64', { exact: true })).toHaveCount(2);
  await expect(page.getByText(base64, { exact: true })).toHaveCount(0);
  await expect(page.getByText(/use Kubernetes tooling to change binary data/)).toBeVisible();
  for (const index of [0, 1]) {
    await page.getByRole('button', { name: 'Expand base64' }).nth(index).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading')).toHaveText('__proto__ — binary (base64)');
    await expect(dialog.getByLabel('Base64 value')).toHaveValue(base64);
    await expect(dialog.getByLabel('Base64 value')).toHaveAttribute('readonly', '');
    await expect(dialog.getByRole('tab', { name: 'Preview' })).toHaveCount(0);
    await dialog.getByRole('button', { name: 'Copy base64' }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(base64);
    await dialog.getByRole('button', { name: 'Close', exact: true }).first().click();
  }
});

test('binary editing locks all data and saves metadata without resubmitting text or base64', async ({ page }) => {
  const { writes } = await mockData(page, binarySecret);
  await page.goto('/secrets/demo/app-config/edit', { waitUntil: 'networkidle' });
  await expect(page.getByText(/Saving this form preserves all data byte-for-byte/)).toBeVisible();
  await expect(page.getByLabel('Value for text')).toHaveAttribute('readonly', '');
  await expect(page.getByRole('textbox', { name: /^Data key \d+/ })).toHaveCount(2);
  for (const input of await page.getByRole('textbox', { name: /^Data key \d+/ }).all())
    await expect(input).toHaveAttribute('readonly', '');
  await expect(page.getByRole('button', { name: 'Add entry' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Remove entry' })).toBeDisabled();
  await page.getByRole('button', { name: 'Expand base64' }).click();
  await expect(page.getByLabel('Base64 value')).toHaveValue(base64);
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).first().click();
  await page.getByLabel('Description', { exact: true }).fill('binary metadata updated');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.waitForURL('**/secrets/demo/app-config');
  expect(writes).toHaveLength(1);
  expect(writes[0].body).not.toHaveProperty('data');
  expect(writes[0].body).not.toHaveProperty('binaryData');
  expect(writes[0].body).toMatchObject({
    description: 'binary metadata updated',
    resourceVersion: binarySecret.resourceVersion,
  });
  await expect(page.getByText('binary metadata updated')).toBeVisible();
});

test('immutable Secrets allow metadata saves while key/value controls and data restores stay read-only', async ({
  page,
}) => {
  const immutable = { ...detail, immutable: true };
  const { writes } = await mockData(page, immutable, [versionOf(detail)]);
  await page.goto('/secrets/demo/app-config/edit', { waitUntil: 'networkidle' });
  await expect(page.getByText(/This secret is immutable/)).toBeVisible();
  await expect(page.getByRole('textbox', { name: /^Data key \d+/ })).toHaveCount(3);
  for (const input of await page.getByRole('textbox', { name: /^Data key \d+/ }).all())
    await expect(input).toHaveAttribute('readonly', '');
  await expect(page.getByRole('button', { name: 'Add entry' })).toBeDisabled();
  for (const button of await page.getByRole('button', { name: 'Remove entry' }).all())
    await expect(button).toBeDisabled();
  await expect(page.getByPlaceholder('DB_HOST=db.internal\nDB_PASSWORD=s3cret')).toBeDisabled();
  await page.getByRole('button', { name: 'Expand value' }).first().click();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true })).toHaveCount(0);
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).first().click();
  await page.getByLabel('Description', { exact: true }).fill('immutable metadata updated');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.waitForURL('**/secrets/demo/app-config');
  expect(writes).toHaveLength(1);
  expect(writes[0].body).not.toHaveProperty('data');
  await expect(page.getByText('Immutable', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Restore', exact: true })).toBeDisabled();
});

test('special own keys and Unicode round-trip through create and edit with a long custom type', async ({ page }) => {
  const { writes } = await mockData(page, detail);
  await page.goto('/secrets/demo/new', { waitUntil: 'networkidle' });
  await page.getByLabel('Name', { exact: true }).fill('special-keys');
  await page.getByLabel('Type', { exact: true }).click();
  await page.getByRole('option', { name: 'Custom…', exact: true }).click();
  const custom = `example.test/${'custom-type-'.repeat(8)}`;
  await page.getByLabel('Type', { exact: true }).fill(custom);
  const entries = [
    ['__proto__', 'café 🔐 �'],
    ['constructor', 'constructor text'],
    ['toString', ''],
  ];
  for (let index = 0; index < entries.length; index++) {
    if (index) await page.getByRole('button', { name: 'Add entry' }).click();
    await page.getByLabel(`Data key ${index + 1}`, { exact: true }).fill(entries[index][0]);
    await page.getByLabel(`Value for ${entries[index][0]}`, { exact: true }).fill(entries[index][1]);
  }
  await page.getByRole('button', { name: 'Create secret' }).click();
  await page.waitForURL('**/secrets/demo/special-keys');
  expect(writes[0].body).toMatchObject({ type: custom, data: Object.fromEntries(entries) });
  expect(Object.hasOwn(writes[0].body.data!, '__proto__')).toBe(true);
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.waitForURL('**/secrets/demo/special-keys/edit');
  // Next's Activity cache retains the previous create form hidden in the DOM.
  const editForm = page.locator('form:visible');
  await expect(editForm.getByLabel('Value for __proto__', { exact: true })).toHaveValue(entries[0][1]);
  await expect(editForm.getByLabel('Value for constructor', { exact: true })).toHaveValue(entries[1][1]);
  await expect(editForm.getByLabel('Value for toString', { exact: true })).toHaveValue('');
  await editForm.getByLabel('Value for __proto__', { exact: true }).fill('updated 🔐');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.waitForURL('**/secrets/demo/special-keys');
  expect(writes).toHaveLength(2);
  expect(writes[1].body.data).toEqual({ ...Object.fromEntries(entries), ['__proto__']: 'updated 🔐' });
  await page.getByRole('button', { name: 'Reveal value', exact: true }).first().click();
  await expect(page.getByText('updated 🔐', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.waitForURL('**/secrets/demo/special-keys/edit');
  await expect(page.locator('form:visible').getByLabel('Value for __proto__', { exact: true })).toHaveValue(
    'updated 🔐',
  );
});

test('binary special keys survive restore-driven refreshes of both detail and history caches', async ({ page }) => {
  await mockData(page, binarySecret, [versionOf(binarySecret)]);
  await page.goto('/secrets/demo/app-config', { waitUntil: 'networkidle' });
  await expect(page.getByRole('button', { name: 'Expand base64' })).toHaveCount(2);
  const latest = {
    ...binarySecret,
    binaryData: { ['__proto__']: '//4A' },
    version: 3,
    resourceVersion: 'restored-binary-rv',
  };
  await page.route('**/api/namespaces/demo/secrets/app-config', (route) => route.fulfill({ json: { secret: latest } }));
  await page.route('**/api/namespaces/demo/secrets/app-config/versions', (route) =>
    route.fulfill({
      json: { namespace: 'demo', name: 'app-config', versions: [versionOf(latest)] },
    }),
  );
  await page.route('**/api/namespaces/demo/secrets/app-config/restore', (route) => {
    expect(route.request().postDataJSON()).toEqual({ version: 1, resourceVersion: binarySecret.resourceVersion });
    return route.fulfill({ json: { secret: latest } });
  });
  await page.getByRole('button', { name: 'Restore', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Restore v1', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  for (const index of [0, 1]) {
    await page.getByRole('button', { name: 'Expand base64' }).nth(index).click();
    await expect(page.getByLabel('Base64 value')).toHaveValue('//4A');
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).first().click();
  }
});

test('real duplicate keys and invalid native keys stop submission without losing rows', async ({ page }) => {
  const { writes } = await mockData(page, detail);
  await page.goto('/secrets/demo/new', { waitUntil: 'networkidle' });
  await page.getByLabel('Name', { exact: true }).fill('invalid-data');
  await page.getByLabel('Data key 1', { exact: true }).fill('__proto__');
  await page.getByLabel('Value for __proto__', { exact: true }).fill('first');
  await page.getByRole('button', { name: 'Add entry' }).click();
  await page.getByLabel('Data key 2', { exact: true }).fill('__proto__');
  await page.getByRole('button', { name: 'Create secret' }).click();
  await expect(page.getByText('Duplicate key "__proto__"', { exact: true })).toBeVisible();
  await page.getByLabel('Data key 2', { exact: true }).fill('..invalid');
  await page.getByRole('button', { name: 'Create secret' }).click();
  await expect(page.getByText('Keys must not be "." or start with ".."', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Value for __proto__', { exact: true })).toHaveValue('first');
  expect(writes).toHaveLength(0);
});

test('native basic-auth accepts one present empty field rather than requiring both', async ({ page }) => {
  const { writes } = await mockData(page, detail);
  await page.goto('/secrets/demo/new', { waitUntil: 'networkidle' });
  await page.getByLabel('Name', { exact: true }).fill('basic-auth');
  await page.getByLabel('Type', { exact: true }).click();
  await page.getByRole('option', { name: 'kubernetes.io/basic-auth', exact: true }).click();
  await page.getByRole('button', { name: 'Remove entry' }).first().click();
  await expect(page.getByLabel('Data key 1', { exact: true })).toHaveValue('password');
  await page.getByRole('button', { name: 'Create secret' }).click();
  await page.waitForURL('**/secrets/demo/basic-auth');
  expect(writes[0].body).toMatchObject({ type: 'kubernetes.io/basic-auth', data: { password: '' } });
});

test('service-account token creation and editing explain the controller boundary', async ({ page }) => {
  const { writes } = await mockData(page, { ...detail, type: 'kubernetes.io/service-account-token' });
  await page.goto('/secrets/demo/new', { waitUntil: 'networkidle' });
  await page.getByLabel('Name', { exact: true }).fill('controller-token');
  await page.getByLabel('Type', { exact: true }).click();
  await page.getByRole('option', { name: 'Custom…', exact: true }).click();
  await page.getByLabel('Type', { exact: true }).fill('kubernetes.io/service-account-token');
  await page.getByRole('button', { name: 'Create secret' }).click();
  await expect(page.getByText(/Use the Kubernetes TokenRequest API/)).toBeVisible();
  expect(writes).toHaveLength(0);
  await page.goto('/secrets/demo/app-config/edit', { waitUntil: 'networkidle' });
  await expect(page.getByText(/Use the Kubernetes TokenRequest API/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  await expect(page.getByLabel('Description', { exact: true })).toBeDisabled();
});
