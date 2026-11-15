// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import "server-only";

import { api } from "@office/shared/lib/api";

/**
 * Reports and dashboard aggregates, mirroring `api/v1/reports.py`.
 *
 * Money arrives as decimal strings. Ratios (`margin`, `*_change`) arrive as
 * JS numbers because they are already lossy by nature — a margin is a ratio,
 * not an amount, and nothing downstream adds them up.
 */

export interface PeriodTotals {
  orders: number;
  revenue: string;
  /** Null without `reports.profit`. */
  profit: string | null;
  /** profit / revenue, or null when there was no revenue to divide by. */
  margin: number | null;
}

/**
 * Like-for-like month-over-month.
 *
 * `previous_partial` covers the SAME number of days of last month, which is
 * what the deltas are computed against. `previous_full` is context only —
 * showing a five-day month against a thirty-day one is the mistake this
 * shape exists to avoid.
 */
export interface Comparison {
  days_elapsed: number;
  current: PeriodTotals;
  previous_partial: PeriodTotals;
  previous_full: PeriodTotals;
  revenue_change: number | null;
  profit_change: number | null;
  orders_change: number | null;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface DashboardSummary {
  all_time: PeriodTotals;
  awaiting_payment: string;
  awaiting_payment_orders: number;
  this_month: Comparison;
  by_status: StatusCount[];
  open_orders: number;
  overdue_orders: number;
  /** The bureau's today, `YYYY-MM-DD`, the figures were computed for. */
  today?: string;
}

export interface MonthlyPoint {
  /** `YYYY-MM`. */
  month: string;
  revenue: string;
  profit: string;
  orders: number;
}

/**
 * What the bureau paid out to do the work. No delivery line: the courier fee
 * is passed through, not a cost — it is `ReportSummary.delivery_collected`.
 */
export interface CostBreakdown {
  translator: string;
  notary: string;
  expenses: string;
}

export interface ByClientType {
  client_type: "B2B" | "B2C";
  revenue: string;
  profit: string;
  orders: number;
}

export interface ReportSummary {
  start?: string | null;
  end?: string | null;
  period: PeriodTotals;
  /** Restricted to the chosen period, like every other figure here. */
  monthly_trends: MonthlyPoint[];
  cost_breakdown: CostBreakdown;
  /** Courier fees in the period's revenue, passed through to the courier. */
  delivery_collected?: string;
  by_client_type: ByClientType[];
}

/** Dashboard cards. Needs `reports.read` — every role has it. */
export async function getDashboard(): Promise<DashboardSummary> {
  return api<DashboardSummary>("/api/v1/reports/dashboard");
}

/**
 * Report charts. Needs `reports.profit`, which staff do NOT have — callers
 * must guard the route, not just hide the nav item.
 */
export async function getReportSummary(
  params: { start?: string; end?: string; months?: number } = {},
): Promise<ReportSummary> {
  const query = new URLSearchParams();
  if (params.start) query.set("start", params.start);
  if (params.end) query.set("end", params.end);
  query.set("months", String(params.months ?? 12));
  return api<ReportSummary>(`/api/v1/reports/summary?${query}`);
}
