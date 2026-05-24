import { test as setup } from '@playwright/test';
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

  // Wait for either a successful redirect or an error alert
  await Promise.race([
    page.waitForURL(url => !url.toString().includes('/sign-in'), { timeout: 20_000 }),
    page.locator('[role="alert"]').waitFor({ state: 'visible', timeout: 20_000 }),
  ]).catch(() => {});

  if (page.url().includes('/sign-in')) {
    const errorMsg = await page.locator('[role="alert"]').textContent().catch(() => 'unknown error');
    throw new Error(
      `Login failed: "${errorMsg?.trim()}". ` +
      `Verify the test account exists on the live app with phone="${phone}" and the correct password.`
    );
  }

  await page.context().storageState({ path: authFile });
});
