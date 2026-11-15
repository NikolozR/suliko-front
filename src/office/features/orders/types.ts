// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
/**
 * Order shapes, mirroring `api/v1/orders.py`.
 *
 * Money arrives as decimal strings and stays that way — parsing to a JS number
 * would undo the precision the backend preserves. Format it; never compute
 * with it here.
 */

import type { PageMeta } from "@office/features/directory/types";

export type Urgency = "standard" | "express" | "urgent";
export type HandoverMethod = "scan" | "pickup" | "delivery";
export type CopyType =
  | "original" | "plain" | "notary_original" | "notary_copy" | "notary_certified";
export type PaidState = "unpaid" | "partial" | "paid";
/** Written: a document, counted in pages. Oral: interpreting, counted in minutes. */
export type ServiceType = "written" | "oral";

/** A translator or notary as offered in the order builder's assignment pickers. */
export interface Assignee {
  id: number;
  name: string;
  /**
   * A translator's own per-page rate, when they have one. The order form
   * pre-fills translator cost as this x pages — how the PHP office screen
   * priced a translator — and the API applies the same default.
   */
  default_rate?: string | null;
  /**
   * Translators only, for the order form's warnings: whether they may certify
   * at a notary, and the pairs they work in (empty: not stated, so no warning).
   */
  can_notarize?: boolean;
  pairs?: { source_language: string; target_language: string }[];
}

/** The fields of an `Assignee` that describe a translator's work. */
export function assigneeWork(person: {
  can_notarize?: boolean;
  language_pairs?: { source_language: string; target_language: string }[];
}): Pick<Assignee, "can_notarize" | "pairs"> {
  return {
    // Left undefined by an API older than the field, so nothing is warned about.
    can_notarize: person.can_notarize,
    pairs: (person.language_pairs ?? []).map(({ source_language, target_language }) => ({
      source_language,
      target_language,
    })),
  };
}

export interface OrderSummary {
  id: number;
  /** The bureau's own number, 1, 2, 3: what people see. `id` is for links. */
  number: number;
  /** The client's own reference, such as a tender number. Usually none. */
  identifier?: string | null;
  order_date: string;
  due_date: string | null;
  client_id: number;
  client_name: string;
  client_type: "B2B" | "B2C";
  /** Raw stored value — pass to StatusBadge, never render directly. */
  status: string | null;
  status_label: string;
  urgency: Urgency;
  document_count: number;
  page_count: number;
  total: string;
  paid: string;
  /**
   * After translator, notary and expenses; the courier fee is passed through,
   * not profit. Null for anyone without `reports.profit` — the API strips it.
   */
  profit: string | null;
  paid_state: PaidState;
  /** Past due and still open, decided by the API in the bureau's timezone. */
  is_overdue: boolean;
  /** List only: who is translating it, and its pairs as `ka→en`. */
  translator_names?: string[];
  language_pairs?: string[];
}

export interface OrderDocument {
  id: number;
  /** Null on an oral line. */
  document_type_id: number | null;
  /** Older APIs send nothing: every line was a written one. */
  service_type?: ServiceType;
  document_type_name: string | null;
  document_type_name_ka: string | null;
  source_language: string;
  target_language: string;
  /** Pages, or minutes on an oral line. */
  page_count: number;
  /** Characters with spaces, when the line was priced by characters. */
  character_count?: number | null;
  /** Oral lines: where it takes place, and the day and time of day there. */
  interpreting_place?: string | null;
  interpreting_date?: string | null;
  /** "HH:MM:SS" from the API. */
  interpreting_time?: string | null;
  copy_type: CopyType;
  is_notarized: boolean;
  price: string;
  /** Null without `reports.profit`. */
  translator_cost: string | null;
  notary_cost: string | null;
  translator_id: number | null;
  translator_name: string | null;
  notary_id: number | null;
  notary_name: string | null;
}

export interface StatusEvent {
  status: string;
  status_label: string;
  changed_at: string;
  changed_by_user_id: number | null;
  changed_by_name: string | null;
  note: string | null;
}

export interface OrderDetail extends OrderSummary {
  contact_info: string | null;
  handover_method: HandoverMethod;
  delivery_address: string | null;
  delivery_cost: string;
  source: string | null;
  notes: string | null;
  /** For Claude Translate: names, a glossary, rules. Sent with every file. */
  translation_instructions: string | null;
  /** The order's folder in the organisation's Google Drive, once made. */
  drive_folder_url: string | null;
  /** The organisation has Drive connected: the Files card offers the copy button. */
  drive_connected: boolean;
  documents_total: string;
  /** Null without `reports.profit`. */
  translator_total: string | null;
  notary_total: string | null;
  expenses_total: string | null;
  documents: OrderDocument[];
  status_history: StatusEvent[];
}

export interface OrderPage {
  items: OrderSummary[];
  meta: PageMeta;
}
