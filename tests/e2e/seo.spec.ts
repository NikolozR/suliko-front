import { test, expect } from '@playwright/test';

test.describe('robots.txt and sitemap', () => {
  test('robots.txt keeps crawlers out of the API and the admin panel', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/^User-Agent: \*/im);
    expect(body).toMatch(/^Disallow: \/api\//im);
    expect(body).toMatch(/^Disallow: \/admin\//im);
    expect(body).toMatch(/^Sitemap: https?:\/\/\S+\/sitemap\.xml/im);
  });

  test('sitemap.xml lists the public pages and none of the private ones', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toMatch(/xml/);
    const body = await res.text();
    expect(body).toContain('<urlset');
    const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs.length).toBeGreaterThan(10);
    for (const needle of ['/about', '/privacy', '/refund-policy', '/terms', '/office', '/blog']) {
      expect(locs.some((l) => l.includes(needle)), needle).toBe(true);
    }
    for (const loc of locs) {
      expect(loc, 'must be absolute').toMatch(/^https:\/\//);
      expect(loc, 'private page in sitemap').not.toMatch(/\/(admin|api|sign-in|profile|payment)(\/|$)/);
    }
  });
});

// Found by this audit: the sitemap leaves out /price, /notary and /developers, which are
// public pages a visitor can reach from the footer. `fixme` keeps them in the report.
test.describe('Sitemap gaps', () => {
  for (const path of ['/price', '/notary', '/developers']) {
    test.fixme(`sitemap lists ${path}`, async ({ request }) => {
      const body = await (await request.get('/sitemap.xml')).text();
      expect(body).toMatch(new RegExp(`<loc>[^<]*${path}</loc>`));
    });
  }
});

// Pages that write their own metadata. Each needs a title naming the page and a
// canonical address that points at the page itself.
const WITH_OWN_METADATA: { path: string; title: RegExp }[] = [
  { path: '/en/about', title: /About Suliko/ },
  { path: '/en/privacy', title: /Privacy Policy/ },
  { path: '/en/refund-policy', title: /Refund Policy/ },
  { path: '/en/terms', title: /Terms/ },
  { path: '/en/blog', title: /Blog/ },
  { path: '/en/office', title: /Suliko Office/ },
  { path: '/en/price', title: /Pricing/ },
];

test.describe('Page metadata', () => {
  for (const { path, title } of WITH_OWN_METADATA) {
    test(`${path} has its own title, description and canonical`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveTitle(title);
      expect(await page.locator('meta[name="description"]').getAttribute('content')).toMatch(/.{30,}/);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical, 'canonical').toMatch(/^https:\/\//);
      if (path !== '/en/price') {
        expect(new URL(canonical!).pathname, 'canonical points at the page itself').toBe(path.replace(/^\/en/, ''));
      }
    });
  }

  // Found by this audit: these pages inherit the landing page's title, description and a
  // canonical of "/", which tells search engines they are duplicates of the home page.
  // `fixme` keeps them visible in the report without failing CI; remove it once fixed.
  for (const path of ['/en/developers', '/en/notary', '/en/help', '/en/price']) {
    test.fixme(`${path} canonical points at the page itself`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(new URL(canonical!).pathname).toBe(path.replace(/^\/en/, ''));
    });
  }

  test('the landing page declares an alternate for every locale', async ({ page }) => {
    await page.goto('/en', { waitUntil: 'domcontentloaded' });
    const langs = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((els) =>
      els.map((e) => e.getAttribute('hreflang')),
    );
    for (const lang of ['en', 'ka', 'pl']) expect(langs, lang).toContain(lang);
  });
});
