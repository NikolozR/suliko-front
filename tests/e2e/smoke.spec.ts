import { test, expect } from '@playwright/test';

test.describe('Smoke tests', () => {

  test('landing page loads with hero heading', async ({ page }) => {
    await page.goto('/en');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.locator('body')).not.toContainText('Internal Server Error');
  });

  test('pricing page loads with Starter plan', async ({ page }) => {
    await page.goto('/en/price');
    await expect(page.locator('text=Starter').first()).toBeVisible({ timeout: 10_000 });
  });

  test('sign-in page loads with identifier input', async ({ page }) => {
    await page.goto('/en/sign-in');
    await expect(
      page.locator('input[name="identifier"]').first()
    ).toBeVisible({ timeout: 8_000 });
  });

  test('blog index loads without error', async ({ page }) => {
    await page.goto('/en/blog');
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.locator('body')).not.toContainText('404');
  });

  test('bare / redirects to /en', async ({ page }) => {
    await page.goto('/');
    expect(page.url()).toMatch(/\/en\/?/);
  });

});
