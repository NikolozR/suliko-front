import { test, expect } from '@playwright/test';
import { FAKE_TOKEN, signInAs, stubApi } from './helpers/fakeSession';

// Buying credits, up to the hand-off to the bank. The API is stubbed and the bank's
// page is a stand-in, so no real order is created and no money moves. What this
// guards is the part we own: the right amount goes out, signed in, and the visitor
// is sent where the API says; a failure leaves them on the page with a message.
const BANK = 'https://bank.example.test/pay/order-1';

test.describe('Buying credits (stubbed backend)', () => {
  test.beforeEach(async ({ page }) => {
    // The bank's page is somewhere we must never really go.
    await page.route(BANK, (route) =>
      route.fulfill({ contentType: 'text/html', body: '<h1>Bank checkout</h1>' }),
    );
  });

  for (const [plan, index, amount] of [['Starter', 0, 20], ['Professional', 1, 50]] as const) {
    test(`${plan} sends ${amount} to the API and continues to the bank`, async ({ page, context, baseURL }) => {
      await signInAs(page, context, baseURL!);
      const calls = await stubApi(page, {
        '/Payment/bog-create': (_call, route) =>
          route.fulfill({ json: { orderId: 'order-1', redirectUrl: BANK } }),
      });

      await page.goto('/en/price');
      await page.getByRole('button', { name: 'Buy Credits' }).nth(index).click();

      await expect(page).toHaveURL(BANK, { timeout: 15_000 });
      await expect(page.getByRole('heading', { name: 'Bank checkout' })).toBeVisible();

      const create = calls.filter((c) => c.path === '/Payment/bog-create');
      expect(create, 'exactly one order is created').toHaveLength(1);
      expect(create[0].method).toBe('POST');
      expect(create[0].auth).toBe(`Bearer ${FAKE_TOKEN}`);
      const body = JSON.parse(create[0].body ?? '{}');
      expect(body.amount).toBe(amount);
      expect(body.currency).toMatch(/^[A-Z]{3}$/);
      expect(body.locale).toBe('en');
    });
  }

  test('a visitor who is not signed in is sent to sign in, and no order is created', async ({ page }) => {
    const calls = await stubApi(page);

    await page.goto('/en/price');
    await page.getByRole('button', { name: 'Buy Credits' }).first().click();

    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 });
    expect(calls.filter((c) => c.path === '/Payment/bog-create')).toHaveLength(0);
  });

  test('when the API refuses, the visitor stays on the page with an error', async ({ page, context, baseURL }) => {
    await signInAs(page, context, baseURL!);
    await stubApi(page, {
      '/Payment/bog-create': (_call, route) =>
        route.fulfill({ status: 500, json: { message: 'boom' } }),
    });

    await page.goto('/en/price');
    await page.getByRole('button', { name: 'Buy Credits' }).first().click();

    await expect(page.getByText('Purchase failed. Please try again.')).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/en\/price/);
  });
});
