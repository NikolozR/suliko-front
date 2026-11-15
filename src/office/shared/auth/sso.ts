// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { routing } from "@office/i18n/routing";
import { BASE_PATH, withBasePath } from "@office/shared/lib/base-path";

/**
 * Sign-in through suliko.ge — the one place anybody types a password.
 *
 *   1. `/api/auth/sso/start` makes a `state` and a PKCE verifier, keeps both in
 *      an HttpOnly cookie, and sends the browser to suliko.ge's gateway page
 *      with the callback address and the verifier's S256 challenge.
 *   2. suliko.ge signs the person in if they are not already (password or
 *      Google), gets a one-time code bound to that callback and challenge, and
 *      sends the browser back with it.
 *   3. `/api/auth/sso/callback` checks `state` against the cookie and hands the
 *      code and verifier to the API (`POST /auth/sso/exchange`), which redeems
 *      it with suliko.ge server to server. The answer is the same login ticket
 *      a password gives, and the organisation chooser takes over.
 *
 * The code is useless without the verifier, which never leaves this server
 * and the person's own cookie; `state` stops anyone pushing their code into
 * someone else's browser. Off unless SULIKO_SSO_ENABLED is "true", so this
 * can ship before suliko.ge's side does.
 */

export function ssoEnabled(): boolean {
  return process.env.SULIKO_SSO_ENABLED === "true";
}

export function sulikoSiteUrl(): string {
  return (process.env.SULIKO_SITE_URL ?? "https://suliko.ge").replace(
    /\/$/,
    "",
  );
}

/**
 * Where suliko.ge sends the code. Must be on suliko.ge's list of addresses,
 * character for character (`Office:SsoRedirectUris` there).
 */
export function ssoCallbackUrl(requestOrigin: string): string {
  return appUrl("/api/auth/sso/callback", requestOrigin).toString();
}

/**
 * An address of this app as the BROWSER knows it: the public origin
 * (`APP_URL`, else the request's own) and the base path. Route handlers
 * redirect through this. Behind suliko.ge the request's own origin is this
 * deployment's name, which the browser must not be sent to.
 */
export function appUrl(path: string, requestOrigin: string): URL {
  const origin = (process.env.APP_URL ?? requestOrigin).replace(/\/$/, "");
  return new URL(`${origin}${BASE_PATH}${path}`);
}

export function localeOrDefault(raw: string | null | undefined): string {
  return raw && (routing.locales as readonly string[]).includes(raw)
    ? raw
    : routing.defaultLocale;
}

const SSO_COOKIE = "suliko_sso";
export const SSO_COOKIE_PATH = `${BASE_PATH}/api/auth/sso`;
/** Long enough to register on suliko.ge on the way. */
const SSO_COOKIE_MAX_AGE_SECONDS = 15 * 60;

/** What the browser carries to suliko.ge and back, kept on this side. */
export interface SsoAttempt {
  state: string;
  verifier: string;
  /** Where to go once signed in — already passed through `safeNextPath`. */
  next: string | null;
  locale: string;
}

function base64url(bytes: Buffer): string {
  return bytes.toString("base64url");
}

export function challengeFor(verifier: string): string {
  return base64url(createHash("sha256").update(verifier, "ascii").digest());
}

export function newAttempt(next: string | null, locale: string): SsoAttempt {
  return {
    // 43 characters each: RFC 7636's minimum verifier length, 256 bits.
    state: base64url(randomBytes(32)),
    verifier: base64url(randomBytes(32)),
    next,
    locale,
  };
}

export async function saveAttempt(attempt: SsoAttempt): Promise<void> {
  (await cookies()).set(
    SSO_COOKIE,
    base64url(Buffer.from(JSON.stringify(attempt))),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      // Lax, not Strict: the callback is a top-level navigation FROM suliko.ge,
      // and Strict would leave the cookie behind.
      sameSite: "lax",
      path: SSO_COOKIE_PATH,
      maxAge: SSO_COOKIE_MAX_AGE_SECONDS,
    },
  );
}

export async function takeAttempt(): Promise<SsoAttempt | null> {
  const store = await cookies();
  const raw = store.get(SSO_COOKIE)?.value;
  // Spent on first sight, whatever happens next: one attempt, one callback.
  store.set(SSO_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: SSO_COOKIE_PATH,
    maxAge: 0,
  });
  if (!raw) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8"),
    ) as Partial<SsoAttempt>;
    if (typeof parsed.state !== "string" || typeof parsed.verifier !== "string")
      return null;
    return {
      state: parsed.state,
      verifier: parsed.verifier,
      next: typeof parsed.next === "string" ? parsed.next : null,
      locale: localeOrDefault(parsed.locale),
    };
  } catch {
    return null;
  }
}

export function sameState(expected: string, presented: string | null): boolean {
  if (!presented) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(presented);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** suliko.ge's gateway page for this attempt. */
export interface GatewayOptions {
  /** Show suliko.ge's form even to someone signed in there. */
  forceSignIn?: boolean;
  /** Open that form on registration rather than sign-in. */
  register?: boolean;
  /** A restart after a timeout: allowed once in a row (see the start route). */
  retry?: boolean;
}

export function gatewayUrl(
  attempt: SsoAttempt,
  callbackUrl: string,
  options: GatewayOptions = {},
): string {
  const url = new URL(`${sulikoSiteUrl()}/${attempt.locale}/sso/office`);
  url.searchParams.set("redirect_uri", callbackUrl);
  url.searchParams.set("state", attempt.state);
  url.searchParams.set("code_challenge", challengeFor(attempt.verifier));
  url.searchParams.set("code_challenge_method", "S256");
  if (options.forceSignIn || options.register) url.searchParams.set("prompt", "login");
  if (options.register) url.searchParams.set("mode", "register");
  return url.toString();
}

/** The path that starts sign-in through suliko.ge, for a link or a redirect. */
export function ssoStartPath(
  locale: string,
  next: string | null,
  options: GatewayOptions = {},
): string {
  const query = new URLSearchParams({ locale });
  if (next) query.set("next", next);
  if (options.forceSignIn) query.set("prompt", "login");
  if (options.register) query.set("mode", "register");
  if (options.retry) query.set("retry", "1");
  return `/api/auth/sso/start?${query.toString()}`;
}

/** The same, for a plain `<a href>`, which Next does not prefix. */
export function ssoStartHref(
  locale: string,
  next: string | null,
  options: GatewayOptions = {},
): string {
  return withBasePath(ssoStartPath(locale, next, options));
}

// ── Signing out of both ─────────────────────────────────────────────────────
//
// One sign-in, so one sign-out: leaving Office passes through suliko.ge's
// `/sso/signout` (which forgets the person there and comes back), and leaving
// suliko.ge passes through `/api/auth/sso/signout` here.

/**
 * suliko.ge's own addresses — where a sign-out started there may return to.
 * `SULIKO_SITE_ORIGINS` (comma-separated) replaces the default list.
 */
export function sulikoSiteOrigins(): string[] {
  const configured = (process.env.SULIKO_SITE_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);
  if (configured.length > 0) return configured;
  return [
    new URL(sulikoSiteUrl()).origin,
    "https://suliko.ge",
    "https://www.suliko.ge",
    "https://suliko.io",
    "https://www.suliko.io",
  ];
}

/** `value` if it is an address on suliko.ge, else null. */
export function sulikoAddress(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return sulikoSiteOrigins().includes(url.origin) ? url.toString() : null;
  } catch {
    return null;
  }
}

/** suliko.ge's half of signing out, coming back to `returnTo` here. */
export function sulikoSignOutUrl(locale: string, returnTo: string): string {
  const url = new URL(`${sulikoSiteUrl()}/${locale}/sso/signout`);
  url.searchParams.set("return_to", returnTo);
  return url.toString();
}
