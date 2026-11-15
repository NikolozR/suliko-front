// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
/**
 * The path this app is mounted under, when it is served as a part of
 * suliko.ge (`/app`) rather than at the root of its own address. Empty
 * otherwise. Set at build time with NEXT_PUBLIC_BASE_PATH; next.config.ts
 * gives the same value to Next as `basePath`.
 *
 * Next adds it by itself to `<Link>`, `router.push`, `redirect()`, its own
 * assets and images. It does NOT add it to a plain `<a href>`, to
 * `window.open`, to a cookie's `path`, or to a URL built with `new URL`:
 * those go through `withBasePath`.
 */
// Inside suliko.ge Office is always under /app.
export const BASE_PATH = "/app";

/** `path` (starting with a slash) as the browser has to ask for it. */
export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`;
}
