// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { z } from "zod";

/**
 * Phone numbers: what counts as one, and how to dial it.
 *
 * The phone fields took any text, so "abc" was saved and then offered as a
 * tel: link and an active Call button (audit F10). The rule here is loose on
 * purpose: clients ring from abroad, and people type spaces, brackets and
 * dashes. An optional leading +, then digits and those separators, 6 to 15
 * digits in all (15 is the E.164 maximum).
 */
const ALLOWED = /^\+?[\d\s().-]+$/;

export function isPhone(value: string): boolean {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "").length;
  return ALLOWED.test(trimmed) && digits >= 6 && digits <= 15;
}

/**
 * The tel: link for a stored number, or undefined when it is not one. Older
 * records may still hold text that was never a number; those show as text.
 */
export function telHref(value: string | null | undefined): string | undefined {
  if (!value || !isPhone(value)) return undefined;
  const trimmed = value.trim();
  return `tel:${trimmed.startsWith("+") ? "+" : ""}${trimmed.replace(/\D/g, "")}`;
}

/** What a phone box shows while empty: the shape of a Georgian mobile. */
export const PHONE_PLACEHOLDER = "+995 555 12 34 56";

/** An optional phone field: blank goes to the API as null. */
export const optionalPhone = z
  .string()
  .trim()
  .max(50, "maxChars:50")
  .refine((value) => !value || isPhone(value), "phone")
  .transform((value) => value || null)
  .nullable();
