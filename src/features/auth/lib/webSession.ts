/**
 * Web sessions: the browser's half.
 *
 * The "stay signed in" token never reaches this code. suliko.ge's own server
 * (`/api/session/*`) keeps it in an HttpOnly cookie and hands the page only a
 * 30-minute access token, so a script injected into the page cannot walk off
 * with a sign-in that lasts weeks. Where the store used to hold the refresh
 * token it now holds `SESSION_COOKIE_MARKER`: "a refresh is possible", which
 * every service's existing `if (refreshToken)` check still reads correctly.
 *
 * Off unless NEXT_PUBLIC_WEB_SESSIONS is "true"; until then sign-in works as
 * before, straight against the backend.
 */

export const WEB_SESSIONS = process.env.NEXT_PUBLIC_WEB_SESSIONS === "true";

/** Stands in for the refresh token, which lives in an HttpOnly cookie. */
export const SESSION_COOKIE_MARKER = "httponly-cookie";

export interface SessionTokens {
  token: string;
  refreshToken: string;
  hasSeenRegistrationBonus?: boolean;
}

export interface SessionResult {
  ok: boolean;
  status: number;
  data: unknown;
}

/** POST to this site's session routes. Same origin, so the cookie goes along. */
export async function sessionPost(
  action: "login" | "google" | "adopt" | "refresh" | "sign-out",
  body?: unknown,
  init: { keepalive?: boolean } = {},
): Promise<SessionResult> {
  const response = await fetch(`/api/session/${action}`, {
    method: "POST",
    credentials: "same-origin",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    keepalive: init.keepalive,
  });
  const data = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, data };
}

let inFlight: Promise<SessionTokens> | null = null;

/**
 * A fresh access token from the cookie. One at a time per tab; a 409 means
 * another tab replaced the token a moment ago, and its cookie is the one to
 * use, so one more try.
 */
export function refreshWebSession(): Promise<SessionTokens> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      let result = await sessionPost("refresh");
      if (result.status === 409) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        result = await sessionPost("refresh");
      }
      if (!result.ok) throw new Error(`Session refresh failed (${result.status})`);
      return result.data as SessionTokens;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

/** Seconds until a JWT expires (negative once it has), or null if it cannot be read. */
export function secondsLeft(token: string | null): number | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const exp = (JSON.parse(json) as { exp?: number }).exp;
    return typeof exp === "number" ? exp - Date.now() / 1000 : null;
  } catch {
    return null;
  }
}
