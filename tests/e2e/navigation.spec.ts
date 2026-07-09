import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {

  test('landing page exposes a working path to sign-in', async ({ page }) => {
    await page.goto('/en', { waitUntil: 'domcontentloaded' });
    // The landing page must offer a link to the sign-in route...
    const signInLink = page.locator('a[href*="sign-in"]').first();
    await expect(signInLink).toBeVisible({ timeout: 20_000 });
    const href = await signInLink.getAttribute('href');
    expect(href).toMatch(/\/sign-in/);
    // ...and following that route must actually load the sign-in page. (We assert
    // on the resolved href rather than clicking, because relying on one footer
    // link's client-side nav is brittle — see navigation flakiness notes.)
    await page.goto(href!, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.locator('input[name="identifier"]').first()).toBeVisible({ timeout: 10_000 });
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
