// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import "server-only";

import type { PageMeta } from "@office/features/directory/types";
import type { UserFilterState } from "@office/features/users/status";
import { api } from "@office/shared/lib/api";

export type Role = "superuser" | "owner" | "admin" | "manager" | "staff";

/**
 * Whether this person's email or phone matched a suliko.ge account.
 *
 * Mirrors `SulikoAccountOut` in `api/v1/users.py`. `'linked'` is a record of
 * identity here, not a functional connection — a Suliko Office login is not the
 * suliko.ge portal the way it is for a translator invite.
 */
export interface SulikoAccount {
  status: "linked" | "pending";
  matched_display_name: string | null;
}

export interface User {
  id: number;
  username: string;
  /** Null for someone who signs in with a phone number. */
  email: string | null;
  full_name: string;
  position: string | null;
  phone: string | null;
  role: Role;
  is_active: boolean;
  /** Invited and not yet accepted — shown as "invited". */
  must_change_password: boolean;
  invitation_pending?: boolean;
  /**
   * What this person may ACTUALLY do: role, then their overrides, then the
   * tenant's plan. Not the role's bundle — the API resolves all three, and
   * showing the role's would put a list on screen the API disagrees with.
   */
  permissions: string[];
  last_login_at: string | null;
  created_at: string;
  /** Null for anyone added before invitations asked suliko.ge. */
  suliko_account: SulikoAccount | null;
  /** Invitation links sent so far; only on the member's own page. Optional for an older API. */
  invitation_count?: number;
  invitation_last_sent_at?: string | null;
}

export interface Invite {
  user: User;
  /**
   * The link the email carries, shown to the inviter once as a fallback:
   * "accept" for an existing account, "choose your password" for a new one.
   */
  invite_link: string;
  /** The address already had an account; they accept, their password is theirs. */
  existing_account: boolean;
  /**
   * Nobody anywhere and suliko.ge is connected: the email asks them to register
   * there first, and the link only accepts. Optional for an API that predates it.
   */
  needs_suliko_registration?: boolean;
  /**
   * Invited by phone number and they have no address: nothing was emailed, so
   * the link is the invitation. Optional for an API that predates it.
   */
  invited_by_phone?: boolean;
  invite_expires_at: string;
  email_sent: boolean;
  /**
   * The mail server had not answered when the API replied; the message is still
   * being sent. `email_sent` is false only because nobody knows yet. Optional
   * for an API that predates it.
   */
  email_pending?: boolean;
  suliko_account: SulikoAccount;
}

export interface UserPage {
  items: User[];
  meta: PageMeta;
}

export async function listUsers(
  params: {
    search?: string;
    role?: Role;
    isActive?: boolean;
    /** Where the person is. An API that predates it ignores it and lists everyone. */
    state?: UserFilterState;
    limit?: number;
    offset?: number;
  } = {},
): Promise<UserPage> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.role) query.set("role", params.role);
  if (params.isActive !== undefined)
    query.set("is_active", String(params.isActive));
  if (params.state) query.set("state", params.state);
  query.set("limit", String(params.limit ?? 20));
  query.set("offset", String(params.offset ?? 0));
  return api<UserPage>(`/api/v1/users?${query}`);
}

export async function getUser(id: number): Promise<User> {
  return api<User>(`/api/v1/users/${id}`);
}

/**
 * Invite someone. An existing account gets an accept link; a new person an
 * account and a set-password link. Nobody but them ever knows the password.
 */
export async function inviteUser(body: unknown): Promise<Invite> {
  return api<Invite>("/api/v1/users/invite", { method: "POST", body });
}

/**
 * A new link for someone who has not got in yet. The old one stops working and
 * the email goes out again. The answer has the same shape as an invitation.
 */
export async function resendInvitation(id: number): Promise<Invite> {
  return api<Invite>(`/api/v1/users/${id}/invitation`, { method: "POST" });
}

/**
 * Move a stalled invitation to the suliko.ge account the person really uses:
 * `login` is the phone number they registered with, or another address.
 * `POST /users/{id}/suliko-account` in the API; answers with the member.
 */
export async function attachSulikoAccount(
  id: number,
  login: string,
): Promise<User> {
  return api<User>(`/api/v1/users/${id}/suliko-account`, {
    method: "POST",
    body: { login },
  });
}

/** What the invite form's search finds — `AccountLookup` in the API. */
export interface AccountLookup {
  exists: boolean;
  full_name: string | null;
  member: boolean;
  pending: boolean;
  /**
   * Nobody was found and Suliko Office is connected to suliko.ge: the invitation
   * will ask them to register there first. Optional for an API that predates it.
   */
  registration_required?: boolean;
}

/** `login` is an email address or a phone number. */
export async function lookupAccount(login: string): Promise<AccountLookup> {
  return api<AccountLookup>(
    `/api/v1/users/lookup?identifier=${encodeURIComponent(login)}`,
  );
}

/** One person in the invite dropdown: `SulikoSuggestion` in the API. The contact is masked. */
export interface SulikoSuggestion {
  suliko_id: string;
  full_name: string;
  /** The sign-in name with its middle hidden: "n***@gmail.com", "599 ** ** 56". */
  contact: string;
  kind: "email" | "phone";
  member: boolean;
  pending: boolean;
}

/** People registered on suliko.ge whose email or phone starts with `q`. */
export async function suggestPeople(q: string): Promise<SulikoSuggestion[]> {
  return api<SulikoSuggestion[]>(
    `/api/v1/users/suggest?q=${encodeURIComponent(q)}`,
  );
}

export async function updateUser(id: number, body: unknown): Promise<User> {
  return api<User>(`/api/v1/users/${id}`, { method: "PATCH", body });
}

/** Remove someone's second factor (a lost phone). They enrol again at sign-in. */
export async function resetUserMfa(id: number): Promise<void> {
  await api<void>(`/api/v1/users/${id}/mfa`, { method: "DELETE" });
}

export async function deleteUser(id: number): Promise<void> {
  await api<void>(`/api/v1/users/${id}`, { method: "DELETE" });
}
