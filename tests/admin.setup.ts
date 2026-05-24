import { test as setup, expect } from '@playwright/test';
import path from 'path';

const adminFile = path.join('playwright', '.auth', 'admin.json');

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/en/admin/login', { waitUntil: 'domcontentloaded' });
  await page.locator('input[placeholder="579 737 737"]').waitFor({ state: 'visible', timeout: 10_000 });

  await page.locator('input[placeholder="579 737 737"]').fill('579 737 737');
  await page.locator('input[type="password"]').fill('M.t.2002');
  await page.locator('button[type="submit"]').click();

  // Surface any error message shown on the page
  await page.waitForTimeout(3000);
  const errorEl = page.locator('[style*="fca5a5"], [style*="red"], [style*="error"]').first();
  const errorText = await errorEl.textContent().catch(() => null);
  if (errorText?.trim()) throw new Error(`Admin login failed with UI error: ${errorText.trim()}`);

  // Wait for redirect to admin dashboard
  await expect(page).toHaveURL(/\/admin(?!\/login)/, { timeout: 20_000 });

  await page.context().storageState({ path: adminFile });
});
