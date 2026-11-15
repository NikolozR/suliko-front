// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { z } from "zod";

/**
 * Settings form validation.
 *
 * Mirrors `api/v1/settings.py`. Every bound here matches one on the API,
 * deliberately — a value this file accepts and the API rejects looks to the
 * user like a server bug rather than a typo.
 *
 * Messages are catalogue keys under `validation` (see `validationFailed`).
 *
 * ## Why the multipliers are bounded at all
 *
 * These are direct factors in `suliko.domain.pricing`. A multiplier of 0 makes
 * work free and a fat-fingered 100 quotes six figures; neither should be
 * reachable from a settings form. The API bounds them at 0.1–10 and this
 * matches.
 */

/**
 * A decimal as a string, kept as one so precision survives to the API.
 *
 * A comma is accepted as the decimal separator — it is what a Georgian
 * keyboard and habit produce ("1,5") — and normalised to a point.
 */
export function decimalString(min: number, max: number, places = 2, message = "amount") {
  const pattern = new RegExp(`^\\d+(\\.\\d{1,${places}})?$`);
  return z
    .string()
    .trim()
    .transform((value) => value.replace(/\s/g, "").replace(",", "."))
    .pipe(
      z
        .string()
        .min(1, "required")
        .regex(pattern, message)
        .refine((value) => {
          const n = Number(value);
          return n >= min && n <= max;
        }, message),
    );
}

function wholeDays() {
  return z
    .string()
    .trim()
    .regex(/^\d{1,3}$/, "wholeNumber")
    .refine((value) => Number(value) <= 365, "wholeNumber");
}

// ── General ─────────────────────────────────────────────────────────────────

export const generalSchema = z.object({
  organisation_name: z.string().trim().min(1, "name").max(255, "maxChars:255"),
  timezone: z.string().trim().min(1, "required").max(64, "maxChars:64"),

  default_language: z.string().trim().min(2, "minChars:2").max(5, "maxChars:5"),

  // `EmailStr | None` on the API: a blank field must become null, not "".
  system_email: z
    .string()
    .trim()
    .transform((value) => value || null)
    .pipe(z.email("email").nullable()),

  urgency_multiplier_standard: decimalString(0.1, 10, 3, "multiplier"),
  urgency_multiplier_express: decimalString(0.1, 10, 3, "multiplier"),
  urgency_multiplier_urgent: decimalString(0.1, 10, 3, "multiplier"),
  delivery_fee: decimalString(0, 10000),

  // Stored as a fraction (0.5 = 50%). The form shows a percentage, because
  // nobody in a bureau says "point five of the translation fee".
  default_translator_share: decimalString(0, 100, 1, "percent"),

  // Written work counted in pages, or in characters (with spaces) turned into
  // standard pages of this many characters.
  pricing_unit: z.enum(["pages", "characters"]),
  characters_per_page: z
    .string()
    .trim()
    .regex(/^\d+$/, "amount")
    .refine((value) => Number(value) >= 100 && Number(value) <= 100000, "amount"),

  due_days_standard: wholeDays(),
  due_days_express: wholeDays(),
  due_days_urgent: wholeDays(),
});

export type GeneralValues = z.infer<typeof generalSchema>;

// ── Document types ──────────────────────────────────────────────────────────

export const documentTypeSchema = z.object({
  name_en: z.string().trim().min(1, "name").max(255, "maxChars:255"),
  name_ka: z.string().trim().min(1, "name").max(255, "maxChars:255"),
  price_multiplier: decimalString(0.1, 100, 3, "multiplier"),
  is_active: z.boolean(),
});

export type DocumentTypeValues = z.infer<typeof documentTypeSchema>;

// ── Languages ───────────────────────────────────────────────────────────────

export const languageSchema = z.object({
  // Matches the API's pattern exactly — lowercase letters only. Orders and
  // pricing join on this value, which is why it is constrained.
  code: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z]{2,5}$/, "minChars:2"),
  name_en: z.string().trim().min(1, "name").max(100, "maxChars:100"),
  name_ka: z.string().trim().min(1, "name").max(100, "maxChars:100"),
  is_active: z.boolean(),
});

export type LanguageValues = z.infer<typeof languageSchema>;

// ── Pricing ─────────────────────────────────────────────────────────────────

/** Blank means no per-minute rate for the pair; sent as null. */
const optionalMinuteRate = z
  .string()
  .trim()
  // "1,5" is what a Georgian keyboard types.
  .transform((value) => value.replace(/\s/g, "").replace(",", "."))
  .refine(
    (value) => value === "" || (/^\d+(\.\d{1,2})?$/.test(value) && Number(value) <= 100000),
    "amount",
  )
  .transform((value) => value || null);

const pairFields = {
  source_language: z.string().trim().toLowerCase().min(2, "pickOne").max(5),
  target_language: z.string().trim().toLowerCase().min(2, "pickOne").max(5),
  price_per_page: decimalString(0, 100000),
  price_per_minute: optionalMinuteRate,
  is_active: z.boolean(),
};

const differentLanguages = {
  message: "pickOne",
  path: ["target_language"],
};

export const pairPriceSchema = z
  .object(pairFields)
  .refine((pair) => pair.source_language !== pair.target_language, differentLanguages);

export type PairPriceValues = z.infer<typeof pairPriceSchema>;

/**
 * The Orders tab's pair dialog: the same pair, and what a bureau pays for it.
 * Required here, because a freelancer who accepts bureau orders is asked for it;
 * the Pricing tab leaves it out of what it sends, so it never touches it.
 */
export const bureauPairSchema = z
  .object({ ...pairFields, price_per_page_bureau: decimalString(0, 100000) })
  .refine((pair) => pair.source_language !== pair.target_language, differentLanguages);

export type SettingsFieldErrors = Partial<Record<string, string[]>>;
