// Owned by suliko-front: requireSession keeps the page to come back to.
import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { withBasePath } from "@office/shared/lib/base-path";

import { redirectTo } from "@office/i18n/navigation";
import { deniedQuery } from "@office/shared/lib/flash";
import { ADMIN_PATH, adminOrganisation } from "@office/shared/auth/landing";
import type { Permission } from "@office/shared/auth/permissions";
import { getSession, type Session } from "@office/shared/auth/session";

/**
 * Route guards for Server Components.
 *
 * `<Can>` hides UI. These stop a page from rendering at all — which is what a
 * direct navigation to `/clients/new` needs, since hiding the button that
 * links there protects nothing.
 *
 * Neither is a security boundary. The API re-checks every permission on every
 * request; these exist so the user gets a sensible screen instead of a page
 * full of 403s.
 */

/** The session, or a redirect to login. For pages that need the user. */
export async function requireSession(locale: string): Promise<Session> {
  const session = await getSession();
  if (!session) return signInAgain(locale);
  return session;
}

/**
 * The cookie was there but the session has ended: sign in again and come back
 * to this page, not to the dashboard. (No cookie at all is caught earlier, by
 * office-zone.ts, which passes `from` too.) Used by the (office) layout as well.
 */
export async function signInAgain(locale: string): Promise<never> {
  let from = "";
  try {
    // Set by office-zone.ts on every page request: the clean address.
    from = (await headers()).get("x-pathname") ?? "";
  } catch {
    // Not in a request: nowhere to come back to.
  }
  redirectTo(from ? `/login?from=${encodeURIComponent(from)}` : "/login", locale);
}

/**
 * Require a permission, or bounce to the dashboard.
 *
 * Dashboard rather than a 403 page: every role can see the dashboard, so the
 * user lands somewhere useful instead of a dead end. Reaching here at all
 * usually means a stale link or a bookmark from a former role.
 */
export async function requirePermission(
  permission: Permission,
  locale: string,
): Promise<Session> {
  const session = await requireSession(locale);
  if (!session.permissions.includes(permission)) {
    // Say why on arrival, instead of a silent bounce (audit F17). On the
    // Freelancer plan the owner has every permission their role allows, so
    // a refusal there is the plan's; on the Bureau plan it is the role's.
    redirectTo(`/dashboard?${deniedQuery(session.plan === "freelancer" ? "plan" : "role")}`, locale);
  }
  return session;
}

/** The route handler that moves a session into the superuser membership. */
export function adminEntryPath(locale: string, next: string = ADMIN_PATH): string {
  return `/api/auth/admin?${new URLSearchParams({ locale, next })}`;
}

/**
 * The admin console's guard: a superuser's session, however they arrived.
 *
 * /admin is an address of its own, so someone who is a superuser must get in
 * from wherever they are signed in. Their superuser membership sits in one
 * organisation; signed in to another (their own bureau, their personal
 * account) they are moved into that one and brought back here, instead of
 * being told they have no access. Anyone without such a membership is bounced
 * to the dashboard like every other gated route.
 *
 * `path` is the screen being opened, without a locale, to come back to.
 */
export async function requireAdmin(locale: string, path: string = ADMIN_PATH): Promise<Session> {
  const session = await requireSession(locale);
  if (session.permissions.includes("platform.tenants")) return session;

  const admin = adminOrganisation(session.organizations);
  // Already in it and still refused (its plan withholds the console, say):
  // switching again would only come straight back here.
  if (admin && admin.tenant_slug !== session.tenantSlug) {
    redirect(withBasePath(adminEntryPath(locale, path)));
  }
  redirectTo(`/dashboard?${deniedQuery("role")}`, locale);
}
