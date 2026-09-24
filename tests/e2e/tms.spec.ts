import { test, expect } from '@playwright/test';

/**
 * Suliko Office landing page (/tms) and its demo-request endpoint.
 *
 * Not part of the CI `public` project yet: it needs the page deployed before it
 * can pass against the live URL. Run locally with
 * `npx playwright test --project=tms`, and fold it into `public` once live.
 *
 * Never submits a valid demo request: that would email the sales inbox.
 */

test.describe('Suliko Office landing', () => {
  test('/en/tms renders hero, journey, FAQ and demo form', async ({ page }) => {
    await page.goto('/en/tms', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h1')).toHaveText('Run your translation bureau from one screen');
    await expect(page.locator('#journey li')).toHaveCount(7);
    await expect(page.locator('details')).toHaveCount(4);
    await expect(page.locator('#demo input[name="email"]')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('/ka/tms renders in Georgian', async ({ page }) => {
    await page.goto('/ka/tms', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toHaveText('მართეთ მთელი ბიურო ერთი სისტემიდან');
  });

  test('language switch moves between KA and EN', async ({ page }) => {
    await page.goto('/en/tms', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'KA', pressed: false }).first().click();
    await expect(page).toHaveURL(/\/ka\/tms/);
    await expect(page.locator('h1')).toHaveText('მართეთ მთელი ბიურო ერთი სისტემიდან');
  });

  test('demo form blocks an empty submission client-side', async ({ page }) => {
    await page.goto('/en/tms', { waitUntil: 'networkidle' });
    await page.locator('#demo button[type="submit"]').click();
    await expect(page.locator('#demo [role="alert"]')).toHaveText('Please fill in your name, company and email.');
  });

  test('main landing page links to /tms', async ({ page }) => {
    await page.goto('/en', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('a[href$="/tms"]').first()).toBeAttached({ timeout: 15_000 });
  });
});

test.describe('/api/demo-request', () => {
  test('rejects an invalid email with 400', async ({ request }) => {
    const res = await request.post('/api/demo-request', {
      data: { name: 'Test', company: 'Test bureau', email: 'not-an-email' },
    });
    expect(res.status()).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_email' });
  });

  test('rejects missing required fields with 400', async ({ request }) => {
    const res = await request.post('/api/demo-request', { data: { email: 'a@b.co' } });
    expect(res.status()).toBe(400);
  });

  test('answers a honeypot submission with a silent 200', async ({ request }) => {
    const res = await request.post('/api/demo-request', {
      data: { name: 'Bot', company: 'Bot', email: 'bot@example.com', website: 'http://spam.example' },
    });
    expect(res.status()).toBe(200);
  });
});
