"use server";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { getTranslations } from "next-intl/server";
import { withFlash } from "@office/shared/lib/flash";
import { revalidateRoute } from "@office/shared/lib/revalidate";

import {
  attachSulikoAccount,
  deleteUser,
  getUser,
  inviteUser,
  lookupAccount,
  resendInvitation,
  resetUserMfa,
  suggestPeople,
  updateUser,
  type AccountLookup,
  type SulikoSuggestion,
  type Invite,
} from "@office/features/users/api";
import {
  userInviteSchema,
  userUpdateSchema,
  type UserFieldErrors,
  type UserUpdateValues,
} from "@office/features/users/schema";
import { redirectTo } from "@office/i18n/navigation";
import {
  changedFields,
  describeApiError,
  readStrings,
  validationFailed,
} from "@office/shared/lib/form-state";

/**
 * Staff account mutations.
 *
 * The API enforces rules this form cannot: nobody changes their own role or
 * access, nobody acts on an account at or above their own rank, and the last
 * active owner cannot be demoted, disabled or deleted. Those come back as
 * 403s, 409s and 422s with a usable sentence, surfaced rather than
 * second-guessed here.
 */

export interface UserFormState {
  error?: string;
  fieldErrors?: UserFieldErrors;
  values?: Record<string, string>;
  ok?: boolean;
  stepUp?: boolean;
}

/** What the invite screen shows after a successful invite. */
export interface InviteResult {
  fullName: string;
  email: string;
  /** They already had an account: an accept link, not a set-password one. */
  existingAccount: boolean;
  /** They must register on suliko.ge first; the link only accepts. */
  needsRegistration: boolean;
  /** Invited by phone number with no address: nothing was emailed. */
  invitedByPhone: boolean;
  inviteLink: string;
  inviteExpiresAt: string;
  emailSent: boolean;
  /** The mail server was slow to answer: the message is still being sent. */
  emailPending: boolean;
  sulikoAccountStatus: "linked" | "pending";
  sulikoAccountMatchedName: string | null;
}

export interface InviteFormState extends UserFormState {
  invited?: InviteResult;
}

async function missingId(): Promise<UserFormState> {
  const t = await getTranslations("validation");
  return { error: t("missingId") };
}

/**
 * Invite someone to the bureau.
 *
 * Does NOT redirect on success. The API returns the set-password link once;
 * navigating away from it immediately would throw away the only copy the
 * inviter can pass on when the email does not arrive.
 */
export async function inviteUserAction(
  _previous: InviteFormState,
  formData: FormData,
): Promise<InviteFormState> {
  const raw = readStrings(formData, [
    "full_name",
    "login",
    "position",
    "phone",
    "role",
  ]);
  // Someone picked from the suggestions arrives as an id alone: the API holds
  // the sign-in name, so a hand-edited form cannot swap in another address.
  const pickedId = String(formData.get("suliko_user_id") ?? "").trim();
  // Checkboxes: absent entirely when none are ticked, which is a real choice
  // ("this person may do nothing yet") and not a missing field.
  const permissions = formData.getAll("permissions").map(String);

  // The search box holds an address or a phone number. An address is who is
  // invited, with the Phone field as their contact number; a number is both
  // who is invited and their phone (the Phone field only mirrors it).
  const login = raw.login.trim();
  const byAddress = login.includes("@");
  const parsed = userInviteSchema.safeParse({
    full_name: raw.full_name,
    email: pickedId || !byAddress ? undefined : login,
    position: raw.position,
    phone: pickedId ? undefined : byAddress ? raw.phone : login,
    role: raw.role,
    permissions,
    suliko_user_id: pickedId || undefined,
  });
  if (!parsed.success)
    return { ...(await validationFailed(parsed.error)), values: raw };

  let invite;
  try {
    invite = await inviteUser(parsed.data);
  } catch (error) {
    return { ...(await describeApiError(error, "invitation")), values: raw };
  }

  revalidateRoute("/users", "page");
  return { ok: true, invited: toInviteResult(invite) };
}

function toInviteResult(invite: Invite): InviteResult {
  return {
    fullName: invite.user.full_name,
    // An invitation is always to an address, so this is only ever null in the type.
    email: invite.user.email ?? "",
    existingAccount: invite.existing_account,
    needsRegistration: invite.needs_suliko_registration ?? false,
    invitedByPhone: invite.invited_by_phone ?? false,
    inviteLink: invite.invite_link,
    inviteExpiresAt: invite.invite_expires_at,
    emailSent: invite.email_sent,
    emailPending: invite.email_pending ?? false,
    sulikoAccountStatus: invite.suliko_account.status,
    sulikoAccountMatchedName: invite.suliko_account.matched_display_name,
  };
}

/**
 * A new invitation link for someone who has not got in yet.
 *
 * Like the first invitation it does not navigate away: the link is shown once,
 * and it is the only copy the inviter can pass on if the email does not arrive.
 */
export async function resendInvitationAction(
  _previous: InviteFormState,
  formData: FormData,
): Promise<InviteFormState> {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return missingId();

  let invite;
  try {
    invite = await resendInvitation(id);
  } catch (error) {
    return await describeApiError(error, "invitation");
  }

  revalidateRoute("/users", "page");
  revalidateRoute(`/users/${id}`, "page");
  return { ok: true, invited: toInviteResult(invite) };
}

/**
 * Move a stalled invitation to the suliko.ge sign-in the person really uses.
 *
 * Unlike a resend there is nothing to keep on screen afterwards (no link is
 * shown), and the member's own page changes under it: the address they were
 * invited at is replaced by the number. So it goes back to that page and says so.
 */
export async function attachAccountAction(
  _previous: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const locale = String(formData.get("locale") ?? "ka");
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return missingId();

  const login = String(formData.get("login") ?? "").trim();
  if (!login)
    return { error: (await getTranslations("users"))("attachNothingTyped") };

  try {
    await attachSulikoAccount(id, login);
  } catch (error) {
    return { ...(await describeApiError(error, "user")), values: { login } };
  }

  revalidateRoute("/users");
  revalidateRoute(`/users/${id}`);
  redirectTo(withFlash(`/users/${id}`, "invitationMoved"), locale);
}

/**
 * The invite form's search: is there an account for this address or phone
 * number, and is it already here? Null when what was typed is not complete
 * enough to ask about.
 */
export async function lookupAccountAction(
  login: string,
  options: { maskName?: boolean } = {},
): Promise<AccountLookup | null> {
  const trimmed = login.trim();
  const isAddress = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  const isNumber =
    !trimmed.includes("@") && trimmed.replace(/\D/g, "").length >= 6;
  if (!isAddress && !isNumber) return null;
  try {
    const found = await lookupAccount(trimmed);
    // Masked here, on the server, so the full name never reaches the browser.
    return options.maskName && found.full_name
      ? { ...found, full_name: maskName(found.full_name) }
      : found;
  } catch {
    return null;
  }
}

/**
 * "Gela Beridze" becomes "G*** B***": enough for the person who knows who they
 * invited to recognise them, not enough to learn a stranger's name by trying
 * numbers.
 */
function maskName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${Array.from(word)[0]}***`)
    .join(" ");
}

/**
 * The invite form's dropdown: suliko.ge people whose email or phone starts
 * with what was typed. Empty until enough is typed, and empty (not an error
 * box) when suliko.ge cannot be asked: the form still works by typing the full
 * address, which is what the existing search below handles.
 */
export async function suggestPeopleAction(
  typed: string,
): Promise<SulikoSuggestion[]> {
  const trimmed = typed.trim();
  if (trimmed.length < 4) return [];
  try {
    return await suggestPeople(trimmed);
  } catch {
    return [];
  }
}

/**
 * Replace one employee's access.
 *
 * Sends the WHOLE ticked set; the API turns it into a difference against the
 * role's bundle so that a later role change still means something. Boxes the
 * editor does not hold are disabled on the form and so never submitted — the
 * API keeps those as they are rather than reading their absence as "revoke".
 */
export async function updateUserAccessAction(
  _previous: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return missingId();

  const permissions = formData.getAll("permissions").map(String);

  try {
    await updateUser(id, { permissions });
  } catch (error) {
    return await describeApiError(error, "account");
  }

  revalidateRoute("/users", "page");
  revalidateRoute(`/users/${id}`, "page");
  return { ok: true };
}

export async function updateUserAction(
  _previous: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const locale = String(formData.get("locale") ?? "ka");
  const id = Number(formData.get("id"));
  const raw = {
    ...readStrings(formData, ["full_name", "role"]),
    is_active: formData.get("is_active") !== null ? "on" : "",
  };

  if (!Number.isFinite(id)) return missingId();

  const parsed = userUpdateSchema.safeParse({
    ...raw,
    is_active: raw.is_active === "on",
  });
  if (!parsed.success)
    return { ...(await validationFailed(parsed.error)), values: raw };

  let current: Record<string, unknown> | null = null;
  try {
    current = (await getUser(id)) as unknown as Record<string, unknown>;
  } catch {
    current = null;
  }

  const changes = changedFields<UserUpdateValues>(parsed.data, current, raw);

  if (Object.keys(changes).length === 0) {
    redirectTo(withFlash(`/users/${id}`, "userSaved"), locale);
  }

  try {
    await updateUser(id, changes);
  } catch (error) {
    return { ...(await describeApiError(error, "user")), values: raw };
  }

  revalidateRoute("/users");
  revalidateRoute(`/users/${id}`);
  redirectTo(withFlash(`/users/${id}`, "userSaved"), locale);
}

/** Remove someone's second factor, for a lost or replaced phone. */
export async function resetUserMfaAction(
  _previous: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return missingId();

  try {
    await resetUserMfa(id);
  } catch (error) {
    return await describeApiError(error, "user");
  }

  revalidateRoute(`/users/${id}`);
  return { ok: true };
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  const locale = String(formData.get("locale") ?? "ka");
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;

  try {
    await deleteUser(id);
  } catch (error) {
    redirectTo(
      `/users/${id}?error=${encodeURIComponent((await describeApiError(error, "user")).error)}`,
      locale,
    );
  }

  revalidateRoute("/users");
  redirectTo(withFlash("/users", "userRemoved"), locale);
}
