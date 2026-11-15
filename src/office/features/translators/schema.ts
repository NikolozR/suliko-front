// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { z } from "zod";
import { isPhone, optionalPhone } from "@office/shared/lib/phone";

/**
 * Translator form validation.
 *
 * Mirrors `TranslatorCreate` in `api/v1/translators.py`, which is declared
 * `extra="forbid"` — an unknown key is a 422, not a silently dropped field.
 *
 * The portal password is deliberately absent. Setting a translator's login is
 * a separate, audited action on the API and does not belong in the profile
 * form; `has_portal_account` is read-only here.
 */

/** Blank goes to the API as null, never as "" — `EmailStr | None` rejects "". */
const optionalEmail = z
  .string()
  .trim()
  .transform((value) => value || null)
  .pipe(z.email("email").nullable());

function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max, `maxChars:${max}`)
    .transform((value) => value || null)
    .nullable();
}

/**
 * Money as a string, validated as a number.
 *
 * Kept as a string all the way to the API so the decimal survives the trip —
 * the backend parses it into a `Decimal`, and routing it through a JS number
 * first would be the one place precision is lost.
 */
const optionalRate = z
  .string()
  .trim()
  // "25,50" is what a Georgian keyboard types.
  .transform((value) => value.replace(/\s/g, "").replace(",", ".") || null)
  .refine(
    (value) => value === null || (/^\d+(\.\d{1,2})?$/.test(value) && Number(value) <= 100000),
    "amount",
  )
  .nullable();

/** `date | None` on the API. An ISO date or nothing — never an empty string. */
const optionalDate = z
  .string()
  .trim()
  .transform((value) => value || null)
  .refine(
    (value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value),
    "date",
  )
  .nullable();

/** One direction a translator works in. Codes are the bureau's own languages. */
const languagePair = z.object({
  source_language: z.string().trim().toLowerCase(),
  target_language: z.string().trim().toLowerCase(),
  rate_per_page: optionalRate,
  // Only this direction: the API adds the reverse otherwise (see ./pairs.ts).
  one_way: z.boolean().optional(),
});

export const translatorFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "name")
    .max(255, "maxChars:255"),

  phone: optionalPhone,
  email: optionalEmail,

  // Doubles as a pickup location on the order screen, so it is a real address
  // rather than free-form notes.
  office_address: optionalText(255),
  experience_from: optionalDate,
  default_rate: optionalRate,
  is_active: z.boolean(),

  // Payment credentials. Masked in list responses; the detail endpoint returns
  // only the last four digits of the IBAN.
  bank_iban: optionalText(34),
  bank_inn: optionalText(20),
  bank_code: optionalText(20),

  comment: z.string().trim().transform((value) => value || null).nullable(),

  // What the bureau can give them. Mirrors the API: written, oral or both,
  // never neither; each pair has two different languages and appears once.
  can_notarize: z.boolean(),
  works_written: z.boolean(),
  works_oral: z.boolean(),
  language_pairs: z.array(languagePair).max(100),
  cities: z.array(z.string().trim().toLowerCase()).max(40),
}).superRefine((value, context) => {
  if (!value.works_written && !value.works_oral) {
    context.addIssue({ code: "custom", path: ["works_written"], message: "workKind" });
  }
  const seen = new Set<string>();
  for (const pair of value.language_pairs) {
    const key = `${pair.source_language}>${pair.target_language}`;
    const problem = !pair.source_language || !pair.target_language
      ? "pairIncomplete"
      : pair.source_language === pair.target_language
        ? "pairSame"
        : seen.has(key)
          ? "pairTwice"
          : null;
    if (problem) {
      context.addIssue({ code: "custom", path: ["language_pairs"], message: problem });
      return;
    }
    seen.add(key);
  }
});

export type TranslatorFormValues = z.infer<typeof translatorFormSchema>;
export type TranslatorFieldErrors = Partial<Record<keyof TranslatorFormValues, string[]>>;

/**
 * The invite form.
 *
 * Mirrors `TranslatorInvite` in `api/v1/translators.py`. Phone stays optional
 * free text, same as the translator form above and the staff invite form —
 * normalisation for matching happens once, server-side, in `domain/portal.py`.
 */
export const translatorInviteSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(1, "name")
      .max(255, "maxChars:255"),
    /** Left out when the translator is picked by phone number. */
    email: z.email("email").max(255).optional(),
    phone: z
      .string()
      .trim()
      .max(50, "maxChars:50")
      .refine((value) => !value || isPhone(value), "phone")
      .optional(),
    /** The suliko.ge account picked from the search results. */
    suliko_user_id: z.string().trim().min(1).max(450).optional(),
    // An existing directory row to attach the invite to, or absent to create
    // one — set by the "attach to an existing entry" picker, not typed in.
    translator_id: z
      .string()
      .trim()
      .transform((value) => (value ? Number(value) : undefined))
      .optional(),
  })
  .superRefine((value, context) => {
    // Mirrors `TranslatorInvite` in the API: an address, or a picked account.
    // Reported on `email`, where the search box shows its errors.
    if (!value.email && !value.suliko_user_id) {
      context.addIssue({ code: "custom", path: ["email"], message: "pickAccountOrEmail" });
    }
  });

export type TranslatorInviteValues = z.infer<typeof translatorInviteSchema>;
export type TranslatorInviteFieldErrors = Partial<
  Record<keyof TranslatorInviteValues, string[]>
>;

/**
 * `bank_iban` is write-only from this form's point of view: the API returns it
 * masked, so there is nothing to diff against and a blank field means "keep
 * what is stored", not "erase it".
 */
export const TRANSLATOR_WRITE_ONLY = ["bank_iban"] as const;
