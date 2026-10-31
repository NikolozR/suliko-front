import { test, expect, type Page } from '@playwright/test';

// A guard for the accessibility basics the 2026-10-31 UX audit fixed, so they do not
// creep back: every visible control has a name, every visible field has a label, and a
// "Skip to content" link is the first Tab stop on a page that has a <main>.
// No extra dependency: this reads the DOM the way the audit script did.
const PAGES = ['', '/translate', '/office', '/notary', '/price', '/blog', '/help', '/sign-in', '/about'];

type Offender = { tag: string; html: string };

async function findUnnamed(page: Page): Promise<{ controls: Offender[]; fields: Offender[] }> {
  return page.evaluate(() => {
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
    };
    const nameOf = (el: Element) =>
      (
        el.getAttribute('aria-label') ||
        (el.getAttribute('aria-labelledby') &&
          document.getElementById(el.getAttribute('aria-labelledby') as string)?.textContent) ||
        el.textContent ||
        el.getAttribute('title') ||
        el.querySelector('img')?.getAttribute('alt') ||
        ''
      ).trim();
    const short = (el: Element): Offender => ({ tag: el.tagName.toLowerCase(), html: el.outerHTML.slice(0, 140) });

    const controls = [...document.querySelectorAll('a[href], button, [role="button"]')]
      .filter((el) => visible(el) && !el.closest('[aria-hidden="true"]'))
      .filter((el) => !nameOf(el))
      .map(short);

    // Range sliders are drawn over a video and can be visually thin: they still need a label.
    const fields = [...document.querySelectorAll('input, textarea, select')]
      .filter((el) => {
        const input = el as HTMLInputElement;
        if (input.type === 'hidden' || el.closest('[aria-hidden="true"]')) return false;
        return visible(el) || input.type === 'range' || input.type === 'file';
      })
      .filter((el) => {
        const input = el as HTMLInputElement;
        return !input.labels?.length && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby');
      })
      .map(short);

    return { controls, fields };
  });
}

test.describe('Accessibility basics on public pages', () => {
  for (const path of PAGES) {
    test(`/en${path}: controls have names and fields have labels`, async ({ page }) => {
      const response = await page.goto(`/en${path}`, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBe(200);
      // The sign-in page is a form with no h1, so wait for either.
      await expect(page.locator('h1, form').first()).toBeVisible({ timeout: 20_000 });
      // Let lazy sections (video, testimonials) mount before measuring.
      await page.waitForLoadState('networkidle').catch(() => {});

      const { controls, fields } = await findUnnamed(page);
      expect(controls, `Controls without an accessible name:\n${controls.map((c) => c.html).join('\n')}`).toEqual([]);
      expect(fields, `Fields without a label:\n${fields.map((f) => f.html).join('\n')}`).toEqual([]);
    });
  }

  for (const path of ['', '/translate', '/office', '/price']) {
    test(`/en${path}: the first Tab stop is "Skip to content" and it lands on main`, async ({ page }) => {
      await page.goto(`/en${path}`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 20_000 });
      await page.keyboard.press('Tab');
      const skip = page.locator('a[href="#main-content"]');
      await expect(skip).toBeFocused();
      await expect(skip).toBeVisible();
      await expect(page.locator('main#main-content')).toHaveCount(1);
    });
  }
});
