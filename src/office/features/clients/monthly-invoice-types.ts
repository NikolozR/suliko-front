// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import type { InvoiceParty } from "@office/features/settings/company-types";

/** Mirrors `api/v1/monthly_invoice.py`. */
export interface MonthlyInvoiceLine {
  /** "ქართული → ინგლისური", in the invoice's language. */
  languages: string;
  unit: "pages" | "minutes" | "characters";
  orders: number;
  quantity: number;
  /** The translation part: the notary fee is in the totals. */
  amount: string;
}

export interface MonthlyInvoice {
  number: string;
  issued_on: string;
  locale: "ka" | "en";
  /** "2026-10". */
  month: string;
  seller: InvoiceParty;
  seller_brand: string | null;
  buyer: InvoiceParty;
  bank: { bank_name: string; iban: string; swift: string; account_name: string };
  order_count: number;
  lines: MonthlyInvoiceLine[];
  translation_total: string;
  notary_total: string;
  delivery_cost: string;
  total: string;
  paid: string;
  balance_due: string;
  currency: string;
}
