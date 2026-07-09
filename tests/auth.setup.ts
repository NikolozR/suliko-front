import { test as setup } from '@playwright/test';
import path from 'path';

const authFile = path.join('playwright', '.auth', 'user.json');

// Login succeeds the moment the auth token lands in the `token` cookie
// (authStore.setToken sets it synchronously). Detecting that — rather than the
// /document redirect — means we don't hang when the post-login profile fetch is
// slow: SulikoForm awaits fetchUserProfile() before router.push(), and the app's
// fetch client has no timeout, so a slow backend used to eat the full 120s.
const tokenPresent = () => /(?:^|;\s*)token=[^;]+/.test(document.cookie);

setup('authenticate as test user', async ({ page }) => {
  setup.setTimeout(90_000);

  const phone = process.env.TEST_USER_PHONE;
  const password = process.env.TEST_USER_PASSWORD;

  if (!phone || !password) {
    throw new Error('TEST_USER_PHONE and TEST_USER_PASSWORD env vars are required');
  }

  await page.goto('/en/sign-in', { waitUntil: 'domcontentloaded' });
  await page.locator('input[name="identifier"]').waitFor({ state: 'visible', timeout: 20_000 });

  await page.locator('input[name="identifier"]').fill(phone);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').first().click();

  // Whichever resolves first ends the wait: token cookie (success), a redirect
  // away from /sign-in (success), an API error alert, or a Zod validation error.
  await Promise.race([
    page.waitForFunction(tokenPresent, undefined, { timeout: 45_000 }),
    page.waitForURL(url => !url.toString().includes('/sign-in'), { timeout: 45_000 }),
    page.locator('[role="alert"]').waitFor({ state: 'visible', timeout: 45_000 }),
    page.locator('p[data-slot="form-message"]').waitFor({ state: 'visible', timeout: 45_000 }),
  ]).catch(() => {});

  // Decide from the token cookie, not the URL (the redirect may still be pending).
  const loggedIn = await page.evaluate(tokenPresent);

  if (!loggedIn) {
    const validationError = await page.locator('p[data-slot="form-message"]').first().textContent().catch(() => null);
    if (validationError) {
      throw new Error(
        `Login blocked by form validation: "${validationError}". ` +
        `TEST_USER_PHONE must be exactly 9 digits starting with 5, no spaces (e.g. "591234567").`
      );
    }
    const apiError = await page.locator('[role="alert"]').textContent().catch(() => null);
    throw new Error(
      `Login failed: "${apiError ?? 'no error shown — the auth backend is likely slow/unreachable or the test account is invalid'}". ` +
      `Verify the test account exists on the live backend with phone="${phone}" and the correct password.`
    );
  }

  await page.context().storageState({ path: authFile });
});
