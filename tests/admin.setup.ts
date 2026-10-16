import { test as setup } from '@playwright/test';
import path from 'path';

const adminFile = path.join('playwright', '.auth', 'admin.json');

// The admin login page stores the `token` cookie only after the API confirms the
// account is an admin, and before router.push('/admin'), so it's a reliable success
// signal that doesn't depend on the redirect completing.
const adminCookiePresent = () => /(?:^|;\s*)token=[^;]+/.test(document.cookie);

// The error box is styled inline; the browser serialises #fca5a5 as rgb(252, 165, 165).
const errorBox = 'div[style*="252, 165, 165"]';

setup('authenticate as admin', async ({ page }) => {
  setup.setTimeout(90_000);

  const phone = process.env.TEST_ADMIN_PHONE;
  const password = process.env.TEST_ADMIN_PASSWORD;

  setup.skip(
    !phone || !password,
    'TEST_ADMIN_PHONE and TEST_ADMIN_PASSWORD env vars are not set, skipping admin authentication',
  );

  await page.goto('/en/admin/login', { waitUntil: 'domcontentloaded' });
  await page.locator('input[placeholder="5XX XXX XXX"]').waitFor({ state: 'visible', timeout: 20_000 });

  await page.locator('input[placeholder="5XX XXX XXX"]').fill(phone!);
  await page.locator('input[type="password"]').fill(password!);
  await page.locator('button[type="submit"]').click();

  // Whichever resolves first ends the wait: token cookie (success), a
  // redirect into /admin (success), or the error box appearing (failure).
  await Promise.race([
    page.waitForFunction(adminCookiePresent, undefined, { timeout: 45_000 }),
    page.waitForURL(url => url.toString().includes('/admin') && !url.toString().includes('/admin/login'), { timeout: 45_000 }),
    page.locator(errorBox).waitFor({ state: 'visible', timeout: 45_000 }),
  ]).catch(() => {});

  const loggedIn = await page.evaluate(adminCookiePresent);

  if (!loggedIn) {
    const errorMsg = await page.locator(errorBox).textContent().catch(() => null);
    throw new Error(
      `Admin login failed: "${errorMsg ?? 'no error shown — the auth backend is likely slow/unreachable or the account is invalid'}". ` +
      `Check that TEST_ADMIN_PHONE / TEST_ADMIN_PASSWORD belong to an admin account on the live backend.`
    );
  }

  await page.context().storageState({ path: adminFile });
});
