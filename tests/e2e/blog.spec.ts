import { test, expect } from '@playwright/test';

test.describe('Blog', () => {

  test('/en/blog loads with heading', async ({ page }) => {
    await page.goto('/en/blog', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('/en/blog shows post cards or empty state', async ({ page }) => {
    await page.goto('/en/blog', { waitUntil: 'domcontentloaded' });
    // Either post links or an empty/no-posts message is visible
    const hasPosts = await page.locator('a[href*="/blog/"]').count();
    if (hasPosts === 0) {
      // No posts — just confirm the page itself rendered without crashing
      await expect(page.locator('body')).not.toContainText('Application error');
    } else {
      await expect(page.locator('a[href*="/blog/"]').first()).toBeVisible();
    }
  });

  test('clicking a blog post card opens the post', async ({ page }) => {
    await page.goto('/en/blog', { waitUntil: 'domcontentloaded' });
    const firstPost = page.locator('a[href*="/blog/"]').first();
    if (await firstPost.count() === 0) {
      test.skip();
      return;
    }
    await firstPost.click();
    await expect(page).toHaveURL(/\/blog\/.+/);
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('blog post page shows a title', async ({ page }) => {
    await page.goto('/en/blog', { waitUntil: 'domcontentloaded' });
    const firstPost = page.locator('a[href*="/blog/"]').first();
    if (await firstPost.count() === 0) {
      test.skip();
      return;
    }
    await firstPost.click();
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 30_000 });
  });

  test('blog post page has no 404 or error', async ({ page }) => {
    await page.goto('/en/blog', { waitUntil: 'domcontentloaded' });
    const firstPost = page.locator('a[href*="/blog/"]').first();
    if (await firstPost.count() === 0) {
      test.skip();
      return;
    }
    const href = await firstPost.getAttribute('href');
    if (href) {
      const response = await page.goto(href, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).not.toBe(404);
      await expect(page.locator('body')).not.toContainText('Application error');
    }
  });

});
