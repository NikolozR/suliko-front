import { test, expect } from '@playwright/test';

test.describe('Pricing page', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/en/price');
    await page.locator('h1').first().waitFor({ state: 'visible', timeout: 30_000 });
  });

  test('page heading renders', async ({ page }) => {
    await expect(page.locator('h1').first()).toHaveText('Pricing Packages');
  });

  test('all three plans are listed', async ({ page }) => {
    for (const plan of ['Starter', 'Professional', 'Pay as you go']) {
      await expect(page.getByRole('heading', { name: plan }), plan).toBeVisible({ timeout: 8_000 });
    }
  });

  test('every plan has a Buy Credits button', async ({ page }) => {
    const buttons = page.getByRole('button', { name: 'Buy Credits' });
    await expect(buttons).toHaveCount(3);
    await expect(buttons.first()).toBeEnabled();
  });

});
