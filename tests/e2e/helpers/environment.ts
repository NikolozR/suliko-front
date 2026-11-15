import { test } from '@playwright/test';

/**
 * Where the tests are running. On a pull request they run against that PR's Vercel
 * preview, which by design has none of the production-only secrets (the web-session
 * key, the Office portal secret, the partner order key, ...). On production they
 * must all be there.
 */
const PRODUCTION_HOSTS = ['suliko-front-five.vercel.app', 'suliko.ge', 'www.suliko.ge', 'suliko.io', 'www.suliko.io'];

export const isProduction = (baseURL: string | undefined): boolean => {
  try {
    return PRODUCTION_HOSTS.includes(new URL(baseURL ?? '').hostname);
  } catch {
    return false;
  }
};

/**
 * Skips the test when a preview answers "I am not configured" (503, or 500 for the
 * routes that report a missing key that way). On production
 * the same answer is a real failure, so nothing is skipped there.
 */
export function skipIfPreviewUnconfigured(status: number, baseURL: string | undefined, what: string) {
  test.skip(
    (status === 503 || status === 500) && !isProduction(baseURL),
    `${what} is not configured on preview deployments`,
  );
}
