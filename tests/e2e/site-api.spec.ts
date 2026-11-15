import { test, expect } from '@playwright/test';
import { skipIfPreviewUnconfigured } from './helpers/environment';

/**
 * The site's own API routes, called without credentials. Nothing here can
 * succeed in doing real work: every case is a request the route must refuse, so
 * no email is sent and no session is created.
 */

test.describe('Web session routes (/api/session/*)', () => {
  // Only this site's own pages may call them: a cross-site or origin-less POST gets nothing.
  test('refuse a POST without an Origin header', async ({ request, baseURL }) => {
    const res = await request.post('/api/session/login', { data: {} });
    skipIfPreviewUnconfigured(res.status(), baseURL, 'the web session');
    expect(res.status()).toBe(403);
    expect(await res.json()).toEqual({ error: 'forbidden' });
  });

  test('refuse a POST from another origin', async ({ request, baseURL }) => {
    const res = await request.post('/api/session/refresh', {
      data: {},
      headers: { origin: 'https://evil.example' },
    });
    skipIfPreviewUnconfigured(res.status(), baseURL, 'the web session');
    expect(res.status()).toBe(403);
  });

  test('refresh without the session cookie is a 401 invalid_grant', async ({ request, baseURL }) => {
    const res = await request.post('/api/session/refresh', { headers: { origin: new URL(baseURL!).origin } });
    skipIfPreviewUnconfigured(res.status(), baseURL, 'the web session');
    expect(res.status()).toBe(401);
    expect(await res.json()).toEqual({ error: 'invalid_grant' });
  });

  test('an unknown action is a 404', async ({ request, baseURL }) => {
    const res = await request.post('/api/session/nope', { headers: { origin: new URL(baseURL!).origin } });
    skipIfPreviewUnconfigured(res.status(), baseURL, 'the web session');
    expect(res.status()).toBe(404);
  });

  test('login does not take GET', async ({ request, baseURL }) => {
    const res = await request.get('/api/session/login');
    skipIfPreviewUnconfigured(res.status(), baseURL, 'the web session');
    expect(res.status()).toBe(405);
  });
});

test.describe('Email routes validate before they send', () => {
  test('newsletter rejects a missing or malformed address', async ({ request }) => {
    for (const data of [{}, { email: 'not-an-email' }, { email: 42 }]) {
      const res = await request.post('/api/newsletter', { data });
      expect(res.status(), JSON.stringify(data)).toBe(400);
      expect(await res.json()).toEqual({ error: 'A valid email address is required.' });
    }
  });

  test('contact rejects a request with missing fields', async ({ request }) => {
    const res = await request.post('/api/contact', { data: { email: 'a@b.co' } });
    expect(res.status()).toBe(400);
  });
});

test.describe('Office portal routes need a signed-in translator', () => {
  for (const path of ['/api/office/assignments', '/api/office/orders/some-bureau/1']) {
    test(`GET ${path} is a 401`, async ({ request, baseURL }) => {
      const res = await request.get(path);
      skipIfPreviewUnconfigured(res.status(), baseURL, 'the Office portal');
      expect(res.status()).toBe(401);
    });
  }
});
