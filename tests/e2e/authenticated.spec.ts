import { test, expect } from '@playwright/test';

// Uses storageState set by tests/auth.setup.ts
test.use({ storageState: 'playwright/.auth/user.json' });

test.describe('Authenticated pages', () => {

  test('/en/document — upload area is visible', async ({ page }) => {
    await page.goto('/en/document', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).not.toContainText('Application error');
    // DocumentTranslationPage renders a file input or a drop zone
    await expect(
      page.locator('input[type="file"], [data-testid="upload-zone"], label[for]').first()
    ).toBeAttached({ timeout: 15_000 });
  });

  test('/en/document — sidebar is visible', async ({ page }) => {
    await page.goto('/en/document', { waitUntil: 'domcontentloaded' });
    // Sidebar renders navigation links in the main app layout
    await expect(
      page.locator('nav, aside, [data-testid="sidebar"]').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('/en/text — text input area is visible', async ({ page }) => {
    await page.goto('/en/text', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(
      page.locator('textarea, [contenteditable="true"]').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('/en/projects — heading is visible', async ({ page }) => {
    await page.goto('/en/projects', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10_000 });
  });

  test('/en/projects — shows project list or empty state', async ({ page }) => {
    await page.goto('/en/projects', { waitUntil: 'domcontentloaded' });
    // Either project cards or the empty state "+" icon renders
    await expect(
      page.locator('[class*="card"], [class*="Card"], svg').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('/en/profile — loads without error', async ({ page }) => {
    await page.goto('/en/profile', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.locator('h1, h2, [class*="profile"]').first()).toBeVisible({ timeout: 10_000 });
  });

  test('/en/help — content renders', async ({ page }) => {
    await page.goto('/en/help', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 });
  });

  test('/en/feedback — form is visible', async ({ page }) => {
    await page.goto('/en/feedback', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(
      page.locator('textarea, form, input').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('/en/passport — template area is visible', async ({ page }) => {
    await page.goto('/en/passport', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).not.toContainText('Application error');
    // PassportPage renders a template selector or upload area
    await expect(
      page.locator('button, select, [role="combobox"], input[type="file"]').first()
    ).toBeVisible({ timeout: 10_000 });
  });

});
