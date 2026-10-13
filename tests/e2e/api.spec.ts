import { test, expect } from '@playwright/test';

// The blog and the passport templates the site reads from the API. They used to come from
// Supabase through /api/blog and /api/passport-templates on the site itself.
const API = process.env.API_BASE_URL ?? 'https://content.api24.ge/api';

test.describe('Site content API', () => {

  test('published blog posts are public', async ({ request }) => {
    const res = await request.get(`${API}/Blog/posts`);
    expect(res.status()).toBe(200);
    expect(Array.isArray(await res.json())).toBe(true);
  });

  test('active passport templates are public', async ({ request }) => {
    const res = await request.get(`${API}/PassportTemplate?active=true`);
    expect(res.status()).toBe(200);
    expect(Array.isArray(await res.json())).toBe(true);
  });

  test('every blog post, drafts included, needs an admin', async ({ request }) => {
    const res = await request.get(`${API}/Blog/admin/posts`);
    expect(res.status()).toBe(401);
  });

});
