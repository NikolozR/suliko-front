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
    // link's client-side nav is brittle.)
    await page.goto(href!, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.locator('input[name="identifier"]').first()).toBeVisible({ timeout: 10_000 });
  });

  test('header Blog link opens the blog', async ({ page }) => {
    await page.goto('/en', { waitUntil: 'networkidle' });
    await page.locator('header a[href="/en/blog"]').click();
    await expect(page).toHaveURL(/\/en\/blog$/);
    await expect(page.locator('h1').first()).toHaveText('Blog');
  });

  test('footer Pricing link scrolls to the pricing section', async ({ page }) => {
    await page.goto('/en', { waitUntil: 'networkidle' });
    await page.locator('footer a[href="/en#pricing"]').click();
    await expect(page).toHaveURL(/\/en#pricing$/);
    await expect(page.locator('#pricing')).toBeInViewport({ timeout: 10_000 });
  });

  test('footer links to the legal and company pages', async ({ page }) => {
    await page.goto('/en', { waitUntil: 'domcontentloaded' });
    for (const path of ['/en/about', '/en/terms', '/en/privacy', '/en/refund-policy']) {
      await expect(page.locator(`footer a[href="${path}"]`), path).toBeAttached();
    }
  });

  test('unknown route returns 404 without crashing', async ({ page }) => {
    const response = await page.goto('/en/this-route-does-not-exist-xyz');
    expect(response?.status()).toBe(404);
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('language switcher moves between locales and keeps the page', async ({ page }) => {
    await page.goto('/en/blog', { waitUntil: 'networkidle' });

    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'ქართული' }).click();
    await expect(page).toHaveURL(/\/ka\/blog$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'ka');

    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Polski' }).click();
    await expect(page).toHaveURL(/\/pl\/blog$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'pl');
  });

});
