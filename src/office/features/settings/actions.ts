"use server";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { revalidateRoute } from "@office/shared/lib/revalidate";

import {
  deletePairPrice,
  listDocumentTypes,
  updateGeneral,
  upsertDocumentType,
  upsertLanguage,
  upsertPairPrice,
} from "@office/features/settings/api";
import {
  bureauPairSchema,
  documentTypeSchema,
  generalSchema,
  languageSchema,
  pairPriceSchema,
  type SettingsFieldErrors,
} from "@office/features/settings/schema";
import { describeApiError, readStrings, validationFailed } from "@office/shared/lib/form-state";

/**
 * Settings mutations.
 *
 * These change what every future quote costs, so the API audits each one with
 * a before/after record. Existing orders are unaffected either way: their
 * costs were stored when they were created, which is the whole reason the
 * pricing engine writes costs rather than recomputing them on read.
 *
 * Every action revalidates `/settings` and, where it matters, `/calculator`
 * and `/translations/new` — both read `/api/v1/reference`, which is cached for
 * a minute and would otherwise keep quoting the old rate.
 */

export interface SettingsFormState {
  error?: string;
  fieldErrors?: SettingsFieldErrors;
  values?: Record<string, string>;
  /** Set on success — these forms stay on the page rather than redirecting. */
  ok?: boolean;
  /** The API wants a fresh 2FA code first. */
  stepUp?: boolean;
}

/**
 * Pricing inputs feed the quote endpoints and the reference data.
 *
 * `getReference()` is not cached (see the note there), so the next request to
 * any of these pages already gets the new rate. This still matters for
 * someone who stays on the page: `revalidatePath` also purges the browser's
 * client-side Router Cache for that route, so a `<Link>` navigation to the
 * order builder or the calculator — without a full reload — does not serve a
 * render captured before the edit. By locale, because the real routes are
 * `/ka/calculator` and `/en/calculator`, not `/calculator`.
 */
function revalidatePricingConsumers() {
  revalidateRoute("/settings");
  revalidateRoute("/calculator");
  revalidateRoute("/translations/new");
}

/** An unchecked checkbox sends nothing at all, so absence is the value. */
function checkbox(formData: FormData, name: string): boolean {
  return formData.get(name) !== null;
}

// ── General ─────────────────────────────────────────────────────────────────

export async function updateGeneralAction(
  _previous: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const raw = readStrings(formData, [
    "organisation_name",
    "timezone",
    "default_language",
    "system_email",
    "urgency_multiplier_standard",
    "urgency_multiplier_express",
    "urgency_multiplier_urgent",
    "delivery_fee",
    "default_translator_share",
    "pricing_unit",
    "characters_per_page",
    "due_days_standard",
    "due_days_express",
    "due_days_urgent",
  ]);

  const parsed = generalSchema.safeParse(raw);
  if (!parsed.success) {
    return { ...(await validationFailed(parsed.error)), values: raw };
  }

  // The form collects a percentage because that is how people talk about it;
  // the API stores a fraction with three decimals. One decimal of percent is
  // exactly three of fraction, so a 45.5% share round-trips unchanged — the
  // first version showed it rounded to whole percent and wrote that rounding
  // back on every save of an unrelated field.
  const share = (Number(parsed.data.default_translator_share) / 100).toFixed(3);

  try {
    await updateGeneral({
      ...parsed.data,
      default_translator_share: share,
      characters_per_page: Number(parsed.data.characters_per_page),
      due_days_standard: Number(parsed.data.due_days_standard),
      due_days_express: Number(parsed.data.due_days_express),
      due_days_urgent: Number(parsed.data.due_days_urgent),
    });
  } catch (error) {
    return { ...(await describeApiError(error, "settings")), values: raw };
  }

  revalidatePricingConsumers();
  // The organisation name is in the app shell on every page.
  revalidatePath("/", "layout");
  return { ok: true };
}

// ── Document types ──────────────────────────────────────────────────────────

export async function saveDocumentTypeAction(
  _previous: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const rawId = String(formData.get("id") ?? "");
  const id = rawId ? Number(rawId) : null;
  const raw = {
    ...readStrings(formData, ["name_en", "name_ka", "price_multiplier"]),
    is_active: checkbox(formData, "is_active") ? "on" : "",
  };

  const parsed = documentTypeSchema.safeParse({
    ...raw,
    is_active: raw.is_active === "on",
  });
  if (!parsed.success) {
    return { ...(await validationFailed(parsed.error)), values: raw };
  }

  try {
    await upsertDocumentType(id, parsed.data);
  } catch (error) {
    return { ...(await describeApiError(error, "documentType")), values: raw };
  }

  revalidatePricingConsumers();
  return { ok: true };
}

/**
 * "Which documents do you translate?": the ticked document types are switched
 * on, the unticked ones off, in one go. A freelancer's types start switched
 * off (see `create_personal_workspace`), and switching 15 on one at a time was
 * the slowest part of getting started.
 *
 * Only types whose state changes are written. At least one must stay on:
 * with none there is nothing to choose in an order.
 */
export async function chooseDocumentTypesAction(
  _previous: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const chosen = new Set(
    formData
      .getAll("type_id")
      .map((value) => Number(value))
      .filter((id) => Number.isInteger(id) && id > 0),
  );
  if (chosen.size === 0) {
    return { error: (await getTranslations("dashboard"))("typesPrompt.none") };
  }

  try {
    const all = await listDocumentTypes();
    await Promise.all(
      all
        .filter((type) => type.is_active !== chosen.has(type.id))
        .map((type) =>
          upsertDocumentType(type.id, {
            name_en: type.name_en,
            name_ka: type.name_ka,
            price_multiplier: type.price_multiplier,
            is_active: chosen.has(type.id),
          }),
        ),
    );
  } catch (error) {
    return await describeApiError(error, "documentType");
  }

  revalidatePricingConsumers();
  revalidateRoute("/dashboard");
  return { ok: true };
}

// ── Languages ───────────────────────────────────────────────────────────────

export async function saveLanguageAction(
  _previous: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const rawId = String(formData.get("id") ?? "");
  const id = rawId ? Number(rawId) : null;
  const raw = {
    ...readStrings(formData, ["code", "name_en", "name_ka"]),
    is_active: checkbox(formData, "is_active") ? "on" : "",
  };

  const parsed = languageSchema.safeParse({ ...raw, is_active: raw.is_active === "on" });
  if (!parsed.success) {
    return { ...(await validationFailed(parsed.error)), values: raw };
  }

  try {
    await upsertLanguage(id, parsed.data);
  } catch (error) {
    return { ...(await describeApiError(error, "language")), values: raw };
  }

  revalidatePricingConsumers();
  return { ok: true };
}

// ── Pricing ─────────────────────────────────────────────────────────────────

export async function savePairPriceAction(
  _previous: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const rawId = String(formData.get("id") ?? "");
  const id = rawId ? Number(rawId) : null;
  const raw = {
    ...readStrings(formData, [
      "source_language",
      "target_language",
      "price_per_page",
      "price_per_minute",
    ]),
    is_active: checkbox(formData, "is_active") ? "on" : "",
  };

  const parsed = pairPriceSchema.safeParse({ ...raw, is_active: raw.is_active === "on" });
  if (!parsed.success) {
    return { ...(await validationFailed(parsed.error)), values: raw };
  }

  try {
    await upsertPairPrice(id, parsed.data);
  } catch (error) {
    return { ...(await describeApiError(error, "rate")), values: raw };
  }

  revalidatePricingConsumers();
  return { ok: true };
}

// ── Bureau orders (a freelancer's own workspace) ────────────────────────────

/**
 * "May other bureaus send you orders?", asked again after sign-up. Two radios
 * and neither is guessed, as in the chooser. The rates a bureau pays are only
 * shown while the answer is yes; switching to no hides them and keeps them.
 */
export async function saveOrderConsentAction(
  _previous: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const answer = String(formData.get("bureau_orders") ?? "");
  if (answer !== "yes" && answer !== "no") {
    return { error: (await getTranslations("validation"))("pickOne") };
  }

  try {
    await updateGeneral({ accepts_bureau_orders: answer === "yes" });
  } catch (error) {
    return await describeApiError(error, "settings");
  }

  revalidateRoute("/settings");
  return { ok: true };
}

/** A language pair with both rates: what the client pays, what a bureau pays. */
export async function saveBureauPairAction(
  _previous: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const rawId = String(formData.get("id") ?? "");
  const id = rawId ? Number(rawId) : null;
  const raw = {
    ...readStrings(formData, [
      "source_language",
      "target_language",
      "price_per_page",
      "price_per_page_bureau",
      "price_per_minute",
    ]),
    is_active: checkbox(formData, "is_active") ? "on" : "",
  };

  const parsed = bureauPairSchema.safeParse({ ...raw, is_active: raw.is_active === "on" });
  if (!parsed.success) {
    return { ...(await validationFailed(parsed.error)), values: raw };
  }

  try {
    await upsertPairPrice(id, parsed.data);
  } catch (error) {
    return { ...(await describeApiError(error, "rate")), values: raw };
  }

  revalidatePricingConsumers();
  return { ok: true };
}

export async function deletePairPriceAction(
  _previous: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) {
    return { error: (await getTranslations("validation"))("missingId") };
  }

  try {
    await deletePairPrice(id);
  } catch (error) {
    return await describeApiError(error, "rate");
  }

  revalidatePricingConsumers();
  return { ok: true };
}
