import { expect, test, type Locator, type Page } from '@playwright/test';
import { detail, mockApi } from './helpers';

// The documented inclusive whole-preview limit, measured with String.length.
const previewLimit = 128 * 1024;
const largeValueNotice = 'Large value: showing raw text without rich preview. Raw and Copy keep the full value.';
const remote = 'https://preview.invalid';

test.beforeEach(async ({ context }) => {
  // Every resource/destination in these synthetic values is intercepted offline.
  await context.route(`${remote}/**`, (route) => route.abort());
});

async function mockValues(page: Page, data: Record<string, string>) {
  await mockApi(page, { loggedIn: true });
  const keys = Object.keys(data);
  await page.route('**/api/namespaces/demo/secrets/app-config', (route) =>
    route.fulfill({
      json: { secret: { ...detail, data, keys, keyCount: keys.length, binaryKeys: [], binaryData: {} } },
    }),
  );
  await page.route('**/api/namespaces/demo/secrets/app-config/versions', (route) =>
    route.fulfill({
      json: { namespace: 'demo', name: 'app-config', versions: [] },
    }),
  );
  await page.goto('/secrets/demo/app-config', { waitUntil: 'networkidle' });
}

async function openPreview(page: Page, index = 0) {
  await page.getByRole('button', { name: 'Expand value', exact: true }).nth(index).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('tab', { name: 'Preview' })).toHaveAttribute('aria-selected', 'true');
  await expect(dialog.getByTestId('value-preview')).toBeVisible();
  return dialog;
}

test('stored Markdown resources stay inert, original bytes copy, and safe links require activation', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const requests: Array<{ url: string; type: string; referrer: string | null }> = [];
  await context.route(`${remote}/**`, async (route) => {
    const request = route.request();
    requests.push({ url: request.url(), type: request.resourceType(), referrer: request.headers().referer ?? null });
    if (request.isNavigationRequest()) {
      await route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><title>Synthetic destination</title><p>Opened explicitly</p>',
      });
    } else {
      await route.abort();
    }
  });
  const script = "document.documentElement.dataset.previewExecuted='yes'";
  const value = [
    '# Local preview 🔐',
    '',
    `![Inline diagram](${remote}/inline.svg) ![Protocol-relative](//preview.invalid/protocol.svg)`,
    '',
    `![Reference diagram][diagram] ![](${remote}/title.svg "Title-only diagram") ![](${remote}/unnamed.svg)`,
    '',
    `[diagram]: ${remote}/reference.svg`,
    '',
    '![Inline data](data:image/svg+xml,%3Csvg%3E%3C/svg%3E)',
    '',
    `[![Linked diagram](${remote}/linked.svg)](${remote}/linked-guide)`,
    '',
    `[Open guide](${remote}/guide?synthetic=1#section)`,
    '',
    `[Blocked JS](javascript:${script}) [Mixed JS](JaVaScRiPt:${script}) [Encoded JS](javascript&#58;${script})`,
    '',
    `[Blocked data](data:text/html,%3Cscript%3E${script}%3C/script%3E)`,
    '',
    `<img src="${remote}/html.svg" onerror="${script}"><script>${script}</script><script src="${remote}/script.js"></script>`,
    '',
    `<iframe src="${remote}/frame"></iframe><video src="${remote}/video" poster="${remote}/poster.svg"></video><audio src="${remote}/audio"></audio>`,
    '',
    `<object data="${remote}/object"></object><embed src="${remote}/embed"><link rel="stylesheet" href="${remote}/style.css"><style>body{background:url(${remote}/background.svg)}</style>`,
    '',
    'Original bytes: \uFEFFcafé 🔐 & <literal>  ',
    '',
  ].join('\n');
  await mockValues(page, { 'notes.md': value });
  const dialog = await openPreview(page);
  const preview = dialog.getByTestId('value-preview');
  await expect(preview.getByRole('heading', { name: 'Local preview 🔐' })).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(requests).toEqual([]);
  await expect(
    preview.locator('img, picture, source, iframe, video, audio, object, embed, script, style, link'),
  ).toHaveCount(0);
  for (const description of [
    'Inline diagram',
    'Protocol-relative',
    'Reference diagram',
    'Title-only diagram',
    'Inline data',
    'Linked diagram',
  ]) {
    await expect(preview.getByText(`[Image not loaded: ${description}]`, { exact: true })).toBeVisible();
  }
  await expect(preview.getByText('[Image not loaded]', { exact: true })).toBeVisible();
  await expect(preview).toContainText(`<script>${script}</script>`);
  // Open guide + linked-image navigation + the GFM autolink of the bare URL
  // inside the inert <style> text. Blocked schemes below must not add links.
  await expect(preview.getByRole('link')).toHaveCount(3);
  for (const label of ['Blocked JS', 'Mixed JS', 'Encoded JS', 'Blocked data']) {
    await expect(preview.getByRole('link', { name: label, exact: true })).toHaveCount(0);
    await preview.getByText(label, { exact: true }).click();
  }
  expect(await page.evaluate(() => document.documentElement.dataset.previewExecuted)).toBeUndefined();
  expect(context.pages()).toHaveLength(1);

  await dialog.getByRole('button', { name: 'Copy value', exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(value);
  await dialog.getByRole('tab', { name: 'Raw', exact: true }).click();
  const raw = dialog.getByRole('textbox', { name: 'Secret value', exact: true });
  await expect(raw).toBeVisible();
  // Copy from the actual read-only editor, including content outside its viewport.
  await page.evaluate(() => navigator.clipboard.writeText('synthetic clipboard sentinel'));
  await raw.click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('ControlOrMeta+c');
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(value);
  await dialog.getByRole('tab', { name: 'Preview', exact: true }).click();

  const guide = preview.getByRole('link', { name: 'Open guide', exact: true });
  const linked = preview.getByRole('link', { name: '[Image not loaded: Linked diagram]', exact: true });
  // The bare style URL is autolinked by GFM; like explicit links it must stay
  // an unprefetched user-activated navigation with a clean opener/referrer.
  const styleAutolink = preview.getByRole('link', { name: /background\.svg/ });
  await expect(styleAutolink).toHaveCount(1);
  for (const link of [guide, linked, styleAutolink]) {
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await link.hover();
  }
  await page.waitForLoadState('networkidle');
  expect(requests).toEqual([]);
  for (const [link, url, keyboard] of [
    [guide, `${remote}/guide?synthetic=1`, true],
    [linked, `${remote}/linked-guide`, false],
  ] as const) {
    const [popup] = await Promise.all([page.waitForEvent('popup'), keyboard ? link.press('Enter') : link.click()]);
    await expect(popup.getByText('Opened explicitly', { exact: true })).toBeVisible();
    expect(await popup.evaluate(() => window.opener === null && document.referrer === '')).toBe(true);
    expect(requests.at(-1)).toEqual({ url, type: 'document', referrer: null });
    await popup.close();
  }
  // GFM keeps trailing punctuation on the autolinked style URL; only its
  // stable remote prefix is asserted here.
  {
    const [popup] = await Promise.all([page.waitForEvent('popup'), styleAutolink.click()]);
    await expect(popup.getByText('Opened explicitly', { exact: true })).toBeVisible();
    expect(await popup.evaluate(() => window.opener === null && document.referrer === '')).toBe(true);
    const last = requests[requests.length - 1];
    expect(last.type).toBe('document');
    expect(last.referrer).toBeNull();
    expect(last.url.startsWith(`${remote}/background.svg`)).toBe(true);
    await popup.close();
  }
  expect(requests).toHaveLength(3);
  expect(requests.filter((request) => request.type === 'image')).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.dataset.previewExecuted)).toBeUndefined();
});

async function domWork(preview: Locator) {
  // Descendants only: the preview root itself is excluded in both modes.
  return preview.evaluate((root) => {
    const counts = { elements: 0, textNodes: 0, otherNodes: 0 };
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ALL);
    while (walker.nextNode()) {
      if (walker.currentNode.nodeType === Node.ELEMENT_NODE) counts.elements++;
      else if (walker.currentNode.nodeType === Node.TEXT_NODE) counts.textNodes++;
      else counts.otherNodes++;
    }
    return {
      ...counts,
      listItems: root.querySelectorAll('li').length,
      highlightedBlocks: root.querySelectorAll('pre.shiki').length,
    };
  });
}

test('whole-document budget skips the Markdown tree and all short fences above the inclusive limit', async ({
  page,
}, testInfo) => {
  const item = `- **entry** \`value\` ${'synthetic text '.repeat(15)}end.\n`;
  const structure = `# Budget fixture\n\n${item.repeat(512)}\n${'```json\n{"enabled": true}\n```\n\n'.repeat(16)}`;
  const within = structure.padEnd(previewLimit, 'x');
  const oversized = `${within}x`;
  await mockValues(page, { 'within.md': within, 'oversized.md': oversized });

  let dialog = await openPreview(page);
  let preview = dialog.getByTestId('value-preview');
  await expect(dialog.getByText(largeValueNotice, { exact: true })).toHaveCount(0);
  await expect(preview.getByRole('heading', { name: 'Budget fixture' })).toBeVisible();
  await expect(preview.locator('li')).toHaveCount(512);
  await expect(preview.locator('pre.shiki')).toHaveCount(16);
  const withinWork = await domWork(preview);
  expect(withinWork.elements).toBeGreaterThan(1500);
  await dialog.getByRole('button', { name: 'Close', exact: true }).first().click();

  dialog = await openPreview(page, 1);
  preview = dialog.getByTestId('value-preview');
  await expect(dialog.getByText(largeValueNotice, { exact: true })).toBeVisible();
  expect(
    await preview.evaluate((root, original) => root.tagName === 'PRE' && root.textContent === original, oversized),
  ).toBe(true);
  const fallbackWork = await domWork(preview);
  expect(fallbackWork).toEqual({ elements: 0, textNodes: 1, otherNodes: 0, listItems: 0, highlightedBlocks: 0 });

  const measurement = {
    limitCodeUnits: previewLimit,
    withinBudget: { codeUnits: within.length, utf8Bytes: Buffer.byteLength(within), descendants: withinWork },
    fallback: { codeUnits: oversized.length, utf8Bytes: Buffer.byteLength(oversized), descendants: fallbackWork },
  };
  console.info('KRY-10 deterministic preview DOM work:', JSON.stringify(measurement));
  await testInfo.attach('preview-dom-work.json', {
    body: JSON.stringify(measurement, null, 2),
    contentType: 'application/json',
  });

  // A manual content-type override must not bypass the same whole-value guard.
  for (const label of ['JSON', 'YAML', 'XML', 'PEM', 'Text', 'Markdown']) {
    await dialog.getByRole('combobox').click();
    await page.getByRole('option', { name: label, exact: true }).click();
    await expect(dialog.getByText(largeValueNotice, { exact: true })).toBeVisible();
    await expect(preview.locator('*')).toHaveCount(0);
    expect(await preview.evaluate((root, original) => root.textContent === original, oversized)).toBe(true);
  }
});

for (const { key, label, value, highlighted } of [
  {
    key: 'config.json',
    label: 'JSON',
    value: '{\n  "text": "<script>synthetic</script>",\n  "enabled": true\n}\n',
    highlighted: true,
  },
  {
    key: 'config.yaml',
    label: 'YAML',
    value: `# Comment\ntext: "<img src=${remote}/yaml.svg>"\nenabled: true\n`,
    highlighted: true,
  },
  {
    key: 'config.xml',
    label: 'XML',
    value: '<root><item enabled="true">&lt;script&gt;synthetic&lt;/script&gt;</item></root>\n',
    highlighted: true,
  },
  {
    key: 'fixture.pem',
    label: 'PEM',
    value: '-----BEGIN SYNTHETIC DATA-----\nVGhpcyBpcyBub3QgYSBjZXJ0aWZpY2F0ZS4=\n-----END SYNTHETIC DATA-----\n',
    highlighted: false,
  },
]) {
  test(`ordinary ${label} preview retains its content and rendering`, async ({ page }) => {
    await mockValues(page, { [key]: value });
    const dialog = await openPreview(page);
    const preview = dialog.getByTestId('value-preview');
    await expect(dialog.getByText(`${label} (auto)`, { exact: true })).toBeVisible();
    await expect(dialog.getByText(largeValueNotice, { exact: true })).toHaveCount(0);
    await expect(preview.locator('pre.shiki')).toHaveCount(highlighted ? 1 : 0);
    if (highlighted) await expect(preview.locator('span[style]').first()).toBeVisible();
    expect(await preview.textContent()).toBe(value);
    await expect(preview.locator('script, img, iframe')).toHaveCount(0);
  });
}
