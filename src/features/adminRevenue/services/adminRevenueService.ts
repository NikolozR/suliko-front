import { fetchWithAuth } from "@/features/adminPayments/services/adminPaymentsService";

export type RevenueGranularity = "week" | "month";

/** Confirmed money in one currency (GET Statistics/admin/payments, Statistics/admin/revenue-trend). */
export interface RevenueAmount {
  currency: string;
  amount: number;
  payments: number;
}

/** One card payment with who paid (GET Statistics/admin/payments). */
export interface AdminPaymentRow {
  orderId: string;
  createdAt: string;
  completedAt: string | null;
  amount: number;
  currency: string;
  /** succeeded, failed, created, pending, refunded, unknown. */
  status: string;
  provider: string;
  description: string | null;
  /** Pages put on the balance; only for a confirmed payment. */
  pages: number | null;
  userId: string | null;
  userName: string;
  email: string | null;
}

export interface AdminPaymentsPage {
  items: AdminPaymentRow[];
  total: number;
  page: number;
  pageSize: number;
  /** Confirmed money of the whole filtered set, per currency. */
  confirmed: RevenueAmount[];
  /** Payments of the filtered set per status, before the status filter. */
  byStatus: Record<string, number>;
}

export interface PaymentFilters {
  /** "confirmed", "all" or one status. */
  status: string;
  currency: string;
  /** yyyy-mm-dd, empty for no limit. */
  from: string;
  to: string;
  search: string;
  includeInternal: boolean;
}

export interface RevenueTrend {
  granularity: RevenueGranularity;
  currencies: string[];
  points: { periodStart: string; revenue: RevenueAmount[] }[];
}

const failure = (response: Response, what: string) =>
  new Error(
    response.status === 403
      ? "Your account is not allowed to see payments."
      : `Failed to load ${what} (${response.status})`,
  );

function filterParams(filters: PaymentFilters): URLSearchParams {
  const params = new URLSearchParams({
    status: filters.status,
    includeInternal: String(filters.includeInternal),
  });
  if (filters.currency) params.set("currency", filters.currency);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.search.trim()) params.set("search", filters.search.trim());
  return params;
}

/** One page of payments, newest first. */
export async function listAllPayments(
  filters: PaymentFilters,
  page: number,
  pageSize: number,
): Promise<AdminPaymentsPage> {
  const params = filterParams(filters);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  const response = await fetchWithAuth(`/Statistics/admin/payments?${params}`);
  if (!response.ok) throw failure(response, "payments");
  return response.json();
}

/** Revenue per week or month; dates are yyyy-mm-dd, empty means the last 12 periods. */
export async function getRevenueTrend(
  granularity: RevenueGranularity,
  from: string,
  to: string,
  includeInternal: boolean,
): Promise<RevenueTrend> {
  const params = new URLSearchParams({ granularity, includeInternal: String(includeInternal) });
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const response = await fetchWithAuth(`/Statistics/admin/revenue-trend?${params}`);
  if (!response.ok) throw failure(response, "the revenue trend");
  return response.json();
}

const CSV_PAGE = 1000;
const CSV_LIMIT = 20000;

const cell = (value: string | number | null) => {
  const text = value === null ? "" : String(value);
  // Quoted, with a leading apostrophe when a spreadsheet would read it as a formula.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/** Every payment of the filtered set (at most 20,000) as CSV text, oldest page last. */
export async function paymentsCsv(filters: PaymentFilters): Promise<{ csv: string; truncated: boolean }> {
  const rows: AdminPaymentRow[] = [];
  let total = 0;
  for (let page = 1; rows.length < CSV_LIMIT; page++) {
    const result = await listAllPayments(filters, page, CSV_PAGE);
    total = result.total;
    rows.push(...result.items);
    if (result.items.length < CSV_PAGE || rows.length >= result.total) break;
  }
  const header = ["Date (UTC)", "Order", "Name", "Email", "Amount", "Currency", "Status", "Provider", "Pages", "Description"];
  const lines = rows.map((p) =>
    [
      p.createdAt,
      p.orderId,
      p.userName,
      p.email,
      p.amount,
      p.currency,
      p.status,
      p.provider,
      p.pages,
      p.description,
    ]
      .map(cell)
      .join(","),
  );
  return { csv: [header.join(","), ...lines].join("\r\n"), truncated: total > rows.length };
}
