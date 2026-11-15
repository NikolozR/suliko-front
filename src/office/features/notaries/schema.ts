// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { z } from "zod";
import { optionalPhone } from "@office/shared/lib/phone";

/**
 * Notary form validation.
 *
 * Mirrors `NotaryCreate` in `api/v1/notaries.py` (`extra="forbid"`, so an
 * unknown key is a 422 rather than a silently dropped field).
 *
 * Identity and bank details only. Notaries deliberately have no portal login —
 * see the module docstring on the API side before adding one.
 */

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

export const notaryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "name")
    .max(255, "maxChars:255"),

  phone: optionalPhone,
  email: optionalEmail,

  // The state register number. Appears on notarised documents, so it is worth
  // storing even though nothing validates its format.
  registration_number: optionalText(100),

  // Doubles as a pickup location on the order screen.
  office_address: optionalText(255),

  bank_iban: optionalText(34),
  bank_inn: optionalText(20),
  bank_code: optionalText(20),

  comment: z.string().trim().transform((value) => value || null).nullable(),
});

export type NotaryFormValues = z.infer<typeof notaryFormSchema>;
export type NotaryFieldErrors = Partial<Record<keyof NotaryFormValues, string[]>>;

/** Returned masked by the API, so a blank field means "keep", not "clear". */
export const NOTARY_WRITE_ONLY = ["bank_iban"] as const;
