// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import "server-only";

import { cookies } from "next/headers";

/**
 * The session cookie.
 *
 * It holds the opaque session token issued by the API — not a JWT, and not
 * anything the browser can read or decode. Revocation is a single UPDATE on
 * the server, which matters when a role changes or someone is offboarded.
 */

export { SESSION_COOKIE } from "@office/shared/auth/cookie-name";
import { SESSION_COOKIE } from "@office/shared/auth/cookie-name";

/**
 * `__Host-` would be stricter, but it forbids a Domain attribute and requires
 * Path=/, which is fine — except it also breaks on http://localhost in some
 * browsers during development. The plain name plus the flags below gives the
 * same practical protection here.
 */
const isProduction = process.env.NODE_ENV === "production";

export async function setSessionCookie(token: string, maxAgeSeconds: number): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, // never readable from JavaScript
    secure: isProduction, // https only in production
    sameSite: "lax", // the app makes no legitimate cross-site POST
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function clearSessionCookie(): Promise<void> {
  // Overwrite with an expired value rather than delete(), so a stale cookie
  // cannot survive in an edge cache.
  (await cookies()).set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

/**
 * Matches SESSION_ABSOLUTE_TIMEOUT_HOURS on the API (default 12h).
 *
 * The cookie lifetime is a convenience only — the API enforces both the idle
 * and the absolute timeout server-side. A cookie that outlives its session
 * simply produces a 401 and a redirect to login.
 */
export const SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;

/**
 * Between the two sign-in steps: the API's proof that the password was just
 * accepted, while the person picks an organisation. HttpOnly like the session,
 * and as short-lived as the ticket itself (ten minutes, enforced by the API).
 */
const LOGIN_TICKET_COOKIE = "suliko_login_ticket";

export async function setLoginTicket(ticket: string): Promise<void> {
  (await cookies()).set(LOGIN_TICKET_COOKIE, ticket, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
}

export async function getLoginTicket(): Promise<string | undefined> {
  return (await cookies()).get(LOGIN_TICKET_COOKIE)?.value;
}

export async function clearLoginTicket(): Promise<void> {
  (await cookies()).set(LOGIN_TICKET_COOKIE, "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * The organisation (its slug) this browser last entered, so the next sign-in
 * can go straight back there instead of through the chooser. A preference,
 * not a credential: it only ever selects among the person's own memberships,
 * which the API checks at that moment.
 */
const LAST_ORGANISATION_COOKIE = "suliko_last_org";

export async function setLastOrganisation(slug: string): Promise<void> {
  if (!slug) return;
  (await cookies()).set(LAST_ORGANISATION_COOKIE, slug, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 365 * 24 * 60 * 60,
  });
}

export async function getLastOrganisation(): Promise<string | undefined> {
  return (await cookies()).get(LAST_ORGANISATION_COOKIE)?.value;
}
