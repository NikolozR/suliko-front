import { test, expect } from '@playwright/test';

test.describe('API smoke tests', () => {

  test('GET /api/blog returns 200 with an array', async ({ request }) => {
    const res = await request.get('/api/blog');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /api/blog does not return 500', async ({ request }) => {
    const res = await request.get('/api/blog');
    expect(res.status()).not.toBe(500);
  });

  test('GET /api/passport-templates returns 200 with an array', async ({ request }) => {
    const res = await request.get('/api/passport-templates');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /api/passport-templates does not return 500', async ({ request }) => {
    const res = await request.get('/api/passport-templates');
    expect(res.status()).not.toBe(500);
  });

});
