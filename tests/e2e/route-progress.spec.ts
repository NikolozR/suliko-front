import { test, expect } from '@playwright/test';

/**
 * Regression tests for the top-of-page route transition bar.
 *
 * The bar used to be driven entirely by anchor clicks: it set a pending flag,
 * started creeping toward 90%, and only ever cleared when `usePathname`
 * changed. Any click that did not produce a pathname change — a link to the
 * current URL, a prevented default, a failed route, a query-string-only
 * transition — left it parked at 90% for the rest of the session.
 *
 * Not part of the CI `public` project: it exercises behaviour that must be
 * deployed before it can pass against the live URL.
 */

const BAR = '[data-testid="route-progress"]';

/**
 * The component attaches its listener in an effect, so the event is a no-op
 * until React has hydrated. Dispatch until the bar actually shows rather than
 * guessing at a fixed hydration delay — re-dispatching is a no-op while a
 * navigation is already pending.
 */
async function startProgressAfterHydration(page: import('@playwright/test').Page) {
  await page.waitForLoadState('networkidle');
  await expect(async () => {
    await page.evaluate(() =>
      window.dispatchEvent(new Event('suliko:route-progress-start'))
    );
    await expect(page.locator(BAR)).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15_000 });
}

test.describe('route transition progress bar', () => {
  test('always resolves, even when no navigation follows', async ({ page }) => {
    await page.goto('/');

    // Announce a navigation that will never happen — the exact situation that
    // used to hang the old bar at 90% permanently.
    await startProgressAfterHydration(page);

    // The bailout timer must take it down on its own.
    await expect(page.locator(BAR)).toHaveCount(0, { timeout: 12_000 });
  });

  test('runs the bar to 100% before it disappears', async ({ page }) => {
    // Hydration poll + the component's own 8s bailout + the fade-out all have
    // to fit inside one test.
    test.setTimeout(60_000);
    await page.goto('/');

    await startProgressAfterHydration(page);

    // Sample inside the page: a per-sample round trip through `getAttribute`
    // auto-waits for the element and would stall for its full timeout the
    // moment the bar unmounts.
    const widths: number[] = await page.evaluate(async (barSel) => {
      const seen: number[] = [];
      const deadline = Date.now() + 11_000;
      while (Date.now() < deadline) {
        const fill = document.querySelector<HTMLElement>(`${barSel} [style*="width"]`);
        if (!fill) break; // unmounted — the bar resolved
        const value = parseFloat(fill.style.width);
        if (!Number.isNaN(value)) seen.push(value);
        await new Promise((r) => setTimeout(r, 100));
      }
      return seen;
    }, BAR);

    expect(widths.length).toBeGreaterThan(3);
    // Starts at 20, creeps, and is capped at 90 until the navigation resolves.
    expect(Math.max(...widths.filter((w) => w < 100))).toBeLessThanOrEqual(90);
    // Only the resolve path can produce 100 — proof the bailout fired.
    expect(widths).toContain(100);
  });

  test('does not flash for a link pointing at the current URL', async ({ page }) => {
    await page.goto('/');

    // A same-URL anchor is not a navigation. The old handler started the bar
    // anyway and nothing was ever going to finish it.
    await page.evaluate(() => {
      const a = document.createElement('a');
      a.href = window.location.pathname + window.location.search;
      a.textContent = 'same url';
      a.setAttribute('data-testid', 'same-url-link');
      document.body.appendChild(a);
    });

    await page.click('[data-testid="same-url-link"]');
    await page.waitForTimeout(600); // comfortably past the 150ms show delay
    await expect(page.locator(BAR)).toHaveCount(0);
  });

  test('does not flash on a modified click that opens a new tab', async ({ page }) => {
    await page.goto('/');

    await page.evaluate(() => {
      const a = document.createElement('a');
      a.href = '/pricing';
      a.textContent = 'pricing';
      a.setAttribute('data-testid', 'new-tab-link');
      a.addEventListener('click', (e) => e.preventDefault());
      document.body.appendChild(a);
    });

    await page.click('[data-testid="new-tab-link"]', { modifiers: ['ControlOrMeta'] });
    await page.waitForTimeout(600);
    await expect(page.locator(BAR)).toHaveCount(0);
  });
});
