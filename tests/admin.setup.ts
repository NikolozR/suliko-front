import { test as setup } from '@playwright/test';
import path from 'path';

const adminFile = path.join('playwright', '.auth', 'admin.json');

// The admin login page sets the `adminAllowed=1` cookie synchronously right after
// login() resolves and before router.push('/admin'), so it's a reliable success
// signal that doesn't depend on the redirect completing.
const adminCookiePresent = () => /(?:^|;\s*)adminAllowed=1\b/.test(document.cookie);

setup('authenticate as admin', async ({ page }) => {
  setup.setTimeout(90_000);

  await page.goto('/en/admin/login', { waitUntil: 'domcontentloaded' });
  await page.locator('input[placeholder="579 737 737"]').waitFor({ state: 'visible', timeout: 20_000 });

  await page.locator('input[placeholder="579 737 737"]').fill('579 737 737');
  await page.locator('input[type="password"]').fill('M.t.2002');
  await page.locator('button[type="submit"]').click();

  // Whichever resolves first ends the wait: adminAllowed cookie (success), a
  // redirect into /admin (success), or the error box appearing (failure).
  await Promise.race([
    page.waitForFunction(adminCookiePresent, undefined, { timeout: 45_000 }),
    page.waitForURL(url => url.toString().includes('/admin') && !url.toString().includes('/admin/login'), { timeout: 45_000 }),
    page.locator('[style*="fca5a5"]').waitFor({ state: 'visible', timeout: 45_000 }),
  ]).catch(() => {});

  const loggedIn = await page.evaluate(adminCookiePresent);

  if (!loggedIn) {
    const errorMsg = await page.locator('[style*="fca5a5"]').textContent().catch(() => null);
    throw new Error(
      `Admin login failed: "${errorMsg ?? 'no error shown — the auth backend is likely slow/unreachable or the account is invalid'}". ` +
      `The account "579737737" must exist on the live backend with password "M.t.2002".`
    );
  }

  await page.context().storageState({ path: adminFile });
});
