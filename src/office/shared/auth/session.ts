// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import "server-only";

import { cache } from "react";

import type { OrgChoice } from "@office/shared/auth/actions";
import { getSessionToken } from "@office/shared/auth/cookies";
import type { Permission, Role } from "@office/shared/auth/permissions";
import { type Plan, toPlan } from "@office/shared/auth/plans";
import { api, ApiError } from "@office/shared/lib/api";
import { DEFAULT_TIMEZONE } from "@office/shared/lib/dates";

/**
 * Session access for Server Components.
 *
 * The session lives on the API, not here. This reads the opaque token from the
 * HttpOnly cookie and asks `GET /auth/session` who it belongs to. Nothing is
 * decoded client-side and nothing is trusted from the browser — in particular
 * `tenantId` comes from the API's answer, never from a URL or a header.
 */

/** Exactly the shape of the API's `SessionInfo` response. */
export interface Session {
  userId: number;
  username: string;
  fullName: string;
  /** Null for someone who signs in with a phone number. */
  email: string | null;
  /** What they sign in with: the address, else the phone number. */
  login: string;
  /**
   * The password is kept on suliko.ge. Suliko Office cannot change it, so the
   * account page says where to instead of offering a form.
   */
  passwordManaged: boolean;
  role: Role;
  permissions: readonly Permission[];
  tenantId: number;
  /**
   * The bureau's own name and slug.
   *
   * Optional because the API only started returning them recently — a
   * deployment running the older build sends neither, and the shell must
   * still render. Falls back to the slug, then to a neutral label.
   */
  tenantName?: string;
  tenantSlug?: string;
  /**
   * The plan being ENFORCED, already reflected in `permissions` — the API
   * intersects role and plan before answering. Read it only for the screens
   * no permission guards, and for the onboarding and upgrade copy.
   */
  plan: Plan;
  /** True while the tenant has signed up but not chosen a plan. */
  onboardingRequired: boolean;
  /**
   * The password came from an invite or an admin reset. Every endpoint behind
   * a permission refuses until it is replaced, so the shell sends them to the
   * change-password screen and nowhere else.
   */
  mustChangePassword: boolean;
  /** False when the password was accepted but the 2FA challenge is still owed. */
  mfaSatisfied: boolean;
  isImpersonated: boolean;
  /**
   * The bureau's IANA timezone. Every date and time on screen is shown in it,
   * and "today" (overdue, default dates) is decided in it — never in the
   * server's zone, which on Vercel is UTC, four hours behind Tbilisi.
   */
  timezone: string;
  /**
   * A superadmin gave this organisation Claude Translate: staff pick files on an
   * order and a separate Claude Code server translates them.
   */
  claudeTranslate: boolean;
  /** Whether this user has a confirmed second factor. */
  hasMfa: boolean;
  /**
   * Whether two-factor is switched on at all on the API (`MFA_ENFORCED`). When
   * it is off a factor is never asked for, so the screens that manage one are
   * not shown.
   */
  mfaEnforced: boolean;
  /**
   * Whether this address has been confirmed. Nothing is blocked on it — see
   * `POST /auth/verify-email`'s docstring — this only drives the banner.
   */
  emailVerified: boolean;
  /** Every organisation this person can switch to (the current one included). */
  organizations: OrgChoice[];
  /** Their personal workspace, or null when it has not been enabled yet. */
  personal: OrgChoice | null;
  /**
   * First-run tips: whether to show them (a new account past the plan choice)
   * and which were already dismissed. Null from an API that predates them.
   */
  tips: { enabled: boolean; seen: string[] } | null;
}

interface SessionResponse {
  user_id: number;
  username: string;
  full_name: string;
  email: string | null;
  // Optional: an API from before suliko.ge sign-in sends neither.
  login?: string;
  password_managed_externally?: boolean;
  role: string;
  permissions: string[];
  tenant_id: number;
  tenant_name?: string;
  tenant_slug?: string;
  // Optional for the same reason as tenant_name: an API predating plans sends
  // neither, and `toPlan` falls back rather than leaving the shell undefined.
  plan?: string;
  onboarding_required?: boolean;
  must_change_password?: boolean;
  mfa_satisfied: boolean;
  is_impersonated: boolean;
  // Optional: an API predating them sends neither.
  timezone?: string;
  // Optional: an API from before Claude Translate sends none (off).
  claude_translate?: boolean;
  has_mfa?: boolean;
  // Optional: an API from before the switch was reported had two-factor on.
  mfa_enforced?: boolean;
  // Optional for the same reason: an API predating this column sends none,
  // and "not verified" is the safe default for that case, not the reverse.
  email_verified?: boolean;
  // Optional: an API from before accounts sends neither.
  organizations?: OrgChoice[];
  personal?: OrgChoice | null;
  // Optional: an API from before first-run tips sends none.
  tips?: { enabled: boolean; seen: string[] };
}

/**
 * Whoever may manage people may also invite them. The API says so itself
 * (`effective_permissions`), but a session answered by an API that has not
 * learned `users.invite` yet would otherwise lose the Users page, so the app
 * applies the same rule and the two can be deployed in either order.
 */
function withImpliedInvite(permissions: Permission[]): Permission[] {
  if (permissions.includes("users.manage") && !permissions.includes("users.invite")) {
    return [...permissions, "users.invite"];
  }
  return permissions;
}

/**
 * The current session, or null when signed out or expired.
 *
 * Wrapped in `cache()` so a page that checks permissions in several places
 * makes one API call per render, not one per check.
 *
 * Note this returns a session even when `mfaSatisfied` is false — that state
 * is real and the two-factor page needs it. Route guards decide what to do
 * about it; see `requireFullSession`.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const token = await getSessionToken();
  if (!token) return null;

  try {
    const data = await api<SessionResponse>("/api/v1/auth/session");
    return {
      userId: data.user_id,
      username: data.username,
      fullName: data.full_name,
      email: data.email,
      login: data.login ?? data.email ?? data.username,
      passwordManaged: data.password_managed_externally ?? false,
      role: data.role as Role,
      permissions: withImpliedInvite(data.permissions as Permission[]),
      tenantId: data.tenant_id,
      tenantName: data.tenant_name,
      tenantSlug: data.tenant_slug,
      plan: toPlan(data.plan),
      onboardingRequired: data.onboarding_required ?? false,
      mustChangePassword: data.must_change_password ?? false,
      mfaSatisfied: data.mfa_satisfied,
      isImpersonated: data.is_impersonated,
      timezone: data.timezone || DEFAULT_TIMEZONE,
      claudeTranslate: data.claude_translate ?? false,
      hasMfa: data.has_mfa ?? false,
      mfaEnforced: data.mfa_enforced ?? true,
      emailVerified: data.email_verified ?? false,
      organizations: data.organizations ?? [],
      personal: data.personal ?? null,
      tips: data.tips ?? null,
    };
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
      // 401: the token is expired or revoked. 404: the gateway rejected us,
      // which means BFF_SHARED_SECRET is wrong — that is a deployment fault,
      // not a signed-out user, so it is logged rather than swallowed.
      if (error.status === 404) {
        console.error(
          "[auth] The API gateway rejected this request. BFF_SHARED_SECRET " +
            "is missing or does not match the value on the API server.",
        );
      }
      return null;
    }
    throw error;
  }
});

/** True when the session exists and has cleared its second factor. */
export async function isFullyAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session?.mfaSatisfied;
}

/** Permission check against the current session. UI only — the API re-checks. */
export async function can(permission: Permission): Promise<boolean> {
  const session = await getSession();
  return !!session?.permissions.includes(permission);
}
