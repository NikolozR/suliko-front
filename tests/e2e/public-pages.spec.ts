import { test, expect } from '@playwright/test';

// Every public content page, in every locale: it must answer 200 and render its
// own <h1>. (The error boundary renders no <h1>, so this also catches a page that
// crashed on the client.)
const PAGES = ['', '/price', '/about', '/privacy', '/refund-policy', '/terms', '/developers', '/notary', '/office', '/blog', '/help'];
const LOCALES = ['en', 'ka', 'pl'];

test.describe('Public pages render in every locale', () => {
  for (const locale of LOCALES) {
    for (const path of PAGES) {
      test(`/${locale}${path}`, async ({ page }) => {
        const response = await page.goto(`/${locale}${path}`, { waitUntil: 'domcontentloaded' });
        expect(response?.status()).toBe(200);
        await expect(page.locator('h1').first()).toBeVisible({ timeout: 20_000 });
        await expect(page.locator('html')).toHaveAttribute('lang', locale);
        await expect(page.locator('body')).not.toContainText('Application error');
      });
    }
  }
});

test.describe('Public pages', () => {

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

  test('/en/thank-you renders its content', async ({ page }) => {
    const response = await page.goto('/en/thank-you', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('landing page FAQ items expand and collapse', async ({ page }) => {
    await page.goto('/en', { waitUntil: 'networkidle' });
    // Scoped to the FAQ section: the language switcher is a button[aria-expanded] too.
    const first = page.locator('#faq button[aria-expanded]').first();
    await first.scrollIntoViewIfNeeded();
    const before = await first.getAttribute('aria-expanded');
    await first.click();
    await expect(first).not.toHaveAttribute('aria-expanded', before!);
    await first.click();
    await expect(first).toHaveAttribute('aria-expanded', before!);
  });

  test('landing page newsletter form rejects a malformed email', async ({ page }) => {
    await page.goto('/en', { waitUntil: 'networkidle' });
    const email = page.locator('input[type="email"]').first();
    await expect(email).toBeVisible({ timeout: 10_000 });
    // Never a valid address: a subscription would email the inbox.
    let sent = 0;
    page.on('request', (req) => {
      if (req.url().includes('/api/newsletter')) sent++;
    });
    await email.fill('not-an-email');
    await email.press('Enter');
    expect(await email.evaluate((el) => (el as HTMLInputElement).validity.valid)).toBe(false);
    await page.waitForLoadState('networkidle');
    expect(sent).toBe(0);
  });

});
