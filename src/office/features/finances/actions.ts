"use server";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { randomUUID } from "node:crypto";

import {
  createExpense,
  deleteExpense,
  deleteNotaryPayout,
  deletePayment,
  deleteTranslatorPayout,
  getTranslatorBalance,
  payNotary,
  payTranslator,
  recordPayment,
  type TranslatorBalance,
} from "@office/features/finances/api";
import {
  expenseFormSchema,
  notaryPayoutSchema,
  paymentFormSchema,
  translatorPayoutSchema,
  type FinanceFieldErrors,
} from "@office/features/finances/schema";
import { listOrders } from "@office/features/orders/api";
import type { OrderSummary } from "@office/features/orders/types";
import { redirectTo } from "@office/i18n/navigation";
import { safeNextPath } from "@office/shared/auth/next-path";
import { describeApiError, readStrings, validationFailed } from "@office/shared/lib/form-state";
import { type FlashKey, withFlash } from "@office/shared/lib/flash";
import { revalidateRoute } from "@office/shared/lib/revalidate";

/**
 * Money mutations.
 *
 * Every one of these moves real numbers, so each re-validates server-side with
 * the same schema the browser used and lets the API validate a third time
 * behind that. The API is the only authority: it re-checks that every
 * allocated order belongs to the paying client, that a payout goes to work
 * that translator did, and that nothing is allocated past what it owes.
 *
 * ## Where they go afterwards
 *
 * A form on the Finances screen redirects back to its tab. The same forms
 * opened as dialogs from an order, a client or a translator post `stay=1` and
 * get `{ ok: true }`, so the dialog closes and the page refreshes in place.
 */

export interface FinanceFormState {
  error?: string;
  fieldErrors?: FinanceFieldErrors;
  values?: Record<string, string>;
  ok?: boolean;
  /** The API wants a fresh 2FA code first. */
  stepUp?: boolean;
}

/**
 * The key a form made once, when it opened. Made per submit, a double-clicked
 * button sent two different keys and recorded the payment twice — the key
 * deduplicated nothing. The server fallback only covers a form that has not
 * hydrated yet.
 */
function idempotencyKey(formData: FormData): string {
  const key = String(formData.get("idempotency_key") ?? "").trim();
  return /^[\w-]{8,64}$/.test(key) ? key : randomUUID();
}

function finish(
  formData: FormData,
  fallback: string,
  touched: string[],
  done: FlashKey,
): FinanceFormState {
  for (const path of ["/finances", "/translations", "/dashboard", "/reports", ...touched]) {
    revalidateRoute(path);
  }
  if (formData.get("stay")) return { ok: true };
  const locale = String(formData.get("locale") ?? "ka");
  redirectTo(
    withFlash(safeNextPath(String(formData.get("return_to") ?? "")) ?? fallback, done),
    locale,
  );
}

function parseJsonArray(raw: string): unknown[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * A client's orders that still owe something, for the allocation table.
 *
 * Filtered by `client_id` on the API. It used to search by the client's name
 * and keep the rows whose id matched — correct, but two clients sharing a name
 * each saw the other's orders counted against the 200-row limit.
 */
export async function clientOrdersAction(clientId: number): Promise<OrderSummary[]> {
  if (!Number.isFinite(clientId) || clientId <= 0) return [];

  try {
    const { items } = await listOrders({ clientId, unpaid: true, limit: 200, sort: "id" });
    return items;
  } catch {
    // The form still works without it — allocations are optional.
    return [];
  }
}

/** What a translator has earned, been paid and is owed — the payout form's hint. */
export async function translatorBalanceAction(
  translatorId: number,
): Promise<TranslatorBalance | null> {
  if (!Number.isInteger(translatorId) || translatorId <= 0) return null;
  try {
    return await getTranslatorBalance(translatorId);
  } catch {
    return null;
  }
}

export async function recordPaymentAction(
  _previous: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const raw = {
    ...readStrings(formData, ["amount", "payment_date", "method", "notes"]),
    client_id: String(formData.get("client_id") ?? ""),
    client_id_label: String(formData.get("client_id_label") ?? ""),
    client_id_type: String(formData.get("client_id_type") ?? ""),
    allocations: String(formData.get("allocations") ?? "[]"),
  };

  const parsed = paymentFormSchema.safeParse({
    ...raw,
    client_id: Number(raw.client_id),
    allocations: parseJsonArray(raw.allocations),
  });
  if (!parsed.success) return { ...(await validationFailed(parsed.error)), values: raw };

  try {
    await recordPayment({ ...parsed.data, idempotency_key: idempotencyKey(formData) });
  } catch (error) {
    return { ...(await describeApiError(error, "payment")), values: raw };
  }

  const orders = parsed.data.allocations.map((a) => `/translations/${a.order_id}`);
  return finish(
    formData,
    "/finances?tab=payments",
    [`/clients/${parsed.data.client_id}`, ...orders],
    "paymentRecorded",
  );
}

export async function payTranslatorAction(
  _previous: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const raw = {
    ...readStrings(formData, ["amount", "payment_date", "method", "notes"]),
    translator_id: String(formData.get("translator_id") ?? ""),
    allocations: String(formData.get("allocations") ?? "[]"),
  };

  const parsed = translatorPayoutSchema.safeParse({
    ...raw,
    translator_id: Number(raw.translator_id),
    allocations: parseJsonArray(raw.allocations),
  });
  if (!parsed.success) return { ...(await validationFailed(parsed.error)), values: raw };

  try {
    await payTranslator({ ...parsed.data, idempotency_key: idempotencyKey(formData) });
  } catch (error) {
    return { ...(await describeApiError(error, "payout")), values: raw };
  }

  const orders = parsed.data.allocations.map((a) => `/translations/${a.order_id}`);
  return finish(
    formData,
    "/finances?tab=payouts",
    [`/translators/${parsed.data.translator_id}`, ...orders],
    "payoutRecorded",
  );
}

export async function payNotaryAction(
  _previous: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const raw = {
    ...readStrings(formData, ["amount", "payment_date", "method", "notes"]),
    documents: String(formData.get("documents") ?? "[]"),
  };

  // `[{document_id, amount}]` from the form, the API's parallel lists here.
  const documents = parseJsonArray(raw.documents) as { document_id?: unknown; amount?: unknown }[];
  const parsed = notaryPayoutSchema.safeParse({
    ...raw,
    document_ids: documents.map((d) => Number(d.document_id)),
    amounts: documents.map((d) => String(d.amount ?? "")),
  });
  if (!parsed.success) return { ...(await validationFailed(parsed.error)), values: raw };

  try {
    await payNotary({ ...parsed.data, idempotency_key: idempotencyKey(formData) });
  } catch (error) {
    return { ...(await describeApiError(error, "payout")), values: raw };
  }

  const orderId = Number(formData.get("order_id"));
  const notaryId = Number(formData.get("notary_id"));
  return finish(
    formData,
    "/finances?tab=payouts",
    [
      ...(orderId > 0 ? [`/translations/${orderId}`] : []),
      ...(notaryId > 0 ? [`/notaries/${notaryId}`] : []),
    ],
    "payoutRecorded",
  );
}

export async function createExpenseAction(
  _previous: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const raw = {
    ...readStrings(formData, ["expense_date", "category", "description", "amount"]),
    order_id: String(formData.get("order_id") ?? ""),
  };

  const parsed = expenseFormSchema.safeParse({
    ...raw,
    // Blank means a general business expense, which is null rather than 0.
    order_id: raw.order_id.trim() ? Number(raw.order_id) : null,
  });
  if (!parsed.success) return { ...(await validationFailed(parsed.error)), values: raw };

  try {
    await createExpense(parsed.data);
  } catch (error) {
    return { ...(await describeApiError(error, "expense")), values: raw };
  }

  return finish(
    formData,
    "/finances?tab=expenses",
    parsed.data.order_id ? [`/translations/${parsed.data.order_id}`] : [],
    "expenseAdded",
  );
}

// ── Undo ────────────────────────────────────────────────────────────────────
//
// For money recorded in error. Each needs `finance.refund` (expenses:
// `finance.expenses`) — undoing money is a higher-trust act than recording
// it. A refusal comes back to the page it was made from as `?error=`.

async function undo(
  formData: FormData,
  remove: (id: number) => Promise<void>,
  subject: string,
  fallback: string,
): Promise<void> {
  const locale = String(formData.get("locale") ?? "ka");
  const id = Number(formData.get("id"));
  const back = safeNextPath(String(formData.get("return_to") ?? "")) ?? fallback;
  if (!Number.isInteger(id) || id <= 0) redirectTo(back, locale);

  try {
    await remove(id);
  } catch (error) {
    const { error: message } = await describeApiError(error, subject);
    const separator = back.includes("?") ? "&" : "?";
    redirectTo(`${back}${separator}error=${encodeURIComponent(message)}`, locale);
  }

  for (const path of ["/finances", "/translations", "/dashboard", "/reports", back.split("?")[0]]) {
    revalidateRoute(path);
  }
  redirectTo(withFlash(back, "entryDeleted"), locale);
}

export async function deletePaymentAction(formData: FormData): Promise<void> {
  await undo(formData, deletePayment, "payment", "/finances?tab=payments");
}

export async function deleteTranslatorPayoutAction(formData: FormData): Promise<void> {
  await undo(formData, deleteTranslatorPayout, "payout", "/finances?tab=payouts");
}

export async function deleteNotaryPayoutAction(formData: FormData): Promise<void> {
  await undo(formData, deleteNotaryPayout, "payout", "/finances?tab=payouts");
}

export async function deleteExpenseAction(formData: FormData): Promise<void> {
  await undo(formData, deleteExpense, "expense", "/finances?tab=expenses");
}
