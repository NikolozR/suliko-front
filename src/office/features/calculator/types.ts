// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
/**
 * Quote calculator types, mirroring `api/v1/calculator.py` and
 * `api/v1/reference.py`.
 *
 * Money arrives as strings, not numbers. The API serialises `Decimal` as a
 * JSON string precisely so it survives the trip intact — parsing it into a
 * JavaScript number here would reintroduce the float rounding the backend
 * went to some trouble to avoid. Format the string; never do arithmetic on it.
 */

export type Urgency = "standard" | "express" | "urgent";
export type HandoverMethod = "scan" | "pickup" | "delivery";
export type CopyType =
  | "original"
  | "plain"
  | "notary_original"
  | "notary_copy"
  | "notary_certified";

export interface EnumOption {
  value: string;
  label: string;
  multiplier?: string | null;
  extra_cost?: string | null;
  notarized?: boolean | null;
  requires_address?: boolean | null;
  /** Urgency only: days from order date to the default due date. */
  days?: number | null;
}

export interface ReferenceData {
  currency: string;
  languages: { code: string; name_en: string; name_ka: string }[];
  document_types: { id: number; name_en: string; name_ka: string; price_multiplier: string }[];
  language_pairs: {
    source_language: string;
    target_language: string;
    price_per_page: string;
  }[];
  urgency_levels: EnumOption[];
  handover_methods: EnumOption[];
  copy_types: EnumOption[];
  /** "characters": written work is priced from each document's character count. */
  pricing_unit?: "pages" | "characters";
  /** Characters in one standard page, when pricing by characters. */
  characters_per_page?: number;
  /** The bureau's calendar date now (`YYYY-MM-DD`), for form defaults. */
  today?: string | null;
  /** The bureau's own acquisition sources, after the built-in ones. */
  acquisition_sources?: string[];
  /** The bureau's own statuses, after `SELECTABLE_STATUSES`. */
  custom_statuses?: string[];
}

export interface QuoteDocumentInput {
  source_language: string;
  target_language: string;
  document_type_id: number;
  page_count: number;
  copy_type: CopyType;
  /** Overrides what the copy type implies (a notarised translation of an original). */
  is_notarized?: boolean | null;
}

export interface QuoteLine {
  translation_cost: string;
  notary_cost: string;
  certification_cost: string;
  price: string;
  /** Null without `reports.profit` — what the job costs is margin. */
  translator_cost: string | null;
  base_rate_per_page: string;
  document_type_multiplier: string;
  urgency_multiplier: string;
  /** Pages, or minutes on an oral line. */
  page_count: number;
  is_notarized: boolean;
  service_type?: "written" | "oral";
  /** Set when the translation was priced from characters. */
  character_count?: number | null;
  /** The standard pages those characters came to. */
  standard_pages?: string | null;
  /** No configured rate for this pair — the UI must warn rather than quote it. */
  used_fallback_rate: boolean;
}

export interface QuoteResponse {
  documents: QuoteLine[];
  documents_total: string;
  delivery_cost: string;
  total: string;
  /** Null without `reports.profit`. */
  translator_cost_total: string | null;
  notary_cost_total: string;
  gross_profit: string | null;
  currency: string;
}
