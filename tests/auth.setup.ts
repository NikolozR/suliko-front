import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join('playwright', '.auth', 'user.json');

setup('authenticate as test user', async ({ page }) => {
  const phone = process.env.TEST_USER_PHONE;
  const password = process.env.TEST_USER_PASSWORD;

  if (!phone || !password) {
    throw new Error('TEST_USER_PHONE and TEST_USER_PASSWORD env vars are required');
  }

  await page.goto('/en/sign-in', { waitUntil: 'domcontentloaded' });
  await page.locator('input[name="identifier"]').waitFor({ state: 'visible', timeout: 15_000 });

  await page.locator('input[name="identifier"]').fill(phone);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').first().click();

  // Wait for redirect away from sign-in (app navigates to /document on success)
  await expect(page).not.toHaveURL(/\/sign-in/, { timeout: 20_000 });

  await page.context().storageState({ path: authFile });
});
