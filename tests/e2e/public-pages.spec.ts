import { test, expect } from '@playwright/test';

test.describe('Public pages', () => {

  test('/en/developers loads', async ({ page }) => {
    await page.goto('/en/developers', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('/en/notary loads', async ({ page }) => {
    await page.goto('/en/notary', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('/en/terms loads with content', async ({ page }) => {
    await page.goto('/en/terms', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 });
  });

  test('/en/payment/success shows success heading and action buttons', async ({ page }) => {
    await page.goto('/en/payment/success', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Payment Successful!')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'Start Translating' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'View Profile' })).toBeVisible();
  });

  test('/en/payment/cancel shows cancel heading and action buttons', async ({ page }) => {
    await page.goto('/en/payment/cancel', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Payment Cancelled')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Go Home' })).toBeVisible();
  });

  test('/en/thank-you loads without error', async ({ page }) => {
    await page.goto('/en/thank-you', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('landing page FAQ section renders', async ({ page }) => {
    await page.goto('/en', { waitUntil: 'domcontentloaded' });
    // FAQSection uses Radix accordion — triggers render as buttons
    const faqTrigger = page.locator('[data-radix-collection-item], button[data-state]').first();
    await expect(faqTrigger).toBeVisible({ timeout: 10_000 });
  });

  test('landing page newsletter email input is visible', async ({ page }) => {
    await page.goto('/en', { waitUntil: 'domcontentloaded' });
    await expect(
      page.locator('input[type="email"]').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('landing page footer contains terms link', async ({ page }) => {
    await page.goto('/en', { waitUntil: 'domcontentloaded' });
    await expect(
      page.locator('footer a[href*="terms"], a[href*="terms"]').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('landing page hero CTA links to sign-in', async ({ page }) => {
    await page.goto('/en', { waitUntil: 'domcontentloaded' });
    await expect(
      page.locator('a[href*="sign-in"]').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('/ka Georgian locale loads without error', async ({ page }) => {
    await page.goto('/ka', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('/pl Polish locale loads without error', async ({ page }) => {
    await page.goto('/pl', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('body')).not.toContainText('Application error');
  });

});
