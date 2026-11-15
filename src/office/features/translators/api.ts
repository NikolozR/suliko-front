// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import "server-only";

import {
  DIRECTORY_PAGE_SIZE,
  type DirectorySort,
  type Page,
  type TranslatorDetail,
  type TranslatorSummary,
} from "@office/features/directory/types";
import { api } from "@office/shared/lib/api";
import type { WorkKind } from "@office/features/translators/work-kind";

/**
 * Inviting a translator, and matching them to their suliko.ge account.
 *
 * Mirrors `TranslatorInvite` / `TranslatorInviteOut` / `TranslatorInviteSummary`
 * in `api/v1/translators.py`.
 */

export type InviteStatus = "linked" | "pending";

export interface TranslatorInviteResult {
  translator: TranslatorDetail;
  invite_status: InviteStatus;
  /** Set only when linked immediately: which suliko.ge account it matched. */
  matched_display_name: string | null;
  email_sent: boolean;
  /**
   * There was no address to write to (a phone-only account): nothing was
   * emailed and nothing needs retrying. Optional for an API that predates it.
   */
  no_email?: boolean;
}

/** One suliko.ge account that matched what was searched — `TranslatorCandidate` in the API. */
export interface TranslatorCandidate {
  suliko_user_id: string;
  full_name: string;
  /** Profile contacts: unverified, shown only to tell people apart. */
  email: string | null;
  phone: string | null;
  /** Already one of this bureau's translators, and which record. */
  already_linked: boolean;
  linked_translator_name: string | null;
}

export interface TranslatorInviteSummary {
  id: number;
  full_name: string;
  /** Null for a translator picked by phone number. */
  email: string | null;
  phone: string | null;
  translator_id: number;
  status: InviteStatus | "cancelled";
  created_at: string;
}

export interface TranslatorListParams {
  search?: string;
  /** Tri-state: true, false, or undefined for "any". */
  isActive?: boolean;
  /** A language code: translators with a pair from or into it. */
  language?: string;
  /** A city code: translators who certify there. */
  city?: string;
  /** The kind of work: written and oral include those who do both. */
  work?: WorkKind;
  sort?: DirectorySort;
  limit?: number;
  offset?: number;
}

export async function listTranslators(
  params: TranslatorListParams = {},
): Promise<Page<TranslatorSummary>> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  // Explicitly `!== undefined`: `false` is a real filter value, and a plain
  // truthiness check would silently drop "show inactive only".
  if (params.isActive !== undefined) query.set("is_active", String(params.isActive));
  if (params.language) query.set("language", params.language);
  if (params.city) query.set("city", params.city);
  if (params.work) query.set("work", params.work);
  query.set("sort", params.sort ?? "-id");
  query.set("limit", String(params.limit ?? DIRECTORY_PAGE_SIZE));
  query.set("offset", String(params.offset ?? 0));

  return api<Page<TranslatorSummary>>(`/api/v1/translators?${query}`);
}

export async function getTranslator(id: number): Promise<TranslatorDetail> {
  return api<TranslatorDetail>(`/api/v1/translators/${id}`);
}

export async function createTranslator(body: unknown): Promise<TranslatorDetail> {
  return api<TranslatorDetail>("/api/v1/translators", { method: "POST", body });
}

export async function updateTranslator(id: number, body: unknown): Promise<TranslatorDetail> {
  return api<TranslatorDetail>(`/api/v1/translators/${id}`, { method: "PATCH", body });
}

export async function deleteTranslator(id: number): Promise<void> {
  await api<void>(`/api/v1/translators/${id}`, { method: "DELETE" });
}

/**
 * Invite a translator, and try to connect them to their suliko.ge account.
 *
 * No password to set and no password to send — unlike the staff invite, this
 * never creates a Suliko Office login. `invite_status` is `'linked'` when exactly one
 * suliko.ge account matched immediately, `'pending'` otherwise: not an error,
 * the invitee is emailed the suliko.ge registration link and it resolves on
 * its own once a matching account exists.
 */
export async function inviteTranslator(body: unknown): Promise<TranslatorInviteResult> {
  return api<TranslatorInviteResult>("/api/v1/translators/invite", { method: "POST", body });
}

/**
 * Every suliko.ge account whose email or phone number equals `q`. Equality, not
 * a prefix search, so what comes back is exactly the people who match.
 */
export async function searchTranslatorCandidates(q: string): Promise<TranslatorCandidate[]> {
  return api<TranslatorCandidate[]>(
    `/api/v1/translators/invite/candidates?q=${encodeURIComponent(q)}`,
  );
}

export async function listTranslatorInvites(): Promise<TranslatorInviteSummary[]> {
  return api<TranslatorInviteSummary[]>("/api/v1/translators/invites");
}

export async function cancelTranslatorInvite(id: number): Promise<void> {
  await api<void>(`/api/v1/translators/invites/${id}`, { method: "DELETE" });
}
