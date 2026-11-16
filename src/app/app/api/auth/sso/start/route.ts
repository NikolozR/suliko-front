// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { safeNextPath } from "@office/shared/auth/next-path";
import {
  appUrl,
  gatewayUrl,
  localeOrDefault,
  newAttempt,
  saveAttempt,
  SSO_COOKIE_PATH,
  ssoCallbackUrl,
  ssoEnabled,
} from "@office/shared/auth/sso";
import { BASE_PATH } from "@office/shared/lib/base-path";

/** Set when a silent restart has been made, so a second one is refused. */
const RETRY_COOKIE = "suliko_sso_retried";
const RETRY_WINDOW_SECONDS = 120;

/**
 * Begin signing in through suliko.ge: remember this attempt in an HttpOnly
 * cookie and send the browser to suliko.ge's gateway. See `shared/auth/sso.ts`.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const locale = localeOrDefault(url.searchParams.get("locale"));
  if (!ssoEnabled()) {
    return NextResponse.redirect(appUrl(`/${locale}/login`, url.origin));
  }

  // The attempt is kept in a cookie on THIS host and checked on the callback's
  // host (APP_URL). Started anywhere else (the old app.suliko.ge address, www),
  // the cookie is never seen on the way back and the person lands on "took too
  // long". Start again on the callback's own host instead.
  // `hop` stops it going round twice should the two ever disagree about names.
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const callback = new URL(ssoCallbackUrl(url.origin));
  if (host && callback.host !== host && !url.searchParams.has("hop")) {
    const target = new URL(`${BASE_PATH}/api/auth/sso/start`, callback.origin);
    url.searchParams.forEach((value, key) => target.searchParams.set(key, value));
    target.searchParams.set("hop", "1");
    const response = NextResponse.redirect(target);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  // `retry=1`: the app restarts the sign-in by itself after a ticket ran out,
  // which silently finishes where suliko.ge still knows the person. Once.
  // A second restart in a row would mean something is broken, and the page
  // says so instead of looping.
  if (url.searchParams.get("retry") === "1") {
    const store = await cookies();
    if (store.get(RETRY_COOKIE)) {
      store.set(RETRY_COOKIE, "", { path: SSO_COOKIE_PATH, maxAge: 0 });
      return NextResponse.redirect(appUrl(`/${locale}/login?sso=expired`, url.origin));
    }
    store.set(RETRY_COOKIE, "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: SSO_COOKIE_PATH,
      maxAge: RETRY_WINDOW_SECONDS,
    });
  }

  const next = safeNextPath(url.searchParams.get("next"));
  const attempt = newAttempt(next, locale);
  await saveAttempt(attempt);

  const target = gatewayUrl(attempt, ssoCallbackUrl(url.origin), {
    forceSignIn: url.searchParams.get("prompt") === "login",
    register: url.searchParams.get("mode") === "register",
  });
  const response = NextResponse.redirect(target);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
