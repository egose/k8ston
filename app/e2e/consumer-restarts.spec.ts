import { expect, test } from '@playwright/test';
import type { RestartResult } from '../lib/consumers';
import { mockApi, restartResult } from './helpers';

const endpoint = '**/api/namespaces/demo/secrets/app-config/restart-consumers';
const secretPath = '/secrets/demo/app-config';
const forbidden = {
  code: 'forbidden' as const,
  httpStatus: 403,
  message:
    'Access denied. Check Kubernetes permissions for the effective identity and, when enabled, ServiceAccount impersonation permissions.',
};
const unavailable = {
  code: 'unavailable' as const,
  httpStatus: 503,
  message: 'Kubernetes is unavailable. Check resource state before retrying.',
};
const cases: Array<{ label: string; httpStatus: number; notification: string; result: RestartResult }> = [
  { label: 'acknowledged rollout', httpStatus: 200, notification: 'success', result: restartResult },
  {
    label: 'no targets',
    httpStatus: 200,
    notification: 'info',
    result: {
      ...restartResult,
      status: 'no_targets',
      matched: 0,
      requested: [],
      message: 'No matching workloads found. No rollout requested.',
    },
  },
  {
    label: 'mixed patch results',
    httpStatus: 207,
    notification: 'warning',
    result: {
      ...restartResult,
      status: 'partial',
      matched: 3,
      failures: [
        { kind: 'StatefulSet', name: 'database', ...forbidden },
        { kind: 'DaemonSet', name: 'agent', ...unavailable },
      ],
      message: 'Rollout requested for 1 of 3 matched workloads. 2 patch requests failed.',
    },
  },
  {
    label: 'all patches failed',
    httpStatus: 503,
    notification: 'error',
    result: {
      ...restartResult,
      status: 'failed',
      requested: [],
      failures: [{ kind: 'Deployment', name: 'api-server', ...forbidden }],
      message: 'No rollout requests were confirmed. 1 patch request failed.',
    },
  },
  {
    label: 'partial discovery with acknowledged rollout',
    httpStatus: 207,
    notification: 'warning',
    result: {
      ...restartResult,
      status: 'partial',
      discoveryFailures: [{ kind: 'StatefulSet', ...forbidden }],
      message:
        'Rollout requested for 1 of 1 matched workload. Discovery incomplete: 1 workload kind could not be listed.',
    },
  },
  {
    label: 'unknown inventory with no known matches',
    httpStatus: 503,
    notification: 'error',
    result: {
      ...restartResult,
      status: 'failed',
      matched: 0,
      requested: [],
      discoveryFailures: [{ kind: 'StatefulSet', ...forbidden }],
      message: 'No rollout requests were confirmed. Discovery incomplete: 1 workload kind could not be listed.',
    },
  },
  {
    label: 'all inventories unavailable',
    httpStatus: 503,
    notification: 'error',
    result: {
      ...restartResult,
      status: 'failed',
      matched: 0,
      requested: [],
      discoveryFailures: [
        { kind: 'Deployment', ...unavailable },
        { kind: 'StatefulSet', ...unavailable },
        { kind: 'DaemonSet', ...unavailable },
      ],
      message: 'No rollout requests were confirmed. Discovery incomplete: 3 workload kinds could not be listed.',
    },
  },
];

for (const { label, httpStatus, notification, result } of cases) {
  test(`${label} retains the typed response and shows truthful feedback`, async ({ page }) => {
    await mockApi(page, { loggedIn: true });
    let requests = 0;
    await page.route(endpoint, (route) => {
      expect(route.request().method()).toBe('POST');
      expect(route.request().postData()).toBeNull();
      requests++;
      return route.fulfill({
        status: httpStatus,
        json: result.status === 'failed' ? { ...result, error: result.message } : result,
      });
    });
    await page.goto(secretPath, { waitUntil: 'networkidle' });
    const response = page.waitForResponse((response) => response.url().endsWith('/restart-consumers'));
    await page.getByRole('button', { name: 'Restart apps' }).click();
    expect((await response).status()).toBe(httpStatus);
    const feedback = page.getByRole('region', { name: 'Consumer rollout result' });
    await expect(feedback).toContainText(result.message);
    await expect(feedback).toContainText('Rollout completion, readiness, and credential uptake are not verified.');
    await expect(page.locator(`[data-sonner-toast][data-type="${notification}"]`)).toContainText(result.message);
    expect(requests).toBe(1);
    if (result.requested.length > 0) {
      const requested = feedback.getByRole('list', { name: 'Rollout requested', exact: true });
      await expect(requested.getByRole('listitem')).toHaveCount(result.requested.length);
      for (const workload of result.requested)
        await expect(requested).toContainText(`${workload.kind}/${workload.name}`);
    } else await expect(feedback.getByRole('list', { name: 'Rollout requested', exact: true })).toHaveCount(0);
    for (const failure of result.failures) {
      const failed = feedback.getByRole('list', { name: 'Unconfirmed rollout requests' });
      await expect(failed).toContainText(`${failure.kind}/${failure.name}`);
      await expect(failed).toContainText(`HTTP ${failure.httpStatus}`);
      if (result.requested.length > 0)
        await expect(feedback.getByRole('list', { name: 'Rollout requested', exact: true })).not.toContainText(
          `${failure.kind}/${failure.name}`,
        );
    }
    for (const failure of result.discoveryFailures) {
      await expect(feedback.getByRole('list', { name: 'Workload discovery failures' })).toContainText(failure.kind);
      await expect(feedback).toContainText('Unknown inventory; no workloads of these kinds were patched');
    }
    if (result.status === 'failed' || result.status === 'partial') {
      await expect(feedback).toContainText('Retrying scans all kinds');
      await expect(feedback).not.toContainText('No matching workloads found');
      await expect(page.locator('[data-sonner-toast][data-type="success"]')).toHaveCount(0);
    }
    await expect(page.getByRole('button', { name: 'Restart apps' })).toBeEnabled();
    await expect(feedback).not.toContainText(/Restarted \d|rollout completed|workloads are healthy/i);
  });
}

test('waits for the response and blocks duplicate clicks before announcing a rollout', async ({ page }) => {
  await mockApi(page, { loggedIn: true });
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requests = 0;
  await page.route(endpoint, async (route) => {
    requests++;
    await gate;
    await route.fulfill({ json: restartResult });
  });
  await page.goto(secretPath, { waitUntil: 'networkidle' });
  // The shared Button replaces its accessible text with "Loading" while busy;
  // its explanatory title remains stable across both states.
  const button = page.getByTitle('Request pod-template rollouts for workloads referencing this secret');
  try {
    await button.click();
    await expect.poll(() => requests).toBe(1);
    await expect(button).toBeDisabled();
    await expect(page.getByRole('status').filter({ hasText: 'Requesting consumer rollouts' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Consumer rollout result' })).toHaveCount(0);
    await expect(page.locator('[data-sonner-toast][data-type="success"]')).toHaveCount(0);
  } finally {
    release();
  }
  await expect(page.getByRole('region', { name: 'Consumer rollout result' })).toContainText(
    'Rollout requested for 1 workload.',
  );
  await expect(button).toBeEnabled();
  expect(requests).toBe(1);
});

for (const [status, error] of [
  [403, 'Restarting apps is disabled on this deployment'],
  [403, 'You are not allowed to modify this secret'],
  [500, 'Request failed unexpectedly. Check service health and retry.'],
] as const) {
  test(`preflight rejection stays an error: ${error}`, async ({ page }) => {
    await mockApi(page, { loggedIn: true });
    await page.route(endpoint, (route) => route.fulfill({ status, json: { error } }));
    await page.goto(secretPath, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Restart apps' }).click();
    await expect(page.locator('[data-sonner-toast][data-type="error"]')).toContainText(error);
    await expect(page.getByRole('alert').filter({ hasText: error })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Consumer rollout result' })).toHaveCount(0);
    await expect(page.locator('[data-sonner-toast][data-type="success"]')).toHaveCount(0);
  });
}

test('expired app session redirects to login instead of reporting no targets', async ({ page }) => {
  await mockApi(page, { loggedIn: true });
  await page.goto(secretPath, { waitUntil: 'networkidle' });
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 401, json: { error: 'Authentication required' } }),
  );
  await page.route(endpoint, (route) => route.fulfill({ status: 401, json: { error: 'Authentication required' } }));
  await page.getByRole('button', { name: 'Restart apps' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('region', { name: 'Consumer rollout result' })).toHaveCount(0);
});
