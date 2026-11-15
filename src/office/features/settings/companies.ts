// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import "server-only";

import type { MonthlyInvoice } from "@office/features/clients/monthly-invoice-types";
import { api } from "@office/shared/lib/api";

/**
 * Company records and invoices, mirroring `api/v1/companies.py`.
 *
 * Two companies per tenant: `legal_entity` is who the money is owed to — the
 * name, tax number and bank account an invoice must carry — and `brand` is
 * the trading identity the client recognises. They are often different, and
 * an invoice showing the brand where the law wants the legal entity is not a
 * valid invoice.
 */

export type {
  BankAccount,
  Company,
  CompanyRole,
  Invoice,
  InvoiceLine,
  InvoiceParty,
  InvoiceReadiness,
} from "@office/features/settings/company-types";
export { COMPANY_ROLES } from "@office/features/settings/company-types";

import type {
  BankAccount,
  Company,
  CompanyRole,
  Invoice,
  InvoiceReadiness,
} from "@office/features/settings/company-types";

export async function listCompanies(): Promise<Company[]> {
  return api<Company[]>("/api/v1/companies");
}

export async function saveCompany(role: CompanyRole, body: unknown): Promise<Company> {
  return api<Company>(`/api/v1/companies/${role}`, { method: "PUT", body });
}

export async function getInvoiceReadiness(): Promise<InvoiceReadiness> {
  return api<InvoiceReadiness>("/api/v1/companies/invoice-readiness");
}

export async function addBankAccount(role: CompanyRole, body: unknown): Promise<BankAccount> {
  return api<BankAccount>(`/api/v1/companies/${role}/bank-accounts`, {
    method: "POST",
    body,
  });
}

export async function makeBankAccountPrimary(id: number): Promise<BankAccount> {
  return api<BankAccount>(`/api/v1/companies/bank-accounts/${id}/primary`, {
    method: "POST",
  });
}

export async function deleteBankAccount(id: number): Promise<void> {
  await api<void>(`/api/v1/companies/bank-accounts/${id}`, { method: "DELETE" });
}

/**
 * Assemble an order's invoice.
 *
 * Amounts come from the order's stored document costs, never recomputed, so a
 * rate change since the order was placed cannot alter what the client is
 * billed. The API refuses (409) rather than issuing a document with no seller
 * or no payable account.
 */
export async function getOrderInvoice(
  orderId: number,
  locale: "ka" | "en" = "ka",
): Promise<Invoice> {
  return api<Invoice>(`/api/v1/orders/${orderId}/invoice?locale=${locale}`);
}

/**
 * A client's invoice for one month: the orders delivered to them in it,
 * grouped by language pair. `month` is "YYYY-MM".
 */
export async function getMonthlyInvoice(
  clientId: number,
  month: string,
  locale: "ka" | "en" = "ka",
): Promise<MonthlyInvoice> {
  return api<MonthlyInvoice>(
    `/api/v1/clients/${clientId}/monthly-invoice?month=${month}&locale=${locale}`,
  );
}
