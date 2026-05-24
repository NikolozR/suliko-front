import { test as setup } from '@playwright/test';
import path from 'path';

const adminFile = path.join('playwright', '.auth', 'admin.json');

setup('authenticate as admin', async ({ page }) => {
  // Setup needs more time than regular tests due to API calls
  setup.setTimeout(120_000);

  await page.goto('/en/admin/login', { waitUntil: 'domcontentloaded' });
  await page.locator('input[placeholder="579 737 737"]').waitFor({ state: 'visible', timeout: 10_000 });

  await page.locator('input[placeholder="579 737 737"]').fill('579 737 737');
  await page.locator('input[type="password"]').fill('M.t.2002');
  await page.locator('button[type="submit"]').click();

  // Wait for redirect to /admin or an error appearing
  await Promise.race([
    page.waitForURL(url => url.toString().includes('/admin') && !url.toString().includes('/admin/login'), { timeout: 90_000 }),
    page.locator('[style*="fca5a5"]').waitFor({ state: 'visible', timeout: 90_000 }),
  ]).catch(() => {});

  if (page.url().includes('/admin/login')) {
    const errorMsg = await page.locator('[style*="fca5a5"]').textContent().catch(() => null);
    throw new Error(
      `Admin login failed: "${errorMsg ?? 'no error shown — backend may be timing out or account does not exist'}". ` +
      `The account "579737737" must exist in the Supabase database with password "M.t.2002".`
    );
  }

  await page.context().storageState({ path: adminFile });
});
