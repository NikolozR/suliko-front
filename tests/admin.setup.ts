import { test as setup } from '@playwright/test';
import path from 'path';

const adminFile = path.join('playwright', '.auth', 'admin.json');

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/en/admin/login', { waitUntil: 'domcontentloaded' });
  await page.locator('input[placeholder="579 737 737"]').waitFor({ state: 'visible', timeout: 10_000 });

  await page.locator('input[placeholder="579 737 737"]').fill('579 737 737');
  await page.locator('input[type="password"]').fill('M.t.2002');
  await page.locator('button[type="submit"]').click();

  // Wait for either redirect to /admin or an error appearing
  await Promise.race([
    page.waitForURL(url => url.toString().includes('/admin') && !url.toString().includes('/admin/login'), { timeout: 20_000 }),
    page.locator('[style*="fca5a5"]').waitFor({ state: 'visible', timeout: 20_000 }),
  ]).catch(() => {});

  if (page.url().includes('/admin/login')) {
    const errorMsg = await page.locator('[style*="fca5a5"]').textContent().catch(() => 'unknown error');
    throw new Error(
      `Admin login failed: "${errorMsg?.trim()}". ` +
      `The account "579 737 737" must exist in the backend database with password "M.t.2002".`
    );
  }

  await page.context().storageState({ path: adminFile });
});
