import { test, expect } from '@playwright/test';

test.describe('Referral page', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/en/referral', { waitUntil: 'domcontentloaded' });
    await page.locator('input[name="name"]').waitFor({ state: 'visible', timeout: 15_000 });
  });

  test('form has name and phone inputs', async ({ page }) => {
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="phone"]')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('submit is disabled until the form is filled in', async ({ page }) => {
    // Never submitted: that would register a real referral.
    const submit = page.getByRole('button', { name: 'Submit', exact: true });
    await expect(submit).toBeDisabled();

    await page.locator('input[name="name"]').fill('Test Person');
    await page.locator('input[name="phone"]').fill('591234567');
    await expect(submit).toBeEnabled();
  });

});
