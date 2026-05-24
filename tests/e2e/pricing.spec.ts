import { test, expect } from '@playwright/test';

test.describe('Pricing page', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/en/price');
    await page.locator('h1').first().waitFor({ state: 'visible', timeout: 10_000 });
  });

  test('page heading renders', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('Starter and Professional plans are visible', async ({ page }) => {
    await expect(page.locator('text=Starter').first()).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('text=Professional').first()).toBeVisible({ timeout: 8_000 });
  });

  test('plan CTA buttons are present', async ({ page }) => {
    const cta = page.locator('a[href*="sign-in"], button:has-text("Get")').first();
    await expect(cta).toBeVisible({ timeout: 8_000 });
  });

});
