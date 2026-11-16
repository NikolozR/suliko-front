// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { NextResponse } from "next/server";

import { clearLoginTicket, clearSessionCookie, getSessionToken } from "@office/shared/auth/cookies";
import { appUrl, localeOrDefault, sulikoAddress, sulikoSiteOrigins } from "@office/shared/auth/sso";
import { api } from "@office/shared/lib/api";

/**
 * Office's half of signing out of suliko.ge: suliko.ge has forgotten the
 * person and sends the browser through here on its way back, so the Office
 * session ends too. Then on to `return_to`, if it is a suliko.ge address.
 *
 * Only for a navigation that came from suliko.ge (or from this site): a GET
 * that signs people out could otherwise be fired by any page that links here.
 * `Sec-Fetch-Site` covers suliko.ge, which is the same site; the referrer
 * covers suliko.io, which is not.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const back = sulikoAddress(url.searchParams.get("return_to"));
  const locale = localeOrDefault(url.searchParams.get("locale"));

  if (fromSuliko(request) && (await getSessionToken())) {
    try {
      await api("/api/v1/auth/logout", { method: "POST" });
    } catch {
      // Best effort, as on Office's own sign-out: the cookie goes regardless.
    }
    await clearSessionCookie();
    await clearLoginTicket();
  }

  const response = NextResponse.redirect(
    back ?? appUrl(`/${locale}/login?signed_out=1`, url.origin).toString(),
  );
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function fromSuliko(request: Request): boolean {
  const site = request.headers.get("sec-fetch-site");
  if (site === "same-origin" || site === "same-site") return true;
  const referer = request.headers.get("referer");
  if (!referer) return false;
  try {
    return sulikoSiteOrigins().includes(new URL(referer).origin);
  } catch {
    return false;
  }
}
