// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import type { LoginOptions } from "@office/shared/auth/actions";

/** `LoginResponse` in `api/v1/auth.py`: a session for one membership. */
export interface LoginResponse {
  session_token: string;
  mfa_required: boolean;
  mfa_enrolment_required: boolean;
  must_change_password: boolean;
  user_id: number;
  tenant_id: number;
  tenant_slug: string;
  role: string;
  permissions: string[];
}

/** Where a fresh session goes first — the same order for sign-in and switching. */
export function landingFor(result: LoginResponse, next: string | null): string {
  const nextQuery = next ? `?next=${encodeURIComponent(next)}` : "";
  // The role demands a factor and none is enrolled: the session is held at
  // the challenge until one is. The setup screen is the only way forward.
  if (result.mfa_enrolment_required) return `/two-factor/setup${nextQuery}`;
  if (result.mfa_required) return `/two-factor${nextQuery}`;
  // The shell would redirect here anyway; doing it now avoids a bounce
  // through a layout that is only going to send them away again.
  if (result.must_change_password) return "/welcome";
  return next ?? "/dashboard";
}

/** What `POST /auth/login/select` is asked for. */
export type Choice = { tenant_slug: string } | { personal: true };

/** The admin console's own address: where a superuser goes in. */
export const ADMIN_PATH = "/admin";

/** Whether a (locale-less) path is the admin console or a screen inside it. */
export function isAdminPath(path: string | null | undefined): boolean {
  return !!path && /^\/admin(\/|\?|$)/.test(path);
}

/**
 * The organisation that holds this person's superuser membership, if they
 * have one. It is the only place the admin console opens from.
 */
export function adminOrganisation<T extends { role: string }>(organizations: readonly T[]): T | null {
  return organizations.find((o) => o.role === "superuser") ?? null;
}

/**
 * Where to go for someone signing in on their way to the admin console: the
 * organisation their superuser membership is in, whatever this browser
 * entered last. Null for anyone else, and the usual rules apply.
 */
export function adminChoice(options: LoginOptions, next: string | null): Choice | null {
  if (!isAdminPath(next)) return null;
  const admin = adminOrganisation(options.organizations);
  return admin ? { tenant_slug: admin.tenant_slug } : null;
}

/**
 * Where to go without asking, or null for the chooser.
 *
 * The organisation entered last on this browser, if the person still belongs
 * to it; otherwise the only place there is. With two or more and no
 * remembered one, the person picks — and then it is remembered. Someone with
 * nowhere to go yet always sees the chooser, which is where a bureau or the
 * personal account is created.
 */
export function automaticChoice(options: LoginOptions, last: string | undefined): Choice | null {
  const personal = options.personal_exists ? options.personal : null;
  if (last) {
    if (options.organizations.some((o) => o.tenant_slug === last)) return { tenant_slug: last };
    if (personal && personal.tenant_slug === last) return { personal: true };
  }
  const places = options.organizations.length + (personal ? 1 : 0);
  if (places !== 1) return null;
  return personal ? { personal: true } : { tenant_slug: options.organizations[0].tenant_slug };
}
