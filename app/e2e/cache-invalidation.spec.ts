import { expect, test, type Page } from '@playwright/test';
import type { SecretDetail as Detail } from '../lib/secrets';

/**
 * Post-mutation cache freshness: React Query staleTime is 15s and the edit
 * and detail views share the ['secret', ns, name] entry, so every mutation
 * must invalidate its queries — otherwise the user sees pre-write data until
 * a manual reload. These tests use mutable route state (unlike the static
 * fixtures in helpers.ts) and assert freshness WITHOUT clicking reload.
 */

const devUser = { sub: 'dev', email: 'dev@krypton.local', name: 'Local Developer', groups: ['krypton-admin'] };

const baseDetail = (): Detail => ({
  namespace: 'demo',
  name: 'app-config',
  type: 'Opaque',
  keys: ['DB_HOST'],
  keyCount: 1,
  description: 'original description',
  version: 1,
  resourceVersion: '100',
  creationTimestamp: '2026-09-01T10:00:00Z',
  allowedGroups: [],
  allowedUsers: [],
  team: '',
  managedByKrypton: true,
  immutable: false,
  binaryKeys: [],
  data: { DB_HOST: 'db.internal' },
  binaryData: {},
});

interface State {
  list: Array<Record<string, unknown>>;
  detail: Detail;
  versions: unknown[];
}

const summaryOf = (d: Detail) => ({
  namespace: d.namespace,
  name: d.name,
  type: d.type,
  keys: d.keys,
  keyCount: d.keyCount,
  description: d.description,
  version: d.version,
  resourceVersion: d.resourceVersion,
  creationTimestamp: d.creationTimestamp,
  allowedGroups: d.allowedGroups,
  allowedUsers: d.allowedUsers,
  team: d.team,
  managedByKrypton: d.managedByKrypton,
  immutable: d.immutable,
  binaryKeys: d.binaryKeys,
});

const freshState = (): State => {
  const detail = baseDetail();
  return { list: [summaryOf(detail)], detail, versions: [] };
};

async function mockMutable(page: Page, state: State) {
  await page.route('**/api/config', (r) =>
    r.fulfill({
      json: {
        scope: 'namespace',
        etcdEncrypted: false,
        authDisabled: true,
        oidcConfigured: false,
        historyLimit: 20,
        managedOnly: true,
        restartEnabled: true,
        appNamespace: 'krypton',
      },
    }),
  );
  await page.route('**/api/auth/me', (r) => r.fulfill({ json: { user: devUser } }));
  await page.route('**/api/namespaces', (r) => r.fulfill({ json: { scope: 'namespace', namespaces: ['demo'] } }));
  await page.route('**/api/namespaces/demo/secrets', async (r) => {
    const req = r.request();
    if (req.method() === 'GET') {
      return r.fulfill({ json: { namespace: 'demo', canCreate: true, secrets: state.list } });
    }
    if (req.method() === 'POST') {
      const body = req.postDataJSON() as { name: string; data: Record<string, string> };
      const created = {
        ...baseDetail(),
        name: body.name,
        keys: Object.keys(body.data),
        keyCount: Object.keys(body.data).length,
        data: body.data,
        resourceVersion: '200',
      };
      state.detail = created;
      state.list = [...state.list, summaryOf(created)];
      return r.fulfill({ json: { secret: summaryOf(created) } });
    }
    return r.continue();
  });
  // Versions live one segment deeper (`*` doesn't cross `/`, so this needs
  // its own route — otherwise the request hits the real backend, 401s, and
  // bounces the page to /login).
  await page.route('**/api/namespaces/demo/secrets/*/versions', (r) =>
    r.fulfill({ json: { namespace: 'demo', name: state.detail.name, versions: state.versions } }),
  );
  // Named-secret routes (GET/PUT/DELETE), keyed off live state.
  await page.route('**/api/namespaces/demo/secrets/*', async (r) => {
    const req = r.request();
    if (req.method() === 'GET') return r.fulfill({ json: { secret: state.detail } });
    if (req.method() === 'PUT') {
      const body = req.postDataJSON() as {
        data: Record<string, string>;
        description?: string;
        resourceVersion: string;
      };
      expect(body.resourceVersion).toBe(state.detail.resourceVersion);
      state.versions = [
        {
          version: state.detail.version,
          snapshotName: `${state.detail.name}-v${state.detail.version}`,
          snapshotAt: new Date().toISOString(),
          snapshotBy: 'dev@krypton.local',
          keys: state.detail.keys,
          data: state.detail.data,
          binaryData: state.detail.binaryData,
          binaryKeys: state.detail.binaryKeys,
        },
      ];
      state.detail = {
        ...state.detail,
        data: body.data,
        description: body.description ?? '',
        keys: Object.keys(body.data),
        keyCount: Object.keys(body.data).length,
        version: state.detail.version + 1,
        resourceVersion: '101',
      };
      state.list = state.list.map((s) => (s['name'] === state.detail.name ? summaryOf(state.detail) : s));
      return r.fulfill({ json: { secret: state.detail } });
    }
    if (req.method() === 'DELETE') {
      expect(new URL(req.url()).searchParams.get('resourceVersion')).toBe(state.detail.resourceVersion);
      state.list = state.list.filter((s) => s['name'] !== state.detail.name);
      return r.fulfill({
        json: {
          status: 'deleted',
          deleted: state.detail.name,
          name: state.detail.name,
          uid: 'synthetic-cache-uid',
          history: 'cleaned',
        },
      });
    }
    return r.continue();
  });
}

test('edit → detail shows the saved data without a manual reload', async ({ page }) => {
  await mockMutable(page, freshState());
  await page.goto('/secrets/demo/app-config/edit', { waitUntil: 'networkidle' });
  await expect(page.getByRole('button', { name: 'Save changes' })).toBeVisible();
  await page.getByPlaceholder('What is this used for?').fill('updated description');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.waitForURL('**/secrets/demo/app-config', { timeout: 30_000 });
  // Pre-fix this stays stale (the edit/detail views share one cache entry and
  // nothing refetches while mounted) — the 10s budget fails reliably.
  await expect(page.getByText('updated description')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('v2', { exact: true }).first()).toBeVisible();
});

test('delete → dashboard drops the row without a manual reload', async ({ page }) => {
  await mockMutable(page, freshState());
  // Populate the dashboard list cache first, then navigate client-side
  // (page.goto would wipe the QueryClient cache with a full reload).
  await page.goto('/?ns=demo', { waitUntil: 'networkidle' });
  await expect(page.getByText('Secrets in demo')).toBeVisible();
  await page.getByRole('link', { name: 'app-config' }).click();
  await page.waitForURL('**/secrets/demo/app-config', { timeout: 30_000 });
  await expect(page.getByText('Version history')).toBeVisible();
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'Request deletion' }).click();
  await page.waitForURL('**/?ns=demo', { timeout: 30_000 });
  // Scoped to the table: the "deleted" toast also names the secret.
  await expect(page.locator('table tbody tr', { hasText: 'app-config' })).toHaveCount(0);
  await expect(page.getByText('No secrets found')).toBeVisible();
});

test('create → dashboard lists the new secret without a manual reload', async ({ page }) => {
  await mockMutable(page, freshState());
  await page.goto('/secrets/demo/new', { waitUntil: 'networkidle' });
  await expect(page.getByRole('button', { name: 'Create secret' })).toBeVisible();
  await page.getByPlaceholder('database-credentials').fill('smoke-secret');
  await page.getByPlaceholder('KEY').first().fill('API_TOKEN');
  await page.getByPlaceholder('value').first().fill('tok-123');
  await page.getByRole('button', { name: 'Create secret' }).click();
  await page.waitForURL('**/secrets/demo/smoke-secret', { timeout: 30_000 });
  await expect(page.getByText('API_TOKEN').first()).toBeVisible({ timeout: 10_000 });
  // Header brand links home (plain `/`, namespace derived client-side);
  // the dashboard must refetch the invalidated list.
  await page.getByRole('link', { name: 'Krypton' }).click();
  await expect(page.getByText('Secrets in demo')).toBeVisible({ timeout: 10_000 });
  // The table row link (the toast + detail title also name the secret).
  await expect(page.getByRole('link', { name: 'smoke-secret' })).toBeVisible({ timeout: 10_000 });
});
