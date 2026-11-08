import type { BrowserContext, Page, Route } from '@playwright/test';

// A signed-in visitor without an account: a well-formed (unsigned) JWT in the
// places the app reads it from, and the API answered by the test. Nothing here
// touches the real backend, so it needs no secrets and spends no credits.
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');

/** The app reads the user id from the token's `sub`; the signature is never checked. */
export const FAKE_TOKEN = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: 'e2e-user', exp: 4102444800 })}.e2e`;

export const API_PATTERN = '**/content.api24.ge/api/**';

export const FAKE_PROFILE = {
  id: 'e2e-user',
  firstName: 'E2E',
  lastName: 'Tester',
  phoneNUmber: '+995500000000',
  email: 'e2e@suliko-test.dev',
  userName: 'e2e',
  roleId: '1',
  roleName: 'User',
  balance: 100,
};

export type ApiCall = { method: string; path: string; auth: string | null; body: string | null };

export async function signInAs(page: Page, context: BrowserContext, baseURL: string) {
  await page.addInitScript((token) => {
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({ state: { token, refreshToken: 'e2e-refresh' }, version: 0 }),
    );
  }, FAKE_TOKEN);
  await context.addCookies([{ name: 'token', value: FAKE_TOKEN, url: baseURL }]);
}

/**
 * Answers every API call. `handlers` gets first refusal, keyed by path; anything
 * unhandled gets the profile (for /User/...) or an empty list.
 */
export async function stubApi(
  page: Page,
  handlers: Record<string, (call: ApiCall, route: Route) => Promise<void> | void> = {},
): Promise<ApiCall[]> {
  const calls: ApiCall[] = [];
  await page.route(API_PATTERN, async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace(/^\/api/, '');
    const call: ApiCall = {
      method: req.method(),
      path,
      auth: (await req.headerValue('authorization')) ?? null,
      body: req.postData(),
    };
    calls.push(call);
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204 });
    const handler = handlers[path];
    if (handler) return handler(call, route);
    if (path.startsWith('/User/')) return route.fulfill({ json: FAKE_PROFILE });
    return route.fulfill({ status: 200, json: [] });
  });
  return calls;
}
