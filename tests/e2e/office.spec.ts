import { test, expect } from '@playwright/test';

/**
 * Suliko Office landing page (/office) and its demo-request endpoint.
 *
 * The page was /tms until October 2026; the old address answers a permanent
 * redirect, which is tested here too.
 *
 * Never submits a valid demo request: that would email the sales inbox.
 */

const HERO_EN = 'Stop chasing orders and payments. Run your bureau.';
const HERO_KA = 'აღარ ეძებოთ შეკვეთები და გადახდები. მართეთ ბიურო.';

test.describe('Suliko Office landing', () => {
  test('/en/office renders hero, journey, FAQ and demo form', async ({ page }) => {
    await page.goto('/en/office', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h1')).toHaveText(HERO_EN);
    await expect(page.locator('#journey li')).toHaveCount(7);
    await expect(page.locator('details')).toHaveCount(5);
    await expect(page.locator('#demo input[name="email"]')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('/ka/office renders in Georgian', async ({ page }) => {
    await page.goto('/ka/office', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toHaveText(HERO_KA);
  });

  test('the old /tms address redirects to /office', async ({ page }) => {
    const response = await page.goto('/en/tms', { waitUntil: 'domcontentloaded' });
    expect(response?.request().redirectedFrom()?.url()).toMatch(/\/en\/tms$/);
    await expect(page).toHaveURL(/\/en\/office$/);
    await expect(page.locator('h1')).toHaveText(HERO_EN);
  });

  test('language switch moves between KA and EN', async ({ page }) => {
    await page.goto('/en/office', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'KA', pressed: false }).first().click();
    await expect(page).toHaveURL(/\/ka\/office/);
    await expect(page.locator('h1')).toHaveText(HERO_KA);
  });

  test('FAQ answers open on click', async ({ page }) => {
    await page.goto('/en/office', { waitUntil: 'domcontentloaded' });
    const item = page.locator('details').nth(1);
    const wasOpen = await item.evaluate((d) => (d as HTMLDetailsElement).open);
    await item.locator('summary').click();
    await expect.poll(() => item.evaluate((d) => (d as HTMLDetailsElement).open)).toBe(!wasOpen);
  });

  test('demo form blocks an empty submission client-side', async ({ page }) => {
    await page.goto('/en/office', { waitUntil: 'networkidle' });
    await page.locator('#demo button[type="submit"]').click();
    await expect(page.locator('#demo [role="alert"]')).toHaveText('Please fill in your name, company and email.');
  });

  test('the hero opens Office, a demo can still be booked, and the proposal section leads to the form', async ({ page }) => {
    await page.goto('/en/office', { waitUntil: 'domcontentloaded' });
    // The hero's main button manages orders (it opens Office); "Book a demo" moved to
    // the header and the proposal section, and both lead to the form.
    await expect(page.locator('main a', { hasText: 'Manage orders' }).first()).toBeAttached();
    await expect(page.locator('a[href="#demo"]', { hasText: 'Book a demo' }).first()).toBeAttached();
    await expect(page.locator('#offer a[href="#demo"]')).toBeAttached();
    await expect(page.locator('#offer h3')).toHaveCount(4);
  });

  test('the Translate landing page links to /office', async ({ page }) => {
    await page.goto('/en/translate', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('a[href$="/office"]').first()).toBeAttached({ timeout: 15_000 });
  });
});

/**
 * The endpoint throttles to 5 requests per IP per 10 minutes. These tests send
 * three, but a retry or a second CI job from the same runner can tip it over, and
 * a throttled answer says nothing about the validation under test: skip, not fail.
 */
test.describe('/api/demo-request', () => {
  test('rejects an invalid email with 400', async ({ request }) => {
    const res = await request.post('/api/demo-request', {
      data: { name: 'Test', company: 'Test bureau', email: 'not-an-email' },
    });
    test.skip(res.status() === 429, 'throttled');
    expect(res.status()).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_email' });
  });

  test('rejects missing required fields with 400', async ({ request }) => {
    const res = await request.post('/api/demo-request', { data: { email: 'a@b.co' } });
    test.skip(res.status() === 429, 'throttled');
    expect(res.status()).toBe(400);
  });

  test('answers a honeypot submission with a silent 200', async ({ request }) => {
    const res = await request.post('/api/demo-request', {
      data: { name: 'Bot', company: 'Bot', email: 'bot@example.com', website: 'http://spam.example' },
    });
    test.skip(res.status() === 429, 'throttled');
    expect(res.status()).toBe(200);
  });
});
