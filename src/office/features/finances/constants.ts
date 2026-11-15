// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
/**
 * Finance vocabularies, mirroring the enums in `models/finance.py` and
 * `EXPENSE_CATEGORIES` in `api/v1/finances.py`.
 *
 * Deliberately NOT in `api.ts`. That module is `server-only`, which is correct
 * for anything that carries the session token — but these are just values, and
 * the payment and expense forms are Client Components that need them.
 *
 * Labels are in the message catalogues (`enums.paymentMethod.*`,
 * `enums.expenseCategory.*`); the English maps below are only the fallback for
 * a value the catalogue does not know yet.
 */

export const PAYMENT_METHOD_VALUES = [
  "bank_transfer",
  "cash",
  "card",
  "bog_online",
  "other",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHOD_VALUES)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  bank_transfer: "Bank transfer",
  card: "Card",
  bog_online: "Online payment",
  other: "Other",
};

/** Order matches the dropdown; bank transfer first because it is the common case. */
export const PAYMENT_METHODS = PAYMENT_METHOD_VALUES.map((value) => ({
  value,
  label: PAYMENT_METHOD_LABELS[value],
}));

export const EXPENSE_CATEGORIES = [
  "courier",
  "notary_office",
  "office",
  "rent",
  "utilities",
  "marketing",
  "salary",
  "software",
  "tax",
  "other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  courier: "Courier",
  notary_office: "Notary office",
  office: "Office",
  rent: "Rent",
  utilities: "Utilities",
  marketing: "Marketing",
  salary: "Salary",
  software: "Software",
  tax: "Tax",
  other: "Other",
};
