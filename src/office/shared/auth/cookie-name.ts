// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
/**
 * The session cookie name, on its own.
 *
 * Separate from `cookies.ts` because that module is `server-only` and imports
 * `next/headers`, neither of which middleware can use — middleware runs before
 * the request reaches the app. Both import this so the name cannot drift.
 */
export const SESSION_COOKIE = "suliko_session";
