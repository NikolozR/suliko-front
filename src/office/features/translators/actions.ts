"use server";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { getTranslations } from "next-intl/server";

import { withFlash } from "@office/shared/lib/flash";
import { revalidateRoute } from "@office/shared/lib/revalidate";

import { redirectTo } from "@office/i18n/navigation";
import {
  cancelTranslatorInvite,
  createTranslator,
  deleteTranslator,
  getTranslator,
  inviteTranslator,
  searchTranslatorCandidates,
  updateTranslator,
  type InviteStatus,
  type TranslatorCandidate,
} from "@office/features/translators/api";
import {
  TRANSLATOR_WRITE_ONLY,
  translatorFormSchema,
  translatorInviteSchema,
  type TranslatorFieldErrors,
  type TranslatorFormValues,
  type TranslatorInviteFieldErrors,
} from "@office/features/translators/schema";
import { workFlags } from "@office/features/translators/work-kind";
import { bothWays, pairsFromRows, type DirectedPair, type PairRow } from "@office/features/translators/pairs";
import { ApiError } from "@office/shared/lib/api";
import { changedFields, describeApiError, readStrings, validationFailed } from "@office/shared/lib/form-state";

/**
 * Translator mutations.
 *
 * Every one re-validates with the same Zod schema the browser used. The
 * browser copy is a convenience; this is the one that runs on input the user
 * controls, and the API validates a third time behind it.
 */

export interface TranslatorFormState {
  error?: string;
  fieldErrors?: TranslatorFieldErrors;
  values?: Record<string, string>;
  /** The API wants a fresh 2FA code first. */
  stepUp?: boolean;
}

const FIELDS = [
  "name",
  "phone",
  "email",
  "office_address",
  "experience_from",
  "default_rate",
  "work_kind",
  "bank_iban",
  "bank_inn",
  "bank_code",
  "comment",
] as const;

const CHECKBOXES = ["is_active", "can_notarize"] as const;

function readForm(formData: FormData) {
  const checked = Object.fromEntries(
    // An unchecked checkbox sends nothing at all, so its absence is the value.
    CHECKBOXES.map((name) => [name, formData.get(name) !== null ? "on" : ""]),
  ) as Record<(typeof CHECKBOXES)[number], string>;
  return {
    ...readStrings(formData, FIELDS),
    ...checked,
    // The pair editor keeps its rows (one per pair, both ways or one way) in
    // one hidden field, as JSON.
    language_pairs: String(formData.get("language_pairs") ?? "[]"),
    // City checkboxes share one name; their values go on as a JSON list.
    cities: JSON.stringify(formData.getAll("cities").map(String)),
  };
}

function readPairs(raw: string): unknown {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function parse(raw: ReturnType<typeof readForm>) {
  return translatorFormSchema.safeParse({
    ...raw,
    is_active: raw.is_active === "on",
    can_notarize: raw.can_notarize === "on",
    // The dropdown sets both flags; the API still keeps two.
    ...workFlags(raw.work_kind),
    language_pairs: pairsFromRows(readRows(raw.language_pairs)),
    cities: readPairs(raw.cities),
  });
}

/** The editor's rows, whatever shape the hidden field arrived in. */
function readRows(raw: string): PairRow[] {
  const text = (value: unknown) => (typeof value === "string" ? value : "");
  return (readPairs(raw) as Record<string, unknown>[]).map((row) => ({
    source_language: text(row?.source_language),
    target_language: text(row?.target_language),
    rate_per_page: text(row?.rate_per_page),
    reverse_rate_per_page: text(row?.reverse_rate_per_page),
    one_way: row?.one_way === true,
  }));
}

/**
 * The same set of pairs, rates included, in any order. What the form holds is
 * compared as the API would store it (each pair with its reverse), so a pair
 * saved both ways and left alone is not rewritten.
 */
function samePairs(next: TranslatorFormValues["language_pairs"], current: unknown): boolean {
  const stored = bothWays(next as DirectedPair[]);
  if (!Array.isArray(current) || current.length !== stored.length) return false;
  const key = (p: { source_language: string; target_language: string; rate_per_page: string | null }) =>
    `${p.source_language}>${p.target_language}@${p.rate_per_page === null ? "" : Number(p.rate_per_page)}`;
  const have = new Set((current as Parameters<typeof key>[0][]).map(key));
  return stored.every((pair) => have.has(key(pair)));
}

export async function createTranslatorAction(
  _previous: TranslatorFormState,
  formData: FormData,
): Promise<TranslatorFormState> {
  const locale = String(formData.get("locale") ?? "ka");
  const raw = readForm(formData);

  const parsed = parse(raw);
  if (!parsed.success) {
    return { ...(await validationFailed(parsed.error)), values: raw };
  }

  let created;
  try {
    created = await createTranslator(parsed.data);
  } catch (error) {
    return { ...(await describeApiError(error, "translator")), values: raw };
  }

  revalidateRoute("/translators");
  redirectTo(withFlash(`/translators/${created.id}`, "translatorCreated"), locale);
}

export async function updateTranslatorAction(
  _previous: TranslatorFormState,
  formData: FormData,
): Promise<TranslatorFormState> {
  const locale = String(formData.get("locale") ?? "ka");
  const id = Number(formData.get("id"));
  const raw = readForm(formData);

  if (!Number.isFinite(id)) return { error: (await getTranslations("validation"))("missingId") };

  const parsed = parse(raw);
  if (!parsed.success) {
    return { ...(await validationFailed(parsed.error)), values: raw };
  }

  // Re-read costs one request and buys a precise diff, so an untouched field
  // cannot clobber an edit someone else made in between.
  let current: Record<string, unknown> | null = null;
  try {
    current = (await getTranslator(id)) as unknown as Record<string, unknown>;
  } catch {
    current = null;
  }

  const changes = changedFields<TranslatorFormValues>(
    parsed.data,
    current,
    raw,
    TRANSLATOR_WRITE_ONLY,
  );
  // A list is never `===` the stored one: compare what it holds, so an
  // untouched set is not rewritten (and not logged as changed) on every save.
  if (current && samePairs(parsed.data.language_pairs, current.language_pairs)) {
    delete changes.language_pairs;
  }

  const have = Array.isArray(current?.cities) ? (current.cities as string[]) : [];
  if (current && parsed.data.cities.length === have.length && parsed.data.cities.every((c) => have.includes(c))) {
    delete changes.cities;
  }

  if (Object.keys(changes).length === 0) {
    redirectTo(withFlash(`/translators/${id}`, "translatorSaved"), locale);
  }

  try {
    await updateTranslator(id, changes);
  } catch (error) {
    return { ...(await describeApiError(error, "translator")), values: raw };
  }

  revalidateRoute("/translators");
  revalidateRoute(`/translators/${id}`);
  redirectTo(withFlash(`/translators/${id}`, "translatorSaved"), locale);
}

/** What the invite screen shows after a successful invite. */
export interface TranslatorInviteResult {
  translatorId: number;
  fullName: string;
  email: string;
  inviteStatus: InviteStatus;
  matchedDisplayName: string | null;
  emailSent: boolean;
  /** No address to write to: nothing was emailed, and nothing needs retrying. */
  noEmail: boolean;
}

export interface TranslatorInviteFormState {
  error?: string;
  fieldErrors?: TranslatorInviteFieldErrors;
  values?: Record<string, string>;
  invited?: TranslatorInviteResult;
  /** The API wants a fresh 2FA code first. */
  stepUp?: boolean;
}

/**
 * Invite a translator, and try to connect them to their suliko.ge account.
 *
 * Does NOT redirect on success, matching `inviteUserAction`: the result panel
 * — linked, or pending with the registration address to hand over — is the
 * deliverable, not a stepping stone to the next screen.
 */
export async function inviteTranslatorAction(
  _previous: TranslatorInviteFormState,
  formData: FormData,
): Promise<TranslatorInviteFormState> {
  const raw = readStrings(formData, [
    "full_name",
    "login",
    "suliko_user_id",
    "translator_id",
  ]);

  // The search box holds an address or a phone number. An address is who to
  // email (and, with no account picked, who to match); a number is only a
  // contact to record, because a number cannot be written to: the translator
  // must be picked from the list instead.
  const login = raw.login.trim();
  const byAddress = login.includes("@");
  const parsed = translatorInviteSchema.safeParse({
    full_name: raw.full_name,
    email: byAddress ? login : undefined,
    phone: byAddress || !login ? undefined : login,
    suliko_user_id: raw.suliko_user_id || undefined,
    translator_id: raw.translator_id,
  });
  if (!parsed.success) {
    return { ...(await validationFailed(parsed.error)), values: raw };
  }

  let result;
  try {
    result = await inviteTranslator(parsed.data);
  } catch (error) {
    return { ...(await describeApiError(error, "invitation")), values: raw };
  }

  revalidateRoute("/translators");
  revalidateRoute("/translators/invite");
  return {
    invited: {
      translatorId: result.translator.id,
      fullName: result.translator.name,
      email: byAddress ? login : "",
      inviteStatus: result.invite_status,
      matchedDisplayName: result.matched_display_name,
      emailSent: result.email_sent,
      noEmail: result.no_email ?? false,
    },
  };
}

/**
 * What the invite form's search finds: every suliko.ge account whose email or
 * phone number equals what was typed. Null while it is not yet complete enough
 * to ask about; `{ ok: false }` when suliko.ge could not be asked, which the
 * form says plainly rather than reporting "nobody".
 */
export async function searchTranslatorAccountsAction(
  login: string,
): Promise<{ ok: true; candidates: TranslatorCandidate[] } | { ok: false } | null> {
  const trimmed = login.trim();
  const isAddress = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  const isNumber = !trimmed.includes("@") && trimmed.replace(/\D/g, "").length >= 6;
  if (!isAddress && !isNumber) return null;
  try {
    return { ok: true, candidates: await searchTranslatorCandidates(trimmed) };
  } catch {
    return { ok: false };
  }
}

/**
 * Stop waiting for a match. The directory row and any existing link are
 * untouched — see `DELETE /translators/invites/{id}`.
 */
export async function cancelTranslatorInviteAction(formData: FormData): Promise<void> {
  const locale = String(formData.get("locale") ?? "ka");
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;

  try {
    await cancelTranslatorInvite(id);
  } catch {
    // Best-effort: cancelling only ever removes a wait, nothing to recover.
  }

  revalidateRoute("/translators/invite");
  redirectTo(withFlash("/translators/invite", "inviteCancelled"), locale);
}

export async function deleteTranslatorAction(formData: FormData): Promise<void> {
  const locale = String(formData.get("locale") ?? "ka");
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;

  try {
    await deleteTranslator(id);
  } catch (error) {
    // A translator with assigned documents cannot be removed — the work and
    // its cost would lose their owner. Deactivating is the intended path, so
    // the message says so instead of dumping the user on an error page.
    const reason =
      error instanceof ApiError && (error.status === 409 || error.status === 400)
        ? error.detail
        : (await getTranslations("translators"))("deleteRefused");
    redirectTo(`/translators/${id}?error=${encodeURIComponent(reason)}`, locale);
  }

  revalidateRoute("/translators");
  redirectTo(withFlash("/translators", "translatorDeleted"), locale);
}
