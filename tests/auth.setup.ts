import { test as setup } from '@playwright/test';
import path from 'path';

const authFile = path.join('playwright', '.auth', 'user.json');

setup('authenticate as test user', async ({ page }) => {
  // Setup needs more time than regular tests due to API calls
  setup.setTimeout(120_000);

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

  // Wait for navigation, API error alert, OR Zod validation error
  await Promise.race([
    page.waitForURL(url => !url.toString().includes('/sign-in'), { timeout: 90_000 }),
    page.locator('[role="alert"]').waitFor({ state: 'visible', timeout: 90_000 }),
    page.locator('p[data-slot="form-message"]').waitFor({ state: 'visible', timeout: 90_000 }),
  ]).catch(() => {});

  if (page.url().includes('/sign-in')) {
    const apiError = await page.locator('[role="alert"]').textContent().catch(() => null);
    const validationError = await page.locator('p[data-slot="form-message"]').first().textContent().catch(() => null);
    if (validationError) {
      throw new Error(
        `Login blocked by form validation: "${validationError}". ` +
        `TEST_USER_PHONE must be exactly 9 digits starting with 5, no spaces (e.g. "591234567").`
      );
    }
    throw new Error(
      `Login failed: "${apiError ?? 'no error message shown'}". ` +
      `Verify the test account exists on the live app with phone="${phone}" and the correct password.`
    );
  }

  await page.context().storageState({ path: authFile });
});
