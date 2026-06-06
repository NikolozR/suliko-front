import { test, expect } from '@playwright/test';

test.describe('Referral page', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/en/referral', { waitUntil: 'domcontentloaded' });
    await page.locator('form').first().waitFor({ state: 'visible', timeout: 10_000 });
  });

  test('form is visible', async ({ page }) => {
    await expect(page.locator('form').first()).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('phone input is visible', async ({ page }) => {
    await expect(page.locator('input[type="tel"], input[name*="phone"]').first()).toBeVisible();
  });

  test('name input is visible', async ({ page }) => {
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
  });

  test('submit button is visible', async ({ page }) => {
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();
  });

});
