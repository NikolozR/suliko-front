import { test, expect } from '@playwright/test';

// Uses storageState set by tests/admin.setup.ts
test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('Admin login page (UI only)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/en/admin/login', { waitUntil: 'domcontentloaded' });
  });

  test('SULIKO brand heading is visible', async ({ page }) => {
    await expect(page.getByText('SULIKO')).toBeVisible({ timeout: 8_000 });
  });

  test('Admin Access label is visible', async ({ page }) => {
    await expect(page.getByText('Admin Access')).toBeVisible();
  });

  test('phone input is visible', async ({ page }) => {
    await expect(page.locator('input[placeholder="579 737 737"]')).toBeVisible();
  });

  test('password input is visible', async ({ page }) => {
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('Enter Panel button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Enter Panel/i })).toBeVisible();
  });

  test('wrong credentials show error message', async ({ page }) => {
    await page.locator('input[placeholder="579 737 737"]').fill('000000000');
    await page.locator('input[type="password"]').fill('wrongpass');
    await page.getByRole('button', { name: /Enter Panel/i }).click();
    await expect(
      page.getByText(/Not authorized/i)
    ).toBeVisible({ timeout: 5_000 });
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
    // AdminTabsWrapper renders tabs: Users and Referrals
    await expect(
      page.getByRole('tab').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('/en/admin — Users tab is present', async ({ page }) => {
    await page.goto('/en/admin', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('tab', { name: /users/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  test('/en/admin — Referrals tab is present', async ({ page }) => {
    await page.goto('/en/admin', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('tab', { name: /referral/i })
    ).toBeVisible({ timeout: 10_000 });
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
