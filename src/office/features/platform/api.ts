// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import "server-only";

import type { BillingInvoice, BillingPackage, BillingUsage } from "@office/features/billing/api";
import type { Role } from "@office/features/users/api";
import type { Plan } from "@office/shared/auth/plans";
import { api } from "@office/shared/lib/api";

/**
 * The platform area, mirroring `api/v1/platform.py`.
 *
 * Every call here is superuser-only and crosses tenants. The tenant is always
 * in the path — never inferred from the session — which is the same rule the
 * API enforces on its side.
 */

export type TenantStatus = "trial" | "active" | "suspended";

export interface TenantSummary {
  id: number;
  slug: string;
  display_name: string;
  status: TenantStatus;
  /** What is ENFORCED. A tenant mid-onboarding has none stored. */
  plan: Plan;
  onboarding_required: boolean;
  /** Which order package the account is on: 1, 2 or 3. */
  package_tier: number;
  /** Which set of three it is on: a bureau's or a freelancer's. */
  package_audience: "bureau" | "freelancer";
  /** A superadmin gave it Claude Translate (a worker on a Claude Code server). */
  claude_translate: boolean;
  locale: string;
  users: number;
  active_users: number;
  orders: number;
  created_at: string;
}

export interface PlatformUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  position: string | null;
  role: Role;
  is_active: boolean;
  must_change_password: boolean;
  last_login_at: string | null;
}

export interface PairPrice {
  source_language: string;
  target_language: string;
  price_per_page: string;
  is_active: boolean;
}

export interface TenantFigures {
  orders: number;
  documents: number;
  pages: number;
  revenue: string;
  translator_cost: string;
  notary_cost: string;
  /** Revenue less translator and notary costs. Excludes per-order expenses. */
  gross_profit: string;
  first_order: string | null;
  last_order: string | null;
}

/** What the organisation keeps in Suliko's order file storage. */
export interface StorageUsage {
  files: number;
  bytes: number;
}

export interface TenantDetail {
  tenant: TenantSummary;
  users: PlatformUser[];
  languages: string[];
  pricing: PairPrice[];
  figures: TenantFigures;
  storage: StorageUsage;
}

export interface PlatformTotals {
  tenants: number;
  active_tenants: number;
  suspended_tenants: number;
  by_plan: Record<string, number>;
  users: number;
  orders: number;
  revenue: string;
}

export async function listTenants(
  params: { search?: string; status?: TenantStatus; limit?: number; offset?: number } = {},
): Promise<{ items: TenantSummary[]; total: number }> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  query.set("limit", String(params.limit ?? 50));
  query.set("offset", String(params.offset ?? 0));
  return api(`/api/v1/platform/tenants?${query}`);
}

export async function getTenant(id: number): Promise<TenantDetail> {
  return api<TenantDetail>(`/api/v1/platform/tenants/${id}`);
}

export async function getPlatformTotals(): Promise<PlatformTotals> {
  return api<PlatformTotals>("/api/v1/platform/stats");
}

export async function setTenantStatus(
  id: number,
  status: TenantStatus,
  reason?: string,
): Promise<TenantSummary> {
  return api<TenantSummary>(`/api/v1/platform/tenants/${id}/status`, {
    method: "PUT",
    body: { status, reason },
  });
}

export async function setClaudeTranslate(id: number, enabled: boolean): Promise<TenantSummary> {
  return api<TenantSummary>(`/api/v1/platform/tenants/${id}/claude-translate`, {
    method: "PUT",
    body: { enabled },
  });
}

export interface ClaudeWorkerStatus {
  online: boolean;
  last_seen: string | null;
  /** Jobs waiting in organisations that have the feature, and jobs a worker holds. */
  queued: number;
  translating: number;
}

export async function getClaudeWorkerStatus(): Promise<ClaudeWorkerStatus> {
  return api<ClaudeWorkerStatus>("/api/v1/platform/claude-worker");
}

export async function createTenantUser(
  tenantId: number,
  body: unknown,
): Promise<{ user: PlatformUser; one_time_password: string | null }> {
  return api(`/api/v1/platform/tenants/${tenantId}/users`, { method: "POST", body });
}

export async function deleteTenantUser(tenantId: number, userId: number): Promise<void> {
  await api<void>(`/api/v1/platform/tenants/${tenantId}/users/${userId}`, {
    method: "DELETE",
  });
}

/** Someone with platform-wide reach. */
export interface Superuser {
  id: number;
  /** What they sign in with: the address, else the phone number. */
  login: string;
  full_name: string;
  tenant_id: number;
  tenant_slug: string;
  is_active: boolean;
  /** Their password is suliko.ge's; false for one made on the server. */
  signs_in_with_suliko: boolean;
  last_login_at: string | null;
}

export type SuperuserGrantStatus = "granted" | "already" | "not_found" | "invalid" | "conflict";

/** The API's answer for one line of the list. */
export interface SuperuserGrantResult {
  identifier: string;
  status: SuperuserGrantStatus;
  detail: string | null;
  superuser: Superuser | null;
  /** Their Office password stopped working: they now use the suliko.ge one. */
  password_moved_to_suliko: boolean;
}

export async function listSuperusers(): Promise<Superuser[]> {
  return api<Superuser[]>("/api/v1/platform/superusers");
}

/** Each identifier is a suliko.ge sign-in: an email address or a phone number. */
export async function grantSuperusers(
  identifiers: string[],
): Promise<{ results: SuperuserGrantResult[] }> {
  return api("/api/v1/platform/superusers", { method: "POST", body: { identifiers } });
}

export async function revokeSuperuser(userId: number): Promise<void> {
  await api<void>(`/api/v1/platform/superusers/${userId}`, { method: "DELETE" });
}

/** One thing about a person that bears on whether to confirm their deletion. */
export interface DeletionFinding {
  code: "only_owner" | "open_orders" | "unpaid_orders" | "payouts_owed";
  organisation: string;
  count: number | null;
  /** Money as the API sends it: a decimal string. */
  amount: string | null;
  /** Approving would leave an organisation with no owner: the API refuses. */
  blocking: boolean;
}

export type DeletionStatus = "requested" | "approved" | "rejected" | "done";

/** A person's request to have their Suliko Office account deleted. */
export interface DeletionRequest {
  id: number;
  status: DeletionStatus;
  requested_at: string;
  decided_at: string | null;
  /** When an approved request's data is deleted. */
  purge_after: string | null;
  done_at: string | null;
  review_note: string | null;
  name: string;
  login: string;
  email: string | null;
  phone: string | null;
  signs_in_with_suliko: boolean;
  organisations: string[];
  /** Empty once the request is over. */
  findings: DeletionFinding[];
}

export async function listDeletionRequests(): Promise<{
  open: DeletionRequest[];
  decided: DeletionRequest[];
}> {
  return api("/api/v1/platform/deletion-requests");
}

export async function approveDeletionRequest(
  id: number,
  body: { note?: string; acknowledged: boolean },
): Promise<DeletionRequest> {
  return api(`/api/v1/platform/deletion-requests/${id}/approve`, { method: "POST", body });
}

export async function rejectDeletionRequest(
  id: number,
  body: { note?: string },
): Promise<DeletionRequest> {
  return api(`/api/v1/platform/deletion-requests/${id}/reject`, { method: "POST", body });
}

/** One account's month against its package, with the invoice for it if there is one. */
export interface AccountBilling {
  tenant_id: number;
  name: string;
  slug: string;
  audience: "bureau" | "freelancer";
  status: TenantStatus;
  usage: BillingUsage;
  /** A superuser made this month free for the account. */
  free_month: boolean;
  invoice: BillingInvoice | null;
}

export interface PlatformBilling {
  /** "2026-10". */
  period: string;
  /** All six: the bureau set and the freelancer set. */
  packages: BillingPackage[];
  accounts: AccountBilling[];
}

/** One calendar month of one account, as its page lists it. */
export interface TenantBillingMonth {
  /** "2026-10". */
  period: string;
  orders: number;
  included: number;
  /** The invoice's total when there is one, else the package's fee. Null: no price. */
  fee: string | null;
  free: boolean;
  /** "free", "current", "not_invoiced", or the invoice's own status. */
  state: "free" | "current" | "not_invoiced" | BillingInvoice["status"];
  invoice: BillingInvoice | null;
}

/** One account's billing from outside: where it starts, this period, every month so far. */
export interface TenantBilling {
  tenant_id: number;
  audience: "bureau" | "freelancer";
  tier: number;
  /** The day the account began (YYYY-MM-DD). */
  billing_started: string;
  period: string;
  /** First and last day of the current period (YYYY-MM-DD). */
  period_start: string;
  period_end: string;
  free_this_month: boolean;
  /** Newest first. */
  months: TenantBillingMonth[];
}

/** What preparing a month's invoices did. */
export interface PrepareResult {
  period: string;
  created: number;
  /** Accounts that already had an invoice for the month, left as they were. */
  existing: number;
  /** Accounts whose own calendar month has not ended yet. */
  not_ended: number;
  /** Accounts with nothing to pay for the month (a free package, or no price). */
  nothing_due: number;
}

export async function getPlatformBilling(period?: string): Promise<PlatformBilling> {
  const query = period ? `?period=${encodeURIComponent(period)}` : "";
  return api<PlatformBilling>(`/api/v1/platform/billing${query}`);
}

export async function listBillingPackages(): Promise<BillingPackage[]> {
  return api<BillingPackage[]>("/api/v1/platform/billing/packages");
}

/** Money as a decimal string; "0" is free and null means "no price, agreed with each account". */
export async function editBillingPackage(
  audience: string,
  tier: number,
  body: { orders_included: number; monthly_price: string | null },
): Promise<BillingPackage> {
  return api<BillingPackage>(`/api/v1/platform/billing/packages/${audience}/${tier}`, {
    method: "PUT",
    body,
  });
}

export async function setTenantPackage(
  id: number,
  tier: number,
): Promise<{ tenant_id: number; tier: number; previous: number }> {
  return api(`/api/v1/platform/tenants/${id}/package`, { method: "PUT", body: { tier } });
}

export async function getTenantBilling(id: number): Promise<TenantBilling> {
  return api<TenantBilling>(`/api/v1/platform/tenants/${id}/billing`);
}

/** Make one whole month free for an account, or take that back. Only the fee is waived. */
export async function setFreeMonth(
  id: number,
  period: string,
  free: boolean,
): Promise<{ tenant_id: number; period: string; free: boolean }> {
  return api(`/api/v1/platform/tenants/${id}/free-months/${period}`, {
    method: "PUT",
    body: { free },
  });
}

export async function prepareInvoices(period: string): Promise<PrepareResult> {
  return api<PrepareResult>("/api/v1/platform/billing/invoices", {
    method: "POST",
    body: { period },
  });
}

export async function setInvoiceStatus(
  id: number,
  body: { status: BillingInvoice["status"]; note: string | null },
): Promise<BillingInvoice> {
  return api<BillingInvoice>(`/api/v1/platform/billing/invoices/${id}`, {
    method: "PUT",
    body,
  });
}
