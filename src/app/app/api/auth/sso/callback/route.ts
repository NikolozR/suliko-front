// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { NextResponse } from "next/server";

import type { LoginOptions } from "@office/shared/auth/actions";
import {
  getLastOrganisation,
  SESSION_MAX_AGE_SECONDS,
  setLastOrganisation,
  setLoginTicket,
  setSessionCookie,
} from "@office/shared/auth/cookies";
import {
  adminChoice,
  automaticChoice,
  landingFor,
  type LoginResponse,
} from "@office/shared/auth/landing";
import {
  sameState,
  appUrl,
  ssoCallbackUrl,
  ssoEnabled,
  takeAttempt,
} from "@office/shared/auth/sso";
import { api, ApiError } from "@office/shared/lib/api";

/**
 * Back from suliko.ge with a one-time code. Checked against this browser's
 * attempt, redeemed by the API, and turned into the same login ticket a
 * password gives. Where the place to enter is clear — the organisation this
 * browser entered last, or the only one there is — the session is started
 * here and the chooser skipped; otherwise the chooser takes over.
 *
 * Every failure lands on the login page with a reason and WITHOUT the
 * automatic hop to suliko.ge, so a broken link can never become a loop.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const attempt = await takeAttempt();
  const locale = attempt?.locale ?? "ka";

  const back = (reason: string) => {
    const response = NextResponse.redirect(
      appUrl(`/${locale}/login?sso=${reason}`, url.origin),
    );
    response.headers.set("Cache-Control", "no-store");
    return response;
  };

  if (!ssoEnabled()) return back("failed");
  // No attempt: the cookie expired (a long detour on suliko.ge), or this
  // browser never started one — a link from somewhere else. Either way the
  // code is not this browser's to spend.
  if (!attempt) return back("expired");
  if (!sameState(attempt.state, url.searchParams.get("state")))
    return back("failed");

  const code = url.searchParams.get("code");
  if (!code) return back("failed");

  let options: LoginOptions;
  try {
    options = await api<LoginOptions>("/api/v1/auth/sso/exchange", {
      method: "POST",
      authenticated: false,
      body: {
        code,
        code_verifier: attempt.verifier,
        redirect_uri: ssoCallbackUrl(url.origin),
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) return back("expired");
      if (error.status === 429) return back("busy");
      // They asked for this account to be deleted, and it is closed meanwhile.
      if (error.code === "account_deletion_pending") return back("deletion");
      console.error(
        `[auth] sso exchange failed with ${error.status}: ${error.detail}`,
      );
      return back(error.status >= 500 ? "unavailable" : "failed");
    }
    console.error("[auth] sso exchange unreachable", error);
    return back("unavailable");
  }

  // On the way to /admin a superuser goes into the organisation that makes
  // them one, whichever they entered last. That visit is not remembered as
  // "last": a plain sign-in should keep going to where they work.
  const admin = adminChoice(options, attempt.next);
  const choice = admin ?? automaticChoice(options, await getLastOrganisation());
  if (choice) {
    try {
      const session = await api<LoginResponse>("/api/v1/auth/login/select", {
        method: "POST",
        authenticated: false,
        body: { ticket: options.ticket, ...choice },
      });
      await setSessionCookie(session.session_token, SESSION_MAX_AGE_SECONDS);
      if (!admin) await setLastOrganisation(session.tenant_slug);
      const response = NextResponse.redirect(
        appUrl(`/${locale}${landingFor(session, attempt.next)}`, url.origin),
      );
      response.headers.set("Cache-Control", "no-store");
      return response;
    } catch (error) {
      // The chooser can still do it, and says why if it cannot.
      console.error("[auth] automatic organisation choice failed", error);
    }
  }

  await setLoginTicket(options.ticket);
  const chooser = attempt.next
    ? `/${locale}/choose-account?next=${encodeURIComponent(attempt.next)}`
    : `/${locale}/choose-account`;
  const response = NextResponse.redirect(appUrl(chooser, url.origin));
  response.headers.set("Cache-Control", "no-store");
  return response;
}
