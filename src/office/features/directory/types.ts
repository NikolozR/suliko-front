// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
/**
 * Shared shapes for the three directory screens.
 *
 * Clients, translators and notaries are the same screen with different
 * columns: a searchable, filterable, paginated list plus CRUD. These types
 * are what let one set of list components serve all three.
 */

export interface PageMeta {
  total: number;
  limit: number;
  offset: number;
}

export interface Page<T> {
  items: T[];
  meta: PageMeta;
}

export const DIRECTORY_PAGE_SIZE = 20;

/** Sort values the directory endpoints accept. */
export type DirectorySort = "name" | "-name" | "id" | "-id";

export interface TranslatorSummary {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  /** Drives the Active / None account badge. */
  has_portal_account: boolean;
  bank_iban_masked: string | null;
  /** Per-page rate; the order builder pre-fills translator cost from it. */
  default_rate: string | null;
  /**
   * What the bureau can give them. Optional only so a screen survives an API
   * older than these fields; read them through `translatorWork`.
   */
  can_notarize?: boolean;
  works_written?: boolean;
  works_oral?: boolean;
  /** City codes where they certify; see `translators/cities.ts`. */
  cities?: string[];
  /** The directions they work in, each with an optional own rate per page. */
  language_pairs?: TranslatorLanguagePair[];
}

export interface TranslatorLanguagePair {
  source_language: string;
  target_language: string;
  rate_per_page: string | null;
}

/** A translator's capabilities with the defaults every translator had before them. */
export function translatorWork(translator: TranslatorSummary) {
  return {
    canNotarize: translator.can_notarize ?? false,
    written: translator.works_written ?? true,
    oral: translator.works_oral ?? false,
    pairs: translator.language_pairs ?? [],
    cities: translator.cities ?? [],
  };
}

export interface TranslatorDetail extends TranslatorSummary {
  office_address: string | null;
  comment: string | null;
  experience_from: string | null;
  bank_inn: string | null;
  bank_code: string | null;
  portal_username: string | null;
}

export interface NotarySummary {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  registration_number: string | null;
  /** True when an IBAN is on file — the Ready / No IBAN badge. */
  bank_ready: boolean;
  bank_iban_masked: string | null;
}

export interface NotaryDetail extends NotarySummary {
  office_address: string | null;
  comment: string | null;
  bank_inn: string | null;
  bank_code: string | null;
}
