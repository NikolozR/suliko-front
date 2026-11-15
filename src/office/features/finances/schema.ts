// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { z } from "zod";

import { EXPENSE_CATEGORIES, PAYMENT_METHOD_VALUES } from "@office/features/finances/constants";

/**
 * Money-in and money-out form validation. Messages are catalogue keys under
 * `validation`, translated by `validationFailed`.
 *
 * ## Amounts stay strings
 *
 * Every amount is validated as a decimal string and sent as one. The API
 * parses it into a `Decimal`; routing it through a JavaScript number first
 * would be the single place in the round trip where precision is lost, and it
 * would lose it silently. A comma is accepted as the decimal separator —
 * "120,50" is what a Georgian keyboard types.
 */

const AMOUNT_PATTERN = /^\d{1,8}(\.\d{1,2})?$/;

export function normaliseAmount(value: string): string {
  return value.replace(/\s/g, "").replace(",", ".");
}

/** Exact integer tetri for a validated amount — for comparing, never for sending. */
export function amountTetri(value: string): number {
  const [whole = "0", fraction = ""] = normaliseAmount(value).split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2));
}

const amount = z
  .string()
  .trim()
  .transform(normaliseAmount)
  .pipe(
    z
      .string()
      .min(1, "required")
      .regex(AMOUNT_PATTERN, "amount")
      .refine((value) => amountTetri(value) > 0, "positive"),
  );

const isoDate = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "date");

const notes = z
  .string()
  .trim()
  .max(255, "maxChars:255")
  .transform((value) => value || null)
  .nullable();

const method = z.enum(PAYMENT_METHOD_VALUES);

export const allocationSchema = z.object({
  order_id: z.number().int().positive(),
  amount_allocated: amount,
});

function allocationsFit<T extends { amount: string; allocations: { order_id: number; amount_allocated: string }[] }>(
  schema: z.ZodType<T>,
) {
  return schema
    .refine(
      (payment) =>
        payment.allocations.reduce((sum, a) => sum + amountTetri(a.amount_allocated), 0) <=
        amountTetri(payment.amount),
      { message: "allocationsExceed", path: ["allocations"] },
    )
    .refine(
      (payment) =>
        new Set(payment.allocations.map((a) => a.order_id)).size === payment.allocations.length,
      { message: "duplicateOrder", path: ["allocations"] },
    );
}

export const paymentFormSchema = allocationsFit(
  z.object({
    client_id: z.number().int().positive("pickClient"),
    amount,
    payment_date: isoDate,
    method,
    notes,
    /**
     * How the payment splits across orders. Empty is legal and means the money
     * is received but not yet assigned — the API reports it as `unallocated`.
     */
    allocations: z.array(allocationSchema).max(200),
  }),
);

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export const translatorPayoutSchema = allocationsFit(
  z.object({
    translator_id: z.number().int().positive("pickOne"),
    amount,
    payment_date: isoDate,
    method,
    notes,
    /** Which orders it was for. Optional: an unallocated payout still counts. */
    allocations: z.array(allocationSchema).max(200),
  }),
);

export type TranslatorPayoutValues = z.infer<typeof translatorPayoutSchema>;

/** Notary cost lives on the document, so a notary payout is allocated to documents. */
export const notaryPayoutSchema = z
  .object({
    amount,
    payment_date: isoDate,
    method,
    notes,
    document_ids: z.array(z.number().int().positive()).max(200),
    amounts: z.array(amount).max(200),
  })
  .refine((payout) => payout.document_ids.length === payout.amounts.length, {
    message: "pickOne",
    path: ["document_ids"],
  })
  .refine(
    (payout) =>
      payout.amounts.reduce((sum, value) => sum + amountTetri(value), 0) <=
      amountTetri(payout.amount),
    { message: "allocationsExceed", path: ["amounts"] },
  );

export type NotaryPayoutValues = z.infer<typeof notaryPayoutSchema>;

export const expenseFormSchema = z.object({
  expense_date: isoDate,
  category: z.enum(EXPENSE_CATEGORIES),
  description: z.string().trim().min(1, "required").max(255, "maxChars:255"),
  amount,
  /** Null is a general business cost; an id charges one order and cuts its profit. */
  order_id: z.number().int().positive().nullable(),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export type FinanceFieldErrors = Partial<
  Record<
    | keyof PaymentFormValues
    | keyof TranslatorPayoutValues
    | keyof NotaryPayoutValues
    | keyof ExpenseFormValues,
    string[]
  >
>;
