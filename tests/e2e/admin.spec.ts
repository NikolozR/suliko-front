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

test.describe('Admin login page (UI only)', () => {
  // A signed-in admin is redirected away from the login page, so look at it signed out.
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/en/admin/login', { waitUntil: 'domcontentloaded' });
  });

  test('SULIKO brand heading is visible', async ({ page }) => {
    // The admin layout's sidebar shows the brand too, and so does the <title>.
    await expect(page.getByRole('main').getByText('SULIKO', { exact: true })).toBeVisible({ timeout: 8_000 });
  });

  test('Admin Access label is visible', async ({ page }) => {
    await expect(page.getByText('Admin Access')).toBeVisible();
  });

  test('phone input is visible', async ({ page }) => {
    await expect(page.locator('input[placeholder="5XX XXX XXX"]')).toBeVisible();
  });

  test('password input is visible', async ({ page }) => {
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('Enter Panel button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Enter Panel/i })).toBeVisible();
  });

  test('wrong credentials show error message', async ({ page }) => {
    await page.locator('input[placeholder="5XX XXX XXX"]').fill('000000000');
    await page.locator('input[type="password"]').fill('wrongpass');
    await page.getByRole('button', { name: /Enter Panel/i }).click();
    // The inline error box (red text); its wording depends on the API's answer.
    await expect(page.locator('div[style*="252, 165, 165"]')).toBeVisible({ timeout: 10_000 });
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
