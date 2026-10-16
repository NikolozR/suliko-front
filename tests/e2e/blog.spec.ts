import { test, expect } from '@playwright/test';

// Post pages live at /en/blog/<slug>. The index links to them; the blog's own
// nav/header links never have a slug after /blog/.
const POST_LINK = 'main a[href^="/en/blog/"]';

test.describe('Blog', () => {

  test('/en/blog loads with heading', async ({ page }) => {
    await page.goto('/en/blog', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1').first()).toHaveText('Blog', { timeout: 30_000 });
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('index lists posts that link to post pages', async ({ page }) => {
    await page.goto('/en/blog', { waitUntil: 'networkidle' });
    const hrefs = await page.locator(POST_LINK).evaluateAll((links) =>
      links.map((a) => a.getAttribute('href')),
    );
    // The content API test guarantees the list endpoint answers; an empty blog is a
    // content decision, not a code fault, so skip rather than fail.
    test.skip(hrefs.length === 0, 'the blog has no published posts');
    for (const href of hrefs) expect(href).toMatch(/^\/en\/blog\/[a-z0-9-]+$/);
  });

  test('opening a post shows its title and body', async ({ page }) => {
    await page.goto('/en/blog', { waitUntil: 'networkidle' });
    const first = page.locator(POST_LINK).first();
    test.skip((await first.count()) === 0, 'the blog has no published posts');

    const href = await first.getAttribute('href');
    await first.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    const title = page.locator('h1').first();
    await expect(title).toBeVisible({ timeout: 30_000 });
    expect((await title.innerText()).trim().length).toBeGreaterThan(3);
    await expect(page.locator('article, main').first()).toContainText(/\w{3,}/);
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('every listed post answers 200', async ({ page, request }) => {
    await page.goto('/en/blog', { waitUntil: 'networkidle' });
    const hrefs = await page.locator(POST_LINK).evaluateAll((links) =>
      links.map((a) => a.getAttribute('href')),
    );
    test.skip(hrefs.length === 0, 'the blog has no published posts');
    for (const href of hrefs) {
      const res = await request.get(href!);
      expect(res.status(), href!).toBe(200);
    }
  });

  test('an unknown post slug is a 404', async ({ page }) => {
    const response = await page.goto('/en/blog/this-post-does-not-exist-xyz');
    expect(response?.status()).toBe(404);
  });

});
