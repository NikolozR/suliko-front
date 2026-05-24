import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {

  test('sign-in link in header navigates correctly', async ({ page }) => {
    await page.goto('/en', { waitUntil: 'domcontentloaded' });
    const signInLink = page.locator('a[href*="sign-in"]').first();
    await expect(signInLink).toBeVisible();
    await signInLink.click();
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('pricing link navigates to pricing page', async ({ page }) => {
    await page.goto('/en', { waitUntil: 'domcontentloaded' });
    const pricingLink = page.locator('a[href*="price"]').first();
    if (await pricingLink.isVisible()) {
      await pricingLink.click();
      await expect(page).toHaveURL(/\/price/);
    }
  });

  test('unknown route returns 404 without crashing', async ({ page }) => {
    const response = await page.goto('/en/this-route-does-not-exist-xyz');
    expect(response?.status()).toBe(404);
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('language switcher navigates to Georgian locale', async ({ page }) => {
    await page.goto('/en');
    const switcher = page.locator('[data-testid="language-switcher"]').first();
    if (await switcher.isVisible()) {
      await switcher.click();
      const kaOption = page.locator('text=KA, text=ქართული').first();
      await kaOption.click();
      await expect(page).toHaveURL(/\/ka/);
    }
  });

});
