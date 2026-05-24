import { test, expect } from '@playwright/test';

test.describe('Sign-in form validation', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/en/sign-in', { waitUntil: 'domcontentloaded' });
    await page.locator('input[name="identifier"]').waitFor({ state: 'visible', timeout: 15_000 });
  });

  test('empty submit stays on sign-in page', async ({ page }) => {
    await page.locator('button[type="submit"]').first().click();
    // Validation blocks navigation — we should remain on sign-in
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 3_000 });
  });

  test('invalid phone format stays on sign-in page', async ({ page }) => {
    await page.locator('input[name="identifier"]').fill('123');
    await page.locator('button[type="submit"]').first().click();
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 3_000 });
  });

  test('Google OAuth button is present', async ({ page }) => {
    // GoogleButton renders as a div with an overlaid Google iframe, not a <button>
    await expect(
      page.locator('.cursor-pointer:has(span)').first()
    ).toBeVisible({ timeout: 5_000 });
  });

});
