import { isProduction } from './helpers/environment';
import { test, expect, type Page } from '@playwright/test';

// The inline validation messages under the fields (zod, client-side).
const fieldMessage = (page: Page) => page.locator('p[data-slot="form-message"]');

// Next.js keeps an empty `role="alert"` route announcer in every page; only the
// form's own alert is of interest.
const formAlert = (page: Page) => page.locator('[role="alert"]:not(#__next-route-announcer__)');

test.describe('Sign-in form validation', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/en/sign-in', { waitUntil: 'domcontentloaded' });
    await page.locator('input[name="identifier"]').waitFor({ state: 'visible', timeout: 30_000 });
    // Submitting before the page has hydrated is a plain GET of the form, which puts
    // the typed password in the address bar and never runs the validation.
    await page.waitForLoadState('networkidle');
  });

  test('empty submit asks for both fields and stays on sign-in', async ({ page }) => {
    await page.locator('button[type="submit"]').first().click();
    await expect(fieldMessage(page).filter({ hasText: 'Phone number or email is required' })).toBeVisible();
    await expect(fieldMessage(page).filter({ hasText: 'Password must be at least 8 characters' })).toBeVisible();
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('invalid phone format is rejected before any request is made', async ({ page }) => {
    let loginCalls = 0;
    page.on('request', (req) => {
      if (req.url().includes('/api/session/login')) loginCalls++;
    });
    await page.locator('input[name="identifier"]').fill('123');
    await page.locator('input[name="password"]').fill('whatever-123');
    await page.locator('button[type="submit"]').first().click();
    await expect(fieldMessage(page).filter({ hasText: 'valid phone number or email' })).toBeVisible();
    expect(loginCalls).toBe(0);
  });

  test('wrong credentials show an error and leave the visitor signed out', async ({ page, baseURL }) => {
    // The backend's answer is stubbed: a live login from a CI runner depends on the
    // backend's latency and on its own throttling, which is not what is under test.
    let loginCalls = 0;
    await page.route('**/api/session/login', async (route) => {
      loginCalls++;
      await route.fulfill({ status: 401, contentType: 'application/json', body: '{"error":"invalid_credentials"}' });
    });

    await page.locator('input[name="identifier"]').fill('500000001');
    await page.locator('input[name="password"]').fill('Not-The-Password-1');
    await page.locator('button[type="submit"]').first().click();

    // Web sessions are switched on by a production-only setting. Without it the form
    // signs in directly and never calls /api/session/login, so there is nothing to stub.
    await page.waitForTimeout(3_000);
    test.skip(loginCalls === 0 && !isProduction(baseURL), 'web sessions are off on preview deployments');

    await expect(formAlert(page)).toBeVisible({ timeout: 10_000 });
    expect(loginCalls).toBe(1);
    await expect(page).toHaveURL(/\/sign-in/);
    expect(await page.evaluate(() => document.cookie)).not.toMatch(/(?:^|;\s*)token=/);
  });

  test('Google sign-in button is rendered', async ({ page }) => {
    // Google's own iframe; it renders even when the origin is not allowed for the client ID.
    await expect(page.locator('iframe[src*="accounts.google.com"]').first()).toBeAttached({ timeout: 15_000 });
  });

});

// The page is visible before it is interactive. A submit in that gap is a plain GET of
// the form, which would put the typed password in the address bar, so the server HTML
// must already have the button disabled and the form pointed at POST.
test.describe('Sign-in form before the page is interactive', () => {
  test('is served with a disabled submit button and method=post', async ({ request }) => {
    const html = await (await request.get('/en/sign-in')).text();
    const form = html.match(/<form[^>]*>[\s\S]*?<\/form>/)?.[0] ?? '';
    expect(form, 'the sign-in form is in the server HTML').toContain('name="password"');
    expect(form).toMatch(/<form[^>]*method="post"/i);
    expect(form).toMatch(/<button[^>]*type="submit"[^>]*disabled|<button[^>]*disabled[^>]*type="submit"/i);
  });
});
