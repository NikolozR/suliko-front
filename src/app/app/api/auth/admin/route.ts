// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { NextResponse } from "next/server";

import { SESSION_MAX_AGE_SECONDS, setSessionCookie } from "@office/shared/auth/cookies";
import {
  ADMIN_PATH,
  adminOrganisation,
  isAdminPath,
  landingFor,
  type LoginResponse,
} from "@office/shared/auth/landing";
import { safeNextPath } from "@office/shared/auth/next-path";
import { getSession } from "@office/shared/auth/session";
import { localeOrDefault } from "@office/shared/auth/sso";
import { api } from "@office/shared/lib/api";
import { deniedQuery } from "@office/shared/lib/flash";
import { appUrl } from "@office/shared/auth/sso";

/**
 * Into the admin console from another organisation.
 *
 * A superuser's membership sits in one organisation. Opening /admin while
 * signed in to a different one (their own bureau, their personal account)
 * comes through here: the session is moved to that organisation exactly as the
 * switcher would move it (`POST /auth/switch`, which only ever moves someone
 * between their own memberships), and the browser goes back to the console.
 * `requireAdmin` in `shared/auth/guards.ts` is what sends people here.
 *
 * It is a GET that changes which organisation the session is in. That is what
 * opening /admin means; it reaches nothing the person could not reach from the
 * switcher, and it answers with a redirect to a page of this site, never data.
 *
 * Unlike the switcher this does not become "the organisation entered last":
 * the console is reached by its own address, and a plain sign-in should keep
 * going to where the person works.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const locale = localeOrDefault(url.searchParams.get("locale"));
  // Only ever back into the console: this is not a general "switch and go".
  const requested = safeNextPath(url.searchParams.get("next"));
  const next = requested && isAdminPath(requested) ? requested : ADMIN_PATH;

  const to = (path: string) => {
    const response = NextResponse.redirect(appUrl(`/${locale}${path}`, url.origin));
    response.headers.set("Cache-Control", "no-store");
    return response;
  };
  const denied = () => to(`/dashboard?${deniedQuery("role")}`);

  const session = await getSession();
  if (!session) return to(`/login?from=${encodeURIComponent(`/${locale}${next}`)}`);
  if (session.permissions.includes("platform.tenants")) return to(next);

  const admin = adminOrganisation(session.organizations);
  // No superuser membership — or already in it and still refused, where
  // switching again would only loop.
  if (!admin || admin.tenant_slug === session.tenantSlug) return denied();

  let result: LoginResponse;
  try {
    result = await api<LoginResponse>("/api/v1/auth/switch", {
      method: "POST",
      body: { tenant_slug: admin.tenant_slug },
    });
  } catch (error) {
    console.error("[auth] could not enter the admin organisation", error);
    return denied();
  }

  await setSessionCookie(result.session_token, SESSION_MAX_AGE_SECONDS);
  return to(landingFor(result, next));
}
