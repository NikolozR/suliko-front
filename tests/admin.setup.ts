import { test as setup } from '@playwright/test';
import path from 'path';

const adminFile = path.join('playwright', '.auth', 'admin.json');

// Admins sign in through the normal sign-in (the admin console has no login of its
// own any more). The `token` cookie lands as soon as the API accepts the account,
// which is a reliable success signal that doesn't depend on the redirect completing.
const adminCookiePresent = () => /(?:^|;\s*)token=[^;]+/.test(document.cookie);

// Only the form's own API error alert (Next.js keeps an empty route announcer alert).
const errorBox = '[role="alert"]:not(#__next-route-announcer__)';

setup('authenticate as admin', async ({ page }) => {
  setup.setTimeout(90_000);

  const phone = process.env.TEST_ADMIN_PHONE;
  const password = process.env.TEST_ADMIN_PASSWORD;

  setup.skip(
    !phone || !password,
    'TEST_ADMIN_PHONE and TEST_ADMIN_PASSWORD env vars are not set, skipping admin authentication',
  );

  await page.goto('/en/sign-in?next=%2Fadmin', { waitUntil: 'domcontentloaded' });
  await page.locator('input[name="identifier"]').waitFor({ state: 'visible', timeout: 20_000 });

  await page.locator('input[name="identifier"]').fill(phone!);
  await page.locator('input[name="password"]').fill(password!);
  await page.locator('button[type="submit"]').first().click();

  // Whichever resolves first ends the wait: token cookie (success), a
  // redirect into /admin (success), or the error box appearing (failure).
  await Promise.race([
    page.waitForFunction(adminCookiePresent, undefined, { timeout: 45_000 }),
    page.waitForURL(url => !url.toString().includes('/sign-in'), { timeout: 45_000 }),
    page.locator(errorBox).waitFor({ state: 'visible', timeout: 45_000 }),
  ]).catch(() => {});

  const loggedIn = await page.evaluate(adminCookiePresent);

  if (!loggedIn) {
    const errorMsg = await page.locator(errorBox).first().textContent({ timeout: 2_000 }).catch(() => null);
    throw new Error(
      `Admin login failed: "${errorMsg ?? 'no error shown — the auth backend is likely slow/unreachable or the account is invalid'}". ` +
      `Check that TEST_ADMIN_PHONE / TEST_ADMIN_PASSWORD belong to an admin account on the live backend.`
    );
  }

  await page.context().storageState({ path: adminFile });
});
