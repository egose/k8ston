import { expect, test } from '@playwright/test';
import { mockApi } from './helpers';

// These initial requests hit the offline production runtime, with no IdP or
// cluster configuration. UI hydration uses the suite's existing API fixtures.
test('classified callback errors reach the login banner without raw provider values', async ({ request, page }) => {
  const marker = 'synthetic-private-provider-value';
  const params = new URLSearchParams({
    error: 'synthetic-unknown-code'.repeat(10),
    error_description: marker,
    code: marker,
    state: marker,
  });
  const response = await request.get(`/api/auth/callback?${params}`, { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers()['cache-control']).toBe('no-store');
  const location = response.headers().location;
  expect(new URL(location).search).toBe('?auth=error&idp_error=provider_error');
  expect(location).not.toContain(marker);
  await mockApi(page, { loggedIn: false, authDisabled: false });
  await page.goto(location, { waitUntil: 'networkidle' });
  await expect(page.getByText(/SSO sign-in failed \(provider_error\)/)).toBeVisible();
  await expect(page.getByText(marker)).toHaveCount(0);
});

test('real offline API success, rejection, and logout redirects are explicitly no-store', async ({ request }) => {
  for (const [path, status] of [
    ['/api/config', 200],
    ['/api/auth/me', 401],
    ['/api/namespaces', 401],
    ['/api/namespaces/demo/secrets', 401],
    ['/api/auth/login', 501],
    ['/api/auth/logout', 307],
  ] as const) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(status);
    expect(response.headers()['cache-control'], path).toBe('no-store');
  }
});
