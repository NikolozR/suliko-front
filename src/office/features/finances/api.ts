// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import "server-only";

import type { PageMeta } from "@office/features/directory/types";
import type { PaymentMethod } from "@office/features/finances/constants";
import { api } from "@office/shared/lib/api";

/**
 * Finances, mirroring `api/v1/finances.py`.
 *
 * Every amount is a decimal string. Nothing here is a stored balance — the
 * API derives all of it from allocations at read time, so these figures are
 * always current and there is nothing to invalidate.
 */

/**
 * The enums and their labels live in `constants.ts`, not here: this module is
 * `server-only` and the payment and expense forms are Client Components.
 * Re-exported so callers that already read them from the API module keep
 * working, and so there is still one obvious place to look.
 */
export {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_VALUES,
  type ExpenseCategory,
  type PaymentMethod,
} from "@office/features/finances/constants";

export interface PeriodCashFlow {
  start: string | null;
  end: string | null;
  payments_received: string;
  translator_payouts: string;
  notary_payouts: string;
  expenses: string;
  net: string;
}

export interface FinanceOverview {
  receivables: string;
  receivable_clients: number;
  payables_translators: string;
  payables_notaries: string;
  unattributed_notary_fees: string;
  net_outstanding: string;
  period: PeriodCashFlow;
}

export interface ClientBalance {
  client_id: number;
  client_name: string;
  orders: number;
  billed: string;
  paid: string;
  outstanding: string;
  oldest_unpaid: string | null;
}

/** One client's whole position, for the client screen. */
export interface ClientAccount {
  client_id: number;
  /** Live orders — not cancelled or rejected. */
  orders: number;
  billed: string;
  paid: string;
  outstanding: string;
  oldest_unpaid: string | null;
  /** Received from this client and not allocated to any order yet. */
  unallocated_credit: string;
  last_payment_date: string | null;
}

export interface TranslatorBalance {
  translator_id: number;
  translator_name: string;
  earned: string;
  paid: string;
  /** Negative is credit: paid ahead of work, or for a job later cancelled. */
  outstanding: string;
}

export interface NotaryBalance {
  notary_id: number;
  notary_name: string;
  earned: string;
  paid: string;
  outstanding: string;
}

export interface Expense {
  id: number;
  expense_date: string;
  category: string;
  description: string;
  amount: string;
  order_id: number | null;
  /** The order's number in the bureau, which is what is shown. */
  order_number?: number | null;
  recorded_by_user_id: number | null;
  created_at: string;
}

export interface ExpensePage {
  items: Expense[];
  meta: PageMeta;
  /** Total over the whole filtered set, not just this page. */
  total_amount: string;
}

export interface PaymentAllocation {
  order_id: number;
  order_number?: number | null;
  amount_allocated: string;
}

export interface Payment {
  id: number;
  client_id: number;
  client_name: string | null;
  amount: string;
  payment_date: string;
  method: PaymentMethod;
  notes: string | null;
  recorded_by_user_id: number | null;
  allocations: PaymentAllocation[];
  unallocated: string;
}

export interface PaymentPage {
  items: Payment[];
  meta: PageMeta;
  total_amount: string;
}

export interface Payout {
  id: number;
  amount: string;
  payment_date: string;
  method: PaymentMethod;
  notes: string | null;
  unallocated: string;
}

export interface TranslatorPayout extends Payout {
  translator_id: number;
  translator_name: string | null;
  allocations: PaymentAllocation[];
  /** Of this payout, how much reimbursed notary fees the translator fronted. */
  notary_reimbursed: string;
}

export interface NotaryPayoutAllocation {
  order_document_id: number;
  order_id: number | null;
  order_number?: number | null;
  notary_id: number | null;
  notary_name: string | null;
  amount_allocated: string;
}

export interface NotaryPayout extends Payout {
  paid_via_translator_payment_id: number | null;
  allocations: NotaryPayoutAllocation[];
}

export interface PeriodParams {
  start?: string;
  end?: string;
}

function periodQuery(params: PeriodParams): string {
  const query = new URLSearchParams();
  if (params.start) query.set("start", params.start);
  if (params.end) query.set("end", params.end);
  return query.toString();
}

export async function getOverview(params: PeriodParams = {}): Promise<FinanceOverview> {
  const query = periodQuery(params);
  return api<FinanceOverview>(`/api/v1/finances/overview${query ? `?${query}` : ""}`);
}

export async function listReceivables(limit = 20): Promise<ClientBalance[]> {
  return api<ClientBalance[]>(`/api/v1/finances/receivables?limit=${limit}`);
}

export async function listPayables(limit = 20): Promise<TranslatorBalance[]> {
  return api<TranslatorBalance[]>(`/api/v1/finances/payables?limit=${limit}`);
}

export async function listNotaryBalances(limit = 20): Promise<NotaryBalance[]> {
  return api<NotaryBalance[]>(`/api/v1/finances/notary-balances?limit=${limit}`);
}

/**
 * One party's balance, whatever its size. The list endpoints above are the
 * top N by amount owed, so a detail page that looked itself up in them showed
 * "nothing owed" for anyone outside the top N.
 */
export async function getClientAccount(clientId: number): Promise<ClientAccount> {
  return api<ClientAccount>(`/api/v1/finances/receivables/${clientId}`);
}

export async function getTranslatorBalance(translatorId: number): Promise<TranslatorBalance> {
  return api<TranslatorBalance>(`/api/v1/finances/payables/${translatorId}`);
}

export async function getNotaryBalance(notaryId: number): Promise<NotaryBalance> {
  return api<NotaryBalance>(`/api/v1/finances/notary-balances/${notaryId}`);
}

export async function listExpenses(
  params: PeriodParams & {
    category?: string;
    orderId?: number;
    search?: string;
    sort?: "date" | "-date" | "amount" | "-amount";
    limit?: number;
    offset?: number;
  } = {},
): Promise<ExpensePage> {
  const query = new URLSearchParams(periodQuery(params));
  if (params.category) query.set("category", params.category);
  if (params.orderId !== undefined) query.set("order_id", String(params.orderId));
  if (params.search) query.set("search", params.search);
  query.set("sort", params.sort ?? "-date");
  query.set("limit", String(params.limit ?? 20));
  query.set("offset", String(params.offset ?? 0));
  return api<ExpensePage>(`/api/v1/finances/expenses?${query}`);
}

export async function createExpense(body: unknown): Promise<Expense> {
  return api<Expense>("/api/v1/finances/expenses", { method: "POST", body });
}

export async function deleteExpense(id: number): Promise<void> {
  await api<void>(`/api/v1/finances/expenses/${id}`, { method: "DELETE" });
}

export async function listPayments(
  params: PeriodParams & {
    clientId?: number;
    orderId?: number;
    method?: PaymentMethod;
    search?: string;
    limit?: number;
    offset?: number;
  } = {},
): Promise<PaymentPage> {
  const query = new URLSearchParams(periodQuery(params));
  if (params.clientId !== undefined) query.set("client_id", String(params.clientId));
  if (params.orderId !== undefined) query.set("order_id", String(params.orderId));
  if (params.method) query.set("method", params.method);
  if (params.search) query.set("search", params.search);
  query.set("limit", String(params.limit ?? 20));
  query.set("offset", String(params.offset ?? 0));
  return api<PaymentPage>(`/api/v1/finances/payments?${query}`);
}

export async function recordPayment(body: unknown): Promise<Payment> {
  return api<Payment>("/api/v1/finances/payments", { method: "POST", body });
}

export async function deletePayment(id: number): Promise<void> {
  await api<void>(`/api/v1/finances/payments/${id}`, { method: "DELETE" });
}

function payoutQuery(params: {
  translatorId?: number;
  notaryId?: number;
  orderId?: number;
  limit?: number;
  offset?: number;
}): string {
  const query = new URLSearchParams();
  if (params.translatorId !== undefined) query.set("translator_id", String(params.translatorId));
  if (params.notaryId !== undefined) query.set("notary_id", String(params.notaryId));
  if (params.orderId !== undefined) query.set("order_id", String(params.orderId));
  query.set("limit", String(params.limit ?? 50));
  query.set("offset", String(params.offset ?? 0));
  return query.toString();
}

export async function listTranslatorPayouts(
  params: { translatorId?: number; orderId?: number; limit?: number; offset?: number } = {},
): Promise<TranslatorPayout[]> {
  return api<TranslatorPayout[]>(`/api/v1/finances/translator-payouts?${payoutQuery(params)}`);
}

export async function listNotaryPayouts(
  params: { notaryId?: number; orderId?: number; limit?: number; offset?: number } = {},
): Promise<NotaryPayout[]> {
  return api<NotaryPayout[]>(`/api/v1/finances/notary-payouts?${payoutQuery(params)}`);
}

export async function payTranslator(body: unknown): Promise<Payout> {
  return api<Payout>("/api/v1/finances/translator-payouts", { method: "POST", body });
}

export async function payNotary(body: unknown): Promise<Payout> {
  return api<Payout>("/api/v1/finances/notary-payouts", { method: "POST", body });
}

export async function deleteTranslatorPayout(id: number): Promise<void> {
  await api<void>(`/api/v1/finances/translator-payouts/${id}`, { method: "DELETE" });
}

export async function deleteNotaryPayout(id: number): Promise<void> {
  await api<void>(`/api/v1/finances/notary-payouts/${id}`, { method: "DELETE" });
}
