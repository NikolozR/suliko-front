// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { z } from "zod";
import { optionalPhone } from "@office/shared/lib/phone";

/**
 * Client form validation.
 *
 * One schema, used in three places: the browser (instant feedback), the server
 * action (the copy that actually matters), and as the source of the TypeScript
 * types. The API validates a third time — that is the only one that is
 * authoritative, but catching mistakes earlier makes for a better form.
 *
 * Shapes must match `ClientCreate` in `api/v1/clients.py`, which is declared
 * `extra="forbid"`: sending a field it does not know about is a 422, not a
 * silently ignored key. So this schema is exactly the API's field set.
 */

/**
 * The API types `email` as `EmailStr | None`. An empty string is neither, so
 * a blank field has to become `null` rather than `""` — otherwise every
 * client saved without an email fails validation.
 */
const optionalEmail = z
  .string()
  .trim()
  .transform((value) => value || null)
  .pipe(z.email("email").nullable());

/** Blank text fields go to the API as null, never as "". */
function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max, `maxChars:${max}`)
    .transform((value) => value || null)
    .nullable();
}

export const clientFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "name")
    .max(255, "maxChars:255"),

  client_type: z.enum(["B2B", "B2C"]),

  email: optionalEmail,
  phone: optionalPhone,
  address: optionalText(500),

  // National ID or company registration number. Sensitive — masked in lists,
  // and the API never returns it in full.
  personal_number: optionalText(50),

  // Free text, not an enum: the PHP stores it that way and the existing values
  // do not fit a fixed list.
  acquisition_source: optionalText(255),

  notes: z.string().trim().transform((value) => value || null).nullable(),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;

/** Field-keyed errors, the shape the form components consume. */
export type ClientFieldErrors = Partial<Record<keyof ClientFormValues, string[]>>;

/** Labels are `enums.clientType.*` in the message catalogues. */
export const CLIENT_TYPES = [
  { value: "B2B", label: "B2B" },
  { value: "B2C", label: "B2C" },
] as const;
