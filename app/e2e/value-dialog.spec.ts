import { expect, test, type Page } from '@playwright/test';
import { mockApi } from './helpers';

/**
 * Regression coverage for the key-value dialog (components/value-dialog.tsx):
 * wide layout, live-highlighting editor, Shiki preview, XML/JSON/YAML
 * formatters, and inline diagnostics. Uses the mocked API like the rest of
 * the suite — no cluster or IdP needed.
 */

async function openEditDialog(page: Page, key: string, value: string) {
  await mockApi(page, { loggedIn: true });
  await page.goto('/secrets/demo/new', { waitUntil: 'networkidle' });
  await page.getByPlaceholder('KEY').first().fill(key);
  await page.getByPlaceholder('value').first().fill(value);
  await page.getByRole('button', { name: 'Expand value' }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.cm-content')).toBeVisible();
  return dialog;
}

test('edit dialog is wide with a full-width live-highlighting editor', async ({ page }) => {
  const dialog = await openEditDialog(page, 'config.json', '{"db": {"host": "x", "port": 5432}}');

  // sm:max-w-sm (384px) on the base DialogContent would fail this.
  const dbox = await dialog.boundingBox();
  expect(dbox!.width).toBeGreaterThan(600);

  const ebox = await dialog.locator('.cm-editor').boundingBox();
  expect(ebox!.width).toBeGreaterThan(dbox!.width * 0.8);
  expect(ebox!.height).toBeGreaterThan(300);

  // One styled span per syntax node (braces, key, number) — plain text would
  // render as bare text with no spans.
  const content = dialog.locator('.cm-content');
  await expect
    .poll(() => content.locator('.cm-line span[class]').count(), { timeout: 10000 })
    .toBeGreaterThanOrEqual(3);

  // Typing flows into draft state (stats line count updates).
  await expect(dialog.getByText('1 line')).toBeVisible();
  await content.click();
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await expect(dialog.getByText('2 lines')).toBeVisible();

  // Switching content type swaps the grammar without crashing.
  for (const lang of ['YAML', 'Markdown', 'XML', 'Text', 'JSON']) {
    await dialog.getByRole('combobox').click();
    await page.getByRole('option', { name: lang, exact: true }).click();
    await expect(content).toBeVisible();
  }

  // Preview tab renders Shiki output (spans with inline colors).
  await dialog.getByRole('tab', { name: 'Preview' }).click();
  const preview = dialog.getByTestId('value-preview');
  await expect(preview).toBeVisible();
  await expect(preview.locator('span[style]').first()).toBeVisible();
});

test('xml format button pretty-prints and invalid xml disables it', async ({ page }) => {
  const dialog = await openEditDialog(page, 'config.xml', '<root><child id="1">hi</child><empty/></root>');
  await expect(dialog.getByText('1 line')).toBeVisible();

  const format = dialog.getByRole('button', { name: 'Format', exact: true });
  await expect(format).toBeEnabled();
  await format.click();
  await expect(dialog.getByText('5 lines')).toBeVisible();
  const text = await dialog.locator('.cm-content').innerText();
  expect(text).toContain('<child id="1">hi</child>');
  expect(text).toContain('<empty/>');

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);

  await page.getByPlaceholder('value').first().fill('<root><unclosed>');
  await page.getByRole('button', { name: 'Expand value' }).first().click();
  await expect(dialog.locator('.cm-content')).toBeVisible();
  await expect(format).toBeDisabled();
  await expect(dialog.locator('p.text-destructive')).toBeVisible();
});

test('invalid json/yaml show inline diagnostics, text shows none', async ({ page }) => {
  const dialog = await openEditDialog(page, 'bad.json', '{"a": }');

  // Lint runs debounced — poll for the gutter marker.
  await expect.poll(() => dialog.locator('.cm-lint-marker-error').count(), { timeout: 10000 }).toBeGreaterThan(0);
  await expect(dialog.locator('p.text-destructive')).toBeVisible();

  await dialog.getByRole('combobox').click();
  await page.getByRole('option', { name: 'YAML', exact: true }).click();
  await dialog.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+a');
  // Type then delete the auto-closed bracket → genuinely unclosed flow seq.
  await page.keyboard.type('a: [1');
  await page.keyboard.press('Delete');
  await expect.poll(() => dialog.locator('.cm-lint-marker-error').count(), { timeout: 10000 }).toBeGreaterThan(0);

  await dialog.getByRole('combobox').click();
  await page.getByRole('option', { name: 'Text', exact: true }).click();
  await expect(dialog.locator('.cm-lint-marker-error')).toHaveCount(0);
});

test('markdown fences highlight supported langs and leave the rest plain', async ({ page }) => {
  const dialog = await openEditDialog(page, 'notes.md', '# x');
  const content = dialog.locator('.cm-content');
  await content.click();
  await page.keyboard.press('ControlOrMeta+a');
  // Balanced brackets/quotes are transparent to the editor's auto-closing.
  await page.keyboard.type(
    '# Title\n\n```json\n{"a": 1}\n```\n\n```cobol\nNOT-A-LANG 123.\n```\n\n```\nplain fence\n```\n',
  );

  await dialog.getByRole('tab', { name: 'Preview' }).click();
  const preview = dialog.getByTestId('value-preview');
  await expect(preview).toBeVisible();
  const shiki = preview.locator('pre.shiki');
  await expect(shiki).toHaveCount(1);
  await expect(shiki.locator('span[style]').first()).toBeVisible();
  await expect(preview.locator('pre:not(.shiki)')).toHaveCount(2);
  await expect(preview.getByText('NOT-A-LANG 123.')).toBeVisible();
});

test('view mode opens on the preview tab', async ({ page }) => {
  await mockApi(page, { loggedIn: true });
  await page.goto('/secrets/demo/app-config', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Expand value' }).first().click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('tab', { name: 'Preview' })).toHaveAttribute('aria-selected', 'true');
  await expect(dialog.getByTestId('value-preview')).toBeVisible();
});
