import { test, expect } from '@playwright/test';

/**
 * Suliko is two products under one domain: Suliko Office (/office) and Suliko
 * Translate (/translate). For Georgian and Polish the locale root belongs to
 * neither and sends visitors to Office, keeping the query string so campaign
 * tags survive. English is the exception: its root is the international
 * landing page.
 */

test.describe('Suliko Office / Suliko Translate split', () => {
  test('the bare address redirects to a language root or its Office page', async ({ request }) => {
    const res = await request.get('/', { maxRedirects: 0 });
    expect([302, 307]).toContain(res.status());
    expect(res.headers()['location']).toMatch(/\/(ka|en)(\/office)?$/);
  });

  test('the English root is the international landing page, not a redirect', async ({ request }) => {
    const res = await request.get('/en', { maxRedirects: 0 });
    expect(res.status()).toBe(200);
  });

  test('a Georgian or Polish locale root redirects to that locale\'s Office page', async ({ request }) => {
    for (const locale of ['ka', 'pl']) {
      const res = await request.get(`/${locale}`, { maxRedirects: 0 });
      expect(res.status(), locale).toBe(307);
      expect(new URL(res.headers()['location'], 'http://x').pathname, locale).toBe(`/${locale}/office`);
    }
  });

  test('the redirect keeps UTM tags and ad click ids', async ({ request }) => {
    const res = await request.get('/ka?utm_source=meta&utm_campaign=spring&fbclid=abc123', { maxRedirects: 0 });
    const location = new URL(res.headers()['location'], 'http://x');
    expect(location.pathname).toBe('/ka/office');
    expect(location.searchParams.get('utm_source')).toBe('meta');
    expect(location.searchParams.get('utm_campaign')).toBe('spring');
    expect(location.searchParams.get('fbclid')).toBe('abc123');
  });

  test('a hand-typed /Translate is sent to the lower-case address', async ({ request }) => {
    const res = await request.get('/en/Translate', { maxRedirects: 0 });
    expect([307, 308]).toContain(res.status());
    expect(new URL(res.headers()['location'], 'http://x').pathname).toBe('/en/translate');
  });

  test('/en/translate is the Translate landing page, not a redirect', async ({ page }) => {
    const response = await page.goto('/en/translate', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/en\/translate$/);
    await expect(page.locator('h1').first()).toHaveText('Translate documents in minutes, not hours.');
    await expect(page.locator('#pricing')).toBeAttached();
  });

  test('Translate has its own title and canonical', async ({ page }) => {
    await page.goto('/en/translate', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/^Suliko Translate:/);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(new URL(canonical!).pathname).toBe('/translate');
  });

  test('Office links across to Translate in the header and near the end of the page', async ({ page }) => {
    await page.goto('/en/office', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('header a[href="/en/translate"]').first()).toBeAttached();
    await expect(page.locator('main a[href="/en/translate"]')).toBeAttached();
  });

  test('Translate links across to Office, and its logo stays on Translate', async ({ page }) => {
    await page.goto('/en/translate', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('header a[href="/en/office"]').first()).toBeAttached();
    await expect(page.locator('header a[href="/en/translate"]').first()).toBeAttached();
  });

  test('both landing pages are in the sitemap, the bare address is not', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    const xml = await res.text();
    expect(xml).toContain('https://suliko.ge/office');
    expect(xml).toContain('https://suliko.ge/translate');
    expect(xml).not.toMatch(/<loc>https:\/\/suliko\.ge<\/loc>/);
    expect(xml).not.toMatch(/<loc>https:\/\/suliko\.ge\/<\/loc>/);
  });
});
