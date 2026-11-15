// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
/**
 * The API's reasons an invoice cannot be issued, in the reader's language.
 *
 * The API words them in English, and its refusal to issue one lists raw
 * column names: "missing name_ka, id_number, address_ka" (audit F22). Its
 * wording is fixed, so each known sentence and field maps to a catalogue key
 * under `invoice.problems` / `invoice.fields`; anything unknown passes
 * through as the API wrote it rather than vanishing.
 */

const PROBLEMS: Record<string, string> = {
  "Set the legal entity's name.": "setLegalName",
  "Set the tax / registration number.": "setTaxNumber",
  "Set the legal address.": "setLegalAddress",
  "Add a bank account. An invoice needs one to be payable.": "addBankAccount",
  "Mark one bank account as primary.": "markPrimary",
  "The primary bank account has no IBAN.": "primaryNoIban",
};

const FIELDS: Record<string, string> = {
  name_ka: "legalName",
  id_number: "taxNumber",
  address_ka: "legalAddress",
};

type Translate = ((key: string) => string) & { has: (key: string) => boolean };

/** One readiness problem from `GET /companies/invoice-readiness`. */
export function describeInvoiceProblem(problem: string, t: Translate): string {
  const key = PROBLEMS[problem.trim()];
  return key && t.has(`problems.${key}`) ? t(`problems.${key}`) : problem;
}

/**
 * The fields named in the 409 from `GET /orders/{id}/invoice`, translated,
 * or null when the message is not the one about missing fields.
 */
export function missingInvoiceFields(detail: string, t: Translate): string[] | null {
  const match = /missing ([a-z_, ]+)\./i.exec(detail);
  if (!match) return null;
  return match[1]
    .split(",")
    .map((field) => field.trim())
    .filter(Boolean)
    .map((field) => (FIELDS[field] && t.has(`fields.${FIELDS[field]}`) ? t(`fields.${FIELDS[field]}`) : field));
}
