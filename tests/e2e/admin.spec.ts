import { test, expect, type Page } from '@playwright/test';

// The tab bar is plain <button>s (no role="tab"), inside <main>; the sidebar has its own links.
const tabButton = (page: Page, name: string) =>
  page.getByRole('main').getByRole('button', { name, exact: true });

// Uses storageState set by tests/admin.setup.ts, which is skipped (and writes no
// state file) when the admin credentials are not provided.
test.skip(
  !process.env.TEST_ADMIN_PHONE || !process.env.TEST_ADMIN_PASSWORD,
  'TEST_ADMIN_PHONE and TEST_ADMIN_PASSWORD env vars are not set',
);

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('Old admin login address', () => {
  // A signed-in admin goes straight to the console, so look at it signed out.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('goes to the normal sign-in, with the console to come back to', async ({ page }) => {
    await page.goto('/en/admin/login', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/en\/sign-in\?next=%2Fadmin/, { timeout: 20_000 });
    await expect(page.locator('input[name="identifier"]')).toBeVisible({ timeout: 20_000 });
  });
});

test.describe('Admin dashboard', () => {

  test('/en/admin — loads without redirect', async ({ page }) => {
    await page.goto('/en/admin', { waitUntil: 'domcontentloaded' });
    await expect(page).not.toHaveURL(/\/admin\/login/);
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('/en/admin — dashboard content is visible', async ({ page }) => {
    await page.goto('/en/admin', { waitUntil: 'domcontentloaded' });
    // AdminTabsWrapper renders a bar of plain buttons: Users, Referrals, Blog
    await expect(tabButton(page, 'Users')).toBeVisible({ timeout: 10_000 });
  });

  test('/en/admin — Users tab is present', async ({ page }) => {
    await page.goto('/en/admin', { waitUntil: 'domcontentloaded' });
    await expect(tabButton(page, 'Users')).toBeVisible({ timeout: 10_000 });
  });

  test('/en/admin — Referrals tab is present', async ({ page }) => {
    await page.goto('/en/admin', { waitUntil: 'domcontentloaded' });
    await expect(tabButton(page, 'Referrals')).toBeVisible({ timeout: 10_000 });
  });

});

test.describe('Admin blog management', () => {

  test('/en/admin/blog — loads without redirect to login', async ({ page }) => {
    await page.goto('/en/admin/blog', { waitUntil: 'domcontentloaded' });
    await expect(page).not.toHaveURL(/\/admin\/login/);
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('/en/admin/blog — table or list is visible', async ({ page }) => {
    await page.goto('/en/admin/blog', { waitUntil: 'domcontentloaded' });
    await expect(
      page.locator('table, [role="table"], [class*="table"]').first()
    ).toBeVisible({ timeout: 10_000 });
  });

});

test.describe('Admin passport templates', () => {

  test('/en/admin/passport-templates — loads without redirect', async ({ page }) => {
    await page.goto('/en/admin/passport-templates', { waitUntil: 'domcontentloaded' });
    await expect(page).not.toHaveURL(/\/admin\/login/);
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('/en/admin/passport-templates — list is visible', async ({ page }) => {
    await page.goto('/en/admin/passport-templates', { waitUntil: 'domcontentloaded' });
    await expect(
      page.locator('table, [role="table"], [class*="table"], [class*="grid"]').first()
    ).toBeVisible({ timeout: 10_000 });
  });

});
