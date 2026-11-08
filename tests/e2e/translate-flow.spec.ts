import { test, expect, type Page } from '@playwright/test';

// The text-translation flow, start to finish, against a stubbed backend.
//
// No real account and no credits are involved: the page is given a fake session
// and every call to the API is answered here. That keeps the core path (type text,
// pick a language, translate, read the result) in the blocking public suite, where
// a real-backend test cannot live. It checks the front end, not the translator.
const API = '**/content.api24.ge/api/**';

// The app reads the user id from the token's `sub`, so the stand-in has to be a
// well-formed JWT, though nothing ever checks its signature.
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
const TOKEN = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: 'e2e-user', exp: 4102444800 })}.e2e`;

const LANGUAGES = [
  { id: 1, name: 'English', nameGeo: 'ინგლისური' },
  { id: 2, name: 'German', nameGeo: 'გერმანული' },
  { id: 3, name: 'Georgian', nameGeo: 'ქართული' },
];

const PROFILE = {
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

type Seen = { method: string; path: string; auth: string | null; body: string | null };

async function stubBackend(page: Page, baseURL: string, translate: (seen: Seen) => { status: number; body: unknown }) {
  const seen: Seen[] = [];
  await page.addInitScript((token) => {
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({ state: { token, refreshToken: 'e2e-refresh' }, version: 0 }),
    );
  }, TOKEN);
  await page.context().addCookies([{ name: 'token', value: TOKEN, url: baseURL }]);
  await page.route(API, async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace(/^\/api/, '');
    const entry: Seen = {
      method: req.method(),
      path,
      auth: (await req.headerValue('authorization')) ?? null,
      body: req.postData(),
    };
    seen.push(entry);
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204 });
    if (path === '/Language') return route.fulfill({ json: LANGUAGES });
    if (path === '/UserContent/translate') {
      const r = translate(entry);
      return route.fulfill({ status: r.status, json: r.body });
    }
    if (path.startsWith('/User')) return route.fulfill({ json: PROFILE });
    return route.fulfill({ status: 200, json: [] });
  });
  return seen;
}

async function openText(page: Page) {
  await page.goto('/en/text', { waitUntil: 'domcontentloaded' });
  await expect(page.getByLabel('Text to translate')).toBeVisible({ timeout: 20_000 });
}

async function chooseTarget(page: Page, name: string) {
  // The second language picker is the target; it starts on English.
  await page.getByRole('button', { name: 'English' }).last().click();
  await page.getByRole('option', { name }).click();
}

test.describe('Text translation flow (stubbed backend)', () => {
  test('typing text, picking a language and translating shows the result', async ({ page, baseURL }) => {
    const seen = await stubBackend(page, baseURL!, () => ({ status: 200, body: { text: 'Hallo Welt', files: null } }));
    await openText(page);

    await page.getByLabel('Text to translate').fill('Hello world');
    await chooseTarget(page, 'German');
    await page.getByRole('button', { name: 'Translate', exact: true }).click();

    await expect(page.getByLabel('Translated text')).toHaveValue('Hallo Welt', { timeout: 15_000 });

    const call = seen.find((s) => s.path === '/UserContent/translate');
    expect(call, 'the translate endpoint was called').toBeTruthy();
    expect(call!.method).toBe('POST');
    expect(call!.auth).toBe(`Bearer ${TOKEN}`);
    expect(call!.body).toContain('Hello world');
    expect(call!.body).toMatch(/name="LanguageId"\s+2/);
  });

  test('Ctrl+Enter translates from the keyboard', async ({ page, baseURL }) => {
    const seen = await stubBackend(page, baseURL!, () => ({ status: 200, body: { text: 'Bonjour', files: null } }));
    await openText(page);

    await page.getByLabel('Text to translate').fill('Hello');
    await expect(page.getByText('100 Pages')).toBeVisible({ timeout: 15_000 }); // profile loaded
    await page.getByLabel('Text to translate').press('Control+Enter');

    await expect(page.getByLabel('Translated text')).toHaveValue('Bonjour', { timeout: 15_000 });
    // One keypress, one translation: a second request would be a second charge.
    expect(seen.filter((x) => x.path === '/UserContent/translate')).toHaveLength(1);
  });

  test('a refused translation shows the server message and no result', async ({ page, baseURL }) => {
    await stubBackend(page, baseURL!, () => ({
      status: 400,
      body: { message: 'Insufficient balance for this translation' },
    }));
    await openText(page);

    await page.getByLabel('Text to translate').fill('Hello world');
    await page.getByRole('button', { name: 'Translate', exact: true }).click();

    await expect(page.getByText(/insufficient|unexpected error/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByLabel('Translated text')).toHaveCount(0);
  });
});
