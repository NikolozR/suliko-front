import { test, expect } from '@playwright/test';

/** What a visitor who is not signed in can and cannot reach. */

test.describe('Admin panel is closed to visitors', () => {
  test('/en/admin shows "Access Restricted" and no admin data', async ({ page }) => {
    await page.goto('/en/admin', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Access Restricted')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: 'Users', exact: true })).toHaveCount(0);
    await expect(page.locator('table')).toHaveCount(0);
  });

  test('/en/admin/blog redirects to the admin login', async ({ page }) => {
    await page.goto('/en/admin/blog', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 20_000 });
  });

  test('admin login page has its phone and password fields', async ({ page }) => {
    await page.goto('/en/admin/login', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('input[placeholder="5XX XXX XXX"]')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /Enter Panel/i })).toBeVisible();
  });
});
