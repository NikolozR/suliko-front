import { test, expect } from '@playwright/test';

/** What a visitor who is not signed in can and cannot reach. */

test.describe('Admin panel is closed to visitors', () => {
  test('/en/admin shows "Access Restricted" and no admin data', async ({ page }) => {
    await page.goto('/en/admin', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Access Restricted')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: 'Users', exact: true })).toHaveCount(0);
    await expect(page.locator('table')).toHaveCount(0);
  });

  test('/en/admin/blog sends a visitor to the normal sign-in, to come back afterwards', async ({ page }) => {
    await page.goto('/en/admin/blog', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/en\/sign-in\?next=%2Fadmin%2Fblog/, { timeout: 20_000 });
  });

  test('the old admin login address goes to the normal sign-in', async ({ page }) => {
    await page.goto('/en/admin/login', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/en\/sign-in\?next=%2Fadmin/, { timeout: 20_000 });
    await expect(page.locator('input[name="identifier"]')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });
});
