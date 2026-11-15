"use server";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { getLocale, getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { redirectTo } from "@office/i18n/navigation";
import {
  clearLoginTicket,
  clearSessionCookie,
  getLoginTicket,
  getSessionToken,
  SESSION_MAX_AGE_SECONDS,
  setLastOrganisation,
  setLoginTicket,
  setSessionCookie,
} from "@office/shared/auth/cookies";
import { adminChoice, landingFor, type LoginResponse } from "@office/shared/auth/landing";
import { safeNextPath } from "@office/shared/auth/next-path";
import { type Plan, PLANS } from "@office/shared/auth/plans";
import { ssoEnabled, sulikoSignOutUrl } from "@office/shared/auth/sso";
import { api, ApiError } from "@office/shared/lib/api";
import { BASE_PATH } from "@office/shared/lib/base-path";

/**
 * Authentication server actions.
 *
 * Login is two-legged, matching the API:
 *
 *   1. `POST /auth/login` — password. Returns a session token which may still
 *      owe a second factor.
 *   2. `POST /auth/mfa/verify` — the TOTP code, against that same session.
 *
 * The token goes straight into an HttpOnly cookie after step 1 even though the
 * session is only half-authenticated. That is safe: the API refuses every
 * endpoint except the challenge until the factor is cleared. Holding it in
 * memory instead would break on a page refresh mid-login.
 *
 * Every message a person reads comes from the message catalogue in the locale
 * the form was submitted in. What the API itself says (a weak password, a
 * dead link) is passed through: it is already written for the person.
 */

export interface AuthFormState {
  error?: string;
  /** Field that caused it, for inline display. */
  field?:
    | "username"
    | "password"
    | "code"
    | "tenant"
    | "identifier"
    | "currentPassword"
    | "newPassword";
  /** Stay on the page and render a success panel instead of redirecting. */
  ok?: boolean;
  /** Show `error` as a toast rather than inline. */
  toast?: boolean;
  /**
   * What was submitted, echoed back so the form can re-fill itself.
   *
   * React resets an uncontrolled form once the action settles, so without
   * this a failed sign-in silently reverts Organisation to its default — and
   * the retry authenticates against a DIFFERENT bureau and fails the same
   * way, with nothing on screen to explain why. Passwords are never echoed.
   */
  values?: Record<string, string>;
}

function localeOf(formData: FormData): string {
  return String(formData.get("locale") ?? "ka");
}

async function authErrors(locale: string) {
  return getTranslations({ locale, namespace: "auth.errors" });
}

/** One place the person can sign in to — `OrgChoice` in `api/v1/auth.py`. */
export interface OrgChoice {
  tenant_slug: string;
  tenant_name: string;
  role: string;
  is_personal: boolean;
}

/** Step one's answer: the password was right — which organisation? */
export interface LoginOptions {
  ticket: string;
  /** Null for someone who signs in with a phone number. */
  email: string | null;
  /** What they sign in with: the address, else the phone. */
  login: string;
  full_name: string;
  organizations: OrgChoice[];
  personal: OrgChoice | null;
  personal_exists: boolean;
}

/**
 * Step one: email and password — the person's, not an organisation's.
 *
 * The answer is not a session yet but a ticket and the list of places they
 * can enter, so the ticket goes into its own short-lived HttpOnly cookie and
 * the chooser takes it from there.
 */
export async function loginAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const locale = localeOf(formData);
  const t = await authErrors(locale);
  // An email address or a phone number: whatever they sign in to suliko.ge with.
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? ""));

  // Echoed on every failure below. Never the password.
  const values = { identifier };

  if (!identifier) return { error: t("enterLogin"), field: "identifier", values };
  if (!password) return { error: t("enterPassword"), field: "password", values };

  let result: LoginOptions;
  try {
    result = await api<LoginOptions>("/api/v1/auth/login", {
      method: "POST",
      authenticated: false,
      body: { identifier, password },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 429) return { error: t("tooManyAttempts"), values };
      // The password was right; the account itself is closed. Said plainly, in
      // the person's language, with how to reopen it.
      if (error.code === "account_deletion_pending") return { error: t("deletionPending"), values };
      // The API returns one message for a wrong address and a wrong password
      // on purpose. Do not "improve" this into something more specific.
      if (error.status === 401) {
        return { error: t("invalidCredentials"), field: "password", values };
      }
      if (error.status === 404 || error.status >= 500) {
        // A 404 here is the gateway refusing this deployment — logged for
        // whoever runs it, and a plain sentence for whoever is signing in.
        console.error(`[auth] login failed with ${error.status}: ${error.detail}`);
        return { error: t("serviceUnavailable"), values };
      }
      return { error: error.detail, values };
    }
    return { error: t("unreachable"), values };
  }

  // Signing in on the way to /admin: a superuser goes straight into the
  // organisation that makes them one, with no chooser to pick it from. If
  // that cannot be done here, the chooser below still can.
  const admin = adminChoice(result, next);
  let entered: LoginResponse | null = null;
  if (admin) {
    try {
      entered = await api<LoginResponse>("/api/v1/auth/login/select", {
        method: "POST",
        authenticated: false,
        body: { ticket: result.ticket, ...admin },
      });
    } catch (error) {
      console.error("[auth] could not enter the admin organisation at sign-in", error);
    }
  }
  if (entered) {
    await setSessionCookie(entered.session_token, SESSION_MAX_AGE_SECONDS);
    redirectTo(landingFor(entered, next), locale);
  }

  await setLoginTicket(result.ticket);
  redirectTo(next ? `/choose-account?next=${encodeURIComponent(next)}` : "/choose-account", locale);
}

/**
 * Step two: the picked organisation (or the personal account) becomes a
 * session. Picking an inactive personal account creates it — the API mails
 * them that it is enabled.
 */
export async function selectAccountAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const locale = localeOf(formData);
  const t = await authErrors(locale);
  const next = safeNextPath(String(formData.get("next") ?? ""));
  const personal = formData.get("personal") === "1";
  const tenantSlug = String(formData.get("tenant_slug") ?? "");

  // Whether other bureaus may send this freelancer orders. Asked only when the
  // personal workspace is about to be created, and with no answer pre-picked:
  // a missing answer is an error, never a quiet "no".
  const answer = String(formData.get("bureau_orders") ?? "");
  const consentAsked = formData.get("consent_asked") === "1";
  if (personal && consentAsked && answer !== "yes" && answer !== "no") {
    return { error: t("chooseOne") };
  }

  const ticket = await getLoginTicket();
  if (!ticket) redirectTo("/login?expired=1", locale);

  let result: LoginResponse;
  try {
    result = await api<LoginResponse>("/api/v1/auth/login/select", {
      method: "POST",
      authenticated: false,
      body: personal
        ? {
            ticket,
            personal: true,
            ...(consentAsked ? { accepts_bureau_orders: answer === "yes" } : {}),
          }
        : { ticket, tenant_slug: tenantSlug },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      // An expired or superseded ticket: back to the start, with a reason.
      if (error.status === 401) {
        await clearLoginTicket();
        redirectTo("/login?expired=1", locale);
      }
      if (error.status >= 500) return { error: t("serviceUnavailable") };
      return { error: error.detail };
    }
    return { error: t("unreachable") };
  }

  await clearLoginTicket();
  await setSessionCookie(result.session_token, SESSION_MAX_AGE_SECONDS);
  await setLastOrganisation(result.tenant_slug);
  redirectTo(landingFor(result, next), locale);
}

/** What the API said about a new bureau, in the person's language. */
function bureauError(error: ApiError, t: Awaited<ReturnType<typeof authErrors>>): string {
  if (error.status === 422) return t("bureauName");
  if (error.status >= 500) return t("serviceUnavailable");
  return error.detail;
}

/**
 * Step two, the other way: found a new bureau and enter it as its owner. The
 * way in for someone no organisation has invited yet.
 */
export async function createBureauAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const locale = localeOf(formData);
  const t = await authErrors(locale);
  const next = safeNextPath(String(formData.get("next") ?? ""));
  const name = String(formData.get("organisation_name") ?? "").trim();
  const values = { organisation_name: name };

  if (name.length < 2) return { error: t("bureauName"), values };

  const ticket = await getLoginTicket();
  if (!ticket) redirectTo("/login?expired=1", locale);

  let result: LoginResponse;
  try {
    result = await api<LoginResponse>("/api/v1/auth/login/create-bureau", {
      method: "POST",
      authenticated: false,
      body: { ticket, organisation_name: name },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        await clearLoginTicket();
        redirectTo("/login?expired=1", locale);
      }
      return { error: bureauError(error, t), values };
    }
    return { error: t("unreachable"), values };
  }

  await clearLoginTicket();
  await setSessionCookie(result.session_token, SESSION_MAX_AGE_SECONDS);
  await setLastOrganisation(result.tenant_slug);
  redirectTo(landingFor(result, next), locale);
}

/**
 * Found a new bureau from inside the app and move to it, as the switcher does
 * for an existing one. The API revokes the old session.
 */
export async function createOrganisationAction(name: string): Promise<{ error?: string }> {
  const locale = await getLocale();
  const t = await authErrors(locale);
  const trimmed = name.trim();
  if (trimmed.length < 2) return { error: t("bureauName") };

  let result: LoginResponse;
  try {
    result = await api<LoginResponse>("/api/v1/auth/organisations", {
      method: "POST",
      body: { organisation_name: trimmed },
    });
  } catch (error) {
    if (error instanceof ApiError) return { error: bureauError(error, t) };
    return { error: t("unreachable") };
  }

  await setSessionCookie(result.session_token, SESSION_MAX_AGE_SECONDS);
  await setLastOrganisation(result.tenant_slug);
  revalidatePath("/", "layout");
  redirectTo(landingFor(result, null), locale);
}

/**
 * Move to another of the signed-in person's organisations — or their personal
 * account — from the switcher, without the password. The API revokes the old
 * session; the whole shell is rebuilt for the new organisation.
 */
export async function switchAccountAction(
  target: { tenantSlug: string } | { personal: true },
): Promise<{ error?: string }> {
  let result: LoginResponse;
  try {
    result = await api<LoginResponse>("/api/v1/auth/switch", {
      method: "POST",
      body: "personal" in target ? { personal: true } : { tenant_slug: target.tenantSlug },
    });
  } catch (error) {
    if (error instanceof ApiError) return { error: error.detail };
    return { error: (await getTranslations("auth.errors"))("unreachable") };
  }

  await setSessionCookie(result.session_token, SESSION_MAX_AGE_SECONDS);
  await setLastOrganisation(result.tenant_slug);
  revalidatePath("/", "layout");
  redirectTo(landingFor(result, null), await getLocale());
}

export async function verifyMfaAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const locale = localeOf(formData);
  const t = await authErrors(locale);
  const code = String(formData.get("code") ?? "").trim();
  const next = safeNextPath(String(formData.get("next") ?? ""));

  if (!code) return { error: t("enterCode"), field: "code" };

  const token = await getSessionToken();
  if (!token) redirectTo("/login", locale);

  try {
    await api("/api/v1/auth/mfa/verify", { method: "POST", body: { code } });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 429) return { error: t("tooManyCodes"), field: "code" };
      // Covers a wrong code and a replayed one alike. The API logs the
      // difference; the user does not need to know which.
      if (error.status === 401) return { error: t("invalidCode"), field: "code" };
      return { error: error.detail, field: "code" };
    }
    return { error: t("unreachable") };
  }

  // Also the step-up path: a fresh code stamps the session, and the user goes
  // back to the page that asked for it.
  redirectTo(next ?? "/dashboard", locale);
}

interface SignupResponse {
  session_token: string;
  tenant_slug: string;
  username: string;
  onboarding_required: boolean;
}

/**
 * Create a bureau and its owner, and sign them straight in.
 *
 * The API returns the derived organisation handle and username, which are the
 * two things the owner will need at the next login and neither of which they
 * chose. They are carried to the onboarding screen in the query string rather
 * than shown here, because this page is replaced by the redirect.
 */
export async function signupAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const locale = localeOf(formData);
  const t = await authErrors(locale);
  const organisation = String(formData.get("organisation") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const values = { organisation, fullName, email };

  if (!organisation) return { error: t("enterOrganisationName"), field: "tenant", values };
  if (!fullName) return { error: t("enterName"), field: "username", values };
  if (!email) return { error: t("enterEmail"), field: "identifier", values };
  if (!password) return { error: t("choosePassword"), field: "password", values };
  if (password !== confirm) return { error: t("passwordsDontMatch"), field: "password", values };

  let result: SignupResponse;
  try {
    result = await api<SignupResponse>("/api/v1/auth/signup", {
      method: "POST",
      authenticated: false,
      body: {
        organisation_name: organisation,
        full_name: fullName,
        email,
        password,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 429) return { error: t("tooManySignups"), values };
      if (error.code === "email_taken") {
        const accounts = (error.body as { accounts?: { kind: string; name?: string }[] })
          ?.accounts ?? [];
        const labels = accounts.map((account) =>
          account.kind === "bureau" && account.name ? account.name : t("freelancerAccount"),
        );
        return {
          error: labels.length ? t("emailTaken", { accounts: labels.join(", ") }) : error.detail,
          field: "identifier",
          toast: true,
          values,
        };
      }
      if (error.status === 422 || error.status === 409) {
        // A weak password or an unusable name. The API's wording is already
        // written to be read by the person who typed it — and names the field.
        const field = /name|organisation/i.test(error.detail) ? "tenant" : "password";
        return { error: error.detail, field, values };
      }
      if (error.status >= 500) return { error: t("serviceUnavailable"), values };
      return { error: error.detail, values };
    }
    return { error: t("unreachable"), values };
  }

  await setSessionCookie(result.session_token, SESSION_MAX_AGE_SECONDS);
  redirectTo("/onboarding", locale);
}

/**
 * Choose (or change) the plan.
 *
 * The plan changes the caller's own permission mask, so the session in the
 * browser is stale the moment this returns — `revalidatePath("/", "layout")`
 * drops the cached shell so the sidebar is rebuilt from a fresh
 * `/auth/session`. Without it the new tabs do not appear until a hard reload.
 */
export async function choosePlanAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const locale = localeOf(formData);
  const t = await authErrors(locale);
  const plan = String(formData.get("plan") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? ""));

  if (!PLANS.includes(plan as Plan)) return { error: t("choosePlan") };

  try {
    await api("/api/v1/tenant/plan", { method: "PUT", body: { plan } });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.code === "bureau_plan_locked") return { error: t("bureauPlanLocked") };
      if (error.code === "personal_plan_locked") return { error: t("personalPlanLocked") };
      return { error: error.detail };
    }
    return { error: t("unreachable") };
  }

  revalidatePath("/", "layout");
  redirectTo(next ?? "/dashboard", locale);
}

/**
 * Ask for a reset link.
 *
 * Always reports success. The API answers 204 whether or not the account
 * exists — anything else enumerates users — and this must not undo that by
 * being more helpful. The one exception is 429, which is keyed on the
 * identifier the visitor just typed and so reveals nothing they do not know.
 */
export async function forgotPasswordAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const locale = localeOf(formData);
  const t = await authErrors(locale);
  const email = String(formData.get("email") ?? "").trim();
  const values = { email };

  if (!email) return { error: t("enterEmail"), field: "identifier", values };

  try {
    await api("/api/v1/auth/password/forgot", {
      method: "POST",
      authenticated: false,
      body: { email },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 429) {
      return { error: t("tooManyResets"), values };
    }
    if (!(error instanceof ApiError) || error.status >= 500) {
      return { error: t("unreachable"), values };
    }
    // Any other 4xx is a malformed request, not a missing account. Reporting
    // it would still say nothing about whether the account exists.
    return { error: error.detail, values };
  }

  return { ok: true };
}

/**
 * Spend a reset link — or an invitation, which is the same kind of link.
 *
 * The token comes from the query string and rides through the form as a
 * hidden field, so it never has to be held in component state.
 */
export async function resetPasswordAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const locale = localeOf(formData);
  const t = await authErrors(locale);
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const isInvite = formData.get("invite") === "1";

  if (!token) return { error: t("missingToken") };
  if (!password) return { error: t("chooseNewPassword"), field: "password" };
  if (password !== confirm) return { error: t("passwordsDontMatch"), field: "password" };

  try {
    await api("/api/v1/auth/password/reset", {
      method: "POST",
      authenticated: false,
      body: { token, password },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      // 422 covers both a dead link and a weak password; the API's message
      // distinguishes them and is written to be shown.
      if (error.status === 422 || error.status === 400) {
        return { error: error.detail, field: "password" };
      }
      if (error.status >= 500) return { error: t("serviceUnavailable") };
      return { error: error.detail };
    }
    return { error: t("unreachable") };
  }

  // Every session was revoked server-side, including any this browser held.
  await clearSessionCookie();
  redirectTo(isInvite ? "/login?invited=1" : "/login?reset=1", locale);
}

/**
 * Change your own password.
 *
 * The API revokes every session, this one included, so there is nothing to
 * return to — the cookie is cleared and the user signs in again. Saying so on
 * the login screen is the difference between that feeling deliberate and
 * feeling like a bug.
 */
export async function changePasswordAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const locale = localeOf(formData);
  const t = await authErrors(locale);
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!currentPassword) return { error: t("enterCurrentPassword"), field: "currentPassword" };
  if (!newPassword) return { error: t("chooseNewPassword"), field: "newPassword" };
  if (newPassword !== confirm) {
    return { error: t("newPasswordsDontMatch"), field: "newPassword" };
  }

  try {
    await api("/api/v1/auth/password/change", {
      method: "POST",
      body: { current_password: currentPassword, new_password: newPassword },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 422 || error.status === 400) {
        // "Current password is not correct" and "new password is too weak"
        // both land here; the API's wording is already user-facing.
        const wrongCurrent = error.detail.toLowerCase().includes("current password");
        return { error: error.detail, field: wrongCurrent ? "currentPassword" : "newPassword" };
      }
      if (error.status === 401) {
        await clearSessionCookie();
        redirectTo("/login", locale);
      }
      return { error: error.detail };
    }
    return { error: t("unreachable") };
  }

  await clearSessionCookie();
  redirectTo("/login?changed=1", locale);
}

/**
 * Close your own access to this organisation.
 *
 * The API switches the account off and ends every session, this one included,
 * so there is nothing to render afterwards: clear the cookie and say so on the
 * login screen. A refusal (wrong password, the only owner) stays on the form.
 */
export async function leaveOrganisationAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const locale = localeOf(formData);
  const t = await authErrors(locale);
  const password = String(formData.get("currentPassword") ?? "");

  try {
    await api("/api/v1/auth/leave", {
      method: "POST",
      body: { current_password: password || null },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        await clearSessionCookie();
        redirectTo("/login", locale);
      }
      const wrongPassword = error.status === 422 && error.detail.toLowerCase().includes("password");
      return { error: error.detail, field: wrongPassword ? "currentPassword" : undefined };
    }
    return { error: t("unreachable") };
  }

  await clearSessionCookie();
  redirectTo("/login?left=1", locale);
}

/**
 * Ask for this account to be deleted.
 *
 * A request, not the deletion: the team reviews it. The API closes the account
 * and ends every session, this one included, so as with leaving there is nothing
 * to render afterwards. Clear the cookie and say so on the login screen. A
 * refusal (wrong password, the only owner of an organisation) stays on the form.
 */
export async function requestAccountDeletionAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const locale = localeOf(formData);
  const t = await authErrors(locale);
  const password = String(formData.get("currentPassword") ?? "");

  try {
    await api("/api/v1/auth/deletion-request", {
      method: "POST",
      body: { current_password: password || null },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        await clearSessionCookie();
        redirectTo("/login", locale);
      }
      const wrongPassword = error.status === 422 && error.detail.toLowerCase().includes("password");
      return { error: error.detail, field: wrongPassword ? "currentPassword" : undefined };
    }
    return { error: t("unreachable") };
  }

  await clearSessionCookie();
  redirectTo("/login?deletion=1", locale);
}

export async function logoutAction(formData: FormData): Promise<void> {
  const locale = localeOf(formData);

  try {
    await api("/api/v1/auth/logout", { method: "POST" });
  } catch {
    // Revoking server-side is best-effort. If the API is unreachable we still
    // clear the cookie — leaving the user apparently signed in would be worse.
  }

  await clearSessionCookie();
  // Marked, so the login page does not hop straight back through suliko.ge
  // and undo the sign-out.
  const signedOut = "/login?signed_out=1";
  // One sign-in, one sign-out: suliko.ge forgets them too, then sends them
  // back here. Without APP_URL there is no address to come back to.
  const appUrl = process.env.APP_URL?.replace(/\/$/, "");
  if (ssoEnabled() && appUrl) {
    redirect(sulikoSignOutUrl(locale, `${appUrl}${BASE_PATH}/${locale}${signedOut}`));
  }
  redirectTo(signedOut, locale);
}

// ── Email verification ──────────────────────────────────────────────────────

interface VerifyEmailResponse {
  tenant_slug: string;
}

export interface VerifyEmailState {
  error?: string;
  ok?: boolean;
  tenantSlug?: string;
}

/**
 * Spend a signup confirmation link.
 *
 * Not a form action — the `/verify-email` page calls this once, itself,
 * for the token in its own URL. Unauthenticated on the API side (the token
 * is the proof), so this works whether or not the browser calling it happens
 * to be signed in.
 */
export async function verifyEmailAction(token: string): Promise<VerifyEmailState> {
  // No form field to read a locale from here (there is no form) — inferred
  // from the request the same way every other server action's translations
  // are, `describeApiError` and `validationFailed` included.
  const t = await getTranslations("auth.errors");

  if (!token.trim()) return { error: t("verifyEmailMissingToken") };

  try {
    const result = await api<VerifyEmailResponse>("/api/v1/auth/verify-email", {
      method: "POST",
      authenticated: false,
      body: { token },
    });
    return { ok: true, tenantSlug: result.tenant_slug };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status >= 500) return { error: t("serviceUnavailable") };
      // The API's wording already names the problem plainly (expired, spent,
      // or forged — deliberately indistinguishable; see the endpoint).
      return { error: error.detail };
    }
    return { error: t("unreachable") };
  }
}

export interface ResendVerificationState {
  error?: string;
}

/**
 * Ask for a fresh confirmation link, to the signed-in user's own address.
 *
 * Authenticated — there is no address to type, only "mine" — so a stale copy
 * of the banner clicked twice is rate-limited server-side rather than
 * refused here; this just surfaces whatever the API says.
 */
export async function resendVerificationEmailAction(): Promise<ResendVerificationState> {
  try {
    await api("/api/v1/auth/verify-email/resend", { method: "POST" });
    return {};
  } catch (error) {
    if (error instanceof ApiError) return { error: error.detail };
    const t = await getTranslations("auth.errors");
    return { error: t("unreachable") };
  }
}

// ── Invitations ─────────────────────────────────────────────────────────────

export interface AcceptInvitationState {
  error?: string;
  ok?: boolean;
  tenantName?: string;
}

/** Spend an invitation link; the person then signs in and picks the bureau. */
export async function acceptInvitationAction(token: string): Promise<AcceptInvitationState> {
  const t = await getTranslations("auth.errors");
  if (!token.trim()) return { error: t("missingToken") };
  try {
    const result = await api<{ tenant_slug: string; tenant_name: string }>(
      "/api/v1/auth/invitations/accept",
      { method: "POST", authenticated: false, body: { token } },
    );
    // The next sign-in goes straight into the bureau that invited them.
    await setLastOrganisation(result.tenant_slug);
    return { ok: true, tenantName: result.tenant_name };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status >= 500) return { error: t("serviceUnavailable") };
      // Spent, replaced by a newer link, or expired: said in the page's language.
      if (error.code === "invitation_link_invalid") return { error: t("invitationLinkInvalid") };
      return { error: error.detail };
    }
    return { error: t("unreachable") };
  }
}
