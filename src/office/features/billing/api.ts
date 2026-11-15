// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import "server-only";

import { api } from "@office/shared/lib/api";

/**
 * An account's order package, this month's usage and the invoices it has been
 * asked to pay. Mirrors `api/v1/billing.py`.
 *
 * Read-only here: only a superuser changes a package or an invoice (see
 * `features/platform`). Money arrives as decimal strings and is formatted with
 * `formatMoneyString`, never turned into a float.
 */

/** "ok" under 80 percent of the included orders, "near" from there, "limit" at all of them. */
export type UsageLevel = "ok" | "near" | "limit";

export interface BillingPackage {
  /** "bureau" or "freelancer": each has its own set of three. */
  audience: "bureau" | "freelancer";
  tier: number;
  orders_included: number;
  /** "0.00" is free. Null: agreed with Suliko, so there is no price to show. */
  monthly_price: string | null;
}

export interface BillingUsage {
  /** "2026-10": the account's own calendar month. */
  period: string;
  tier: number;
  orders: number;
  included: number;
  remaining: number;
  level: UsageLevel;
  /** All the orders are used: new ones are refused until the package is raised. */
  blocked: boolean;
  monthly_price: string | null;
  /** A superuser made this month free: no fee. The package's order limit still applies. */
  free_month: boolean;
}

export type InvoiceStatus = "open" | "sent" | "paid" | "waived";

export interface BillingInvoice {
  id: number;
  period: string;
  tier: number;
  status: InvoiceStatus;
  orders_included: number;
  orders_counted: number;
  monthly_price: string | null;
  total: string;
  sent_at: string | null;
  paid_at: string | null;
  note: string | null;
}

export interface BillingOverview {
  usage: BillingUsage;
  packages: BillingPackage[];
  /** The packages this account can move to by itself: bigger, and with a price. */
  upgrade_to: number[];
  /** The version of the terms the confirmation is made against; sent back. */
  terms_version: string;
  invoices: BillingInvoice[];
  /** Months ("2026-09") made free for this account, listed beside the invoices. */
  free_months: string[];
}

export async function getBillingOverview(): Promise<BillingOverview> {
  return api<BillingOverview>("/api/v1/billing");
}

/** This month only: the sidebar figure and the warning banner. */
export async function getBillingUsage(): Promise<BillingUsage> {
  return api<BillingUsage>("/api/v1/billing/usage");
}

/** Move up to a bigger package now. The terms were shown and accepted. */
export async function upgradeBillingPackage(body: {
  tier: number;
  accepted_terms: boolean;
  terms_version: string;
}): Promise<BillingUsage> {
  return api<BillingUsage>("/api/v1/billing/upgrade", { method: "POST", body });
}
