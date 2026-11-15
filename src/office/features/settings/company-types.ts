// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
/**
 * Company and invoice shapes, shared between server and client code.
 *
 * Deliberately NOT in `companies.ts`. That module is `server-only` because it
 * carries the session token, which is correct — but the Companies tab and the
 * invoice document are Client Components and need these types and the role
 * list. Importing a *value* from the server-only module makes the build fail,
 * which is the safeguard working; the fix is to keep the inert declarations
 * where both sides may legitimately read them.
 */

export type CompanyRole = "legal_entity" | "brand";

export const COMPANY_ROLES: { value: CompanyRole; label: string; help: string }[] = [
  {
    value: "legal_entity",
    label: "Legal entity",
    help: "Who the money is owed to. Its name, tax number and bank account appear on every invoice.",
  },
  {
    value: "brand",
    label: "Brand",
    help: "The trading name clients recognise. Optional. Invoices fall back to the legal entity.",
  },
];

export interface BankAccount {
  id: number;
  bank_name: string;
  /** Masked. The full IBAN only ever appears on a generated invoice. */
  bank_iban_masked: string | null;
  bank_swift: string;
  account_name: string;
  is_primary: boolean;
}

export interface Company {
  id: number;
  role: CompanyRole;
  name_ka: string;
  name_en: string;
  director_ka: string;
  director_en: string;
  site: string;
  address_ka: string;
  address_en: string;
  id_number: string;
  email: string;
  phone: string;
  whatsapp: string;
  bank_accounts: BankAccount[];
  /** Required fields still blank — drives the "cannot invoice yet" notice. */
  missing_for_invoice: string[];
}

export interface InvoiceReadiness {
  ok: boolean;
  problems: string[];
}

export interface InvoiceParty {
  name: string;
  address: string;
  id_number: string;
  email: string;
  phone: string;
  site: string;
  /** Who signs for the seller. Absent from an API older than the signature line. */
  director?: string;
}

export interface InvoiceLine {
  description: string;
  /** Full names in the invoice's language ("ქართული → ინგლისური"). */
  languages: string;
  /** Pages, or minutes when `unit` is "minutes". */
  pages: number;
  unit?: "pages" | "minutes" | "characters";
  unit_price: string;
  amount: string;
}

export interface Invoice {
  number: string;
  /** Derived from the order id, not allocated from a sequence. */
  is_provisional: boolean;
  issued_on: string;
  locale: "ka" | "en";
  seller: InvoiceParty;
  seller_brand: string | null;
  buyer: InvoiceParty;
  bank: {
    bank_name: string;
    /** In full — the client has to pay into it. */
    iban: string;
    swift: string;
    account_name: string;
  } | null;
  order_id: number;
  /** The order's number in the bureau, which the invoice prints. */
  order_number: number;
  /** The client's own reference (a tender number), when the order has one. */
  reference?: string | null;
  order_date: string;
  due_date: string | null;
  lines: InvoiceLine[];
  documents_total: string;
  delivery_cost: string;
  total: string;
  paid: string;
  balance_due: string;
  currency: string;
  /** The bureau uploaded its own invoice file: Word can be downloaded in it. */
  has_template?: boolean;
}
