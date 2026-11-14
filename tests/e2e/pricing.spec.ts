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

  test('every plan has a button that names what it buys', async ({ page }) => {
    for (const name of ['Buy 100 pages', 'Buy 500 pages', 'Choose pages']) {
      await expect(page.getByRole('button', { name }), name).toBeEnabled();
    }
  });

  test('says pages never expire and links the refund policy', async ({ page }) => {
    await expect(page.getByText('Pages never expire').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Refund policy' })).toBeVisible();
  });

  test('answers the questions before you buy', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Questions before you buy' })).toBeVisible();
    await expect(page.getByText('Do pages expire?')).toBeVisible();
  });

});
