import { test, expect } from '@playwright/test';

test.describe('Smoke tests', () => {

  test('Translate landing page loads with hero heading', async ({ page }) => {
    await page.goto('/en/translate');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.locator('body')).not.toContainText('Internal Server Error');
  });

  test('pricing page loads with Starter plan', async ({ page }) => {
    await page.goto('/en/price');
    await expect(page.getByRole('heading', { name: 'Starter' })).toBeVisible({ timeout: 10_000 });
  });

  test('sign-in page loads with identifier input', async ({ page }) => {
    await page.goto('/en/sign-in');
    await expect(
      page.locator('input[name="identifier"]').first()
    ).toBeVisible({ timeout: 8_000 });
  });

  test('blog index loads with its heading', async ({ page }) => {
    const response = await page.goto('/en/blog');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1').first()).toHaveText('Blog', { timeout: 30_000 });
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('bare / redirects to a locale, on to Suliko Office', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/(en|ka)\/office$/);
  });

});
