// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import "server-only";

import { api } from "@office/shared/lib/api";

export interface GeneralSettings {
  organisation_name: string;
  timezone: string;
  default_language: string;
  system_email: string | null;
  urgency_multiplier_standard: string;
  urgency_multiplier_express: string;
  urgency_multiplier_urgent: string;
  delivery_fee: string;
  default_translator_share: string;
  /** How written work is counted for pricing. */
  pricing_unit: "pages" | "characters";
  /** Characters in one standard page. */
  characters_per_page: number;
  due_days_standard: number;
  due_days_express: number;
  due_days_urgent: number;
  /**
   * A freelancer's answer to "may other bureaus send you orders?". Null: a
   * bureau, or a personal workspace that was never asked.
   */
  accepts_bureau_orders: boolean | null;
}

export interface DocumentType {
  id: number;
  name_en: string;
  name_ka: string;
  price_multiplier: string;
  is_active: boolean;
}

export interface Language {
  id: number;
  code: string;
  name_en: string;
  name_ka: string;
  is_active: boolean;
}

export interface PairPrice {
  id: number;
  source_language: string;
  target_language: string;
  price_per_page: string;
  /** What interpreting costs per minute for the pair; null: not offered. */
  price_per_minute: string | null;
  /**
   * What a bureau pays per page for the pair, as against `price_per_page`, which
   * is what the freelancer charges their own clients. Null: not set. Optional
   * for an API that predates it.
   */
  price_per_page_bureau?: string | null;
  is_active: boolean;
}

export async function getGeneral(): Promise<GeneralSettings> {
  return api<GeneralSettings>("/api/v1/settings/general");
}

export async function listDocumentTypes(): Promise<DocumentType[]> {
  return api<DocumentType[]>("/api/v1/settings/document-types");
}

export async function listLanguages(): Promise<Language[]> {
  return api<Language[]>("/api/v1/settings/languages");
}

export async function listPricing(): Promise<PairPrice[]> {
  return api<PairPrice[]>("/api/v1/settings/pricing");
}

export async function updateGeneral(body: unknown): Promise<GeneralSettings> {
  return api<GeneralSettings>("/api/v1/settings/general", { method: "PATCH", body });
}

/**
 * Create or update, chosen by whether there is an id.
 *
 * One function rather than two per entity: the dialog that calls it is the
 * same dialog in both modes, and splitting them only moves the branch.
 */
export async function upsertDocumentType(
  id: number | null,
  body: unknown,
): Promise<DocumentType> {
  return id === null
    ? api<DocumentType>("/api/v1/settings/document-types", { method: "POST", body })
    : api<DocumentType>(`/api/v1/settings/document-types/${id}`, { method: "PATCH", body });
}

export async function upsertLanguage(id: number | null, body: unknown): Promise<Language> {
  return id === null
    ? api<Language>("/api/v1/settings/languages", { method: "POST", body })
    : api<Language>(`/api/v1/settings/languages/${id}`, { method: "PATCH", body });
}

export async function upsertPairPrice(id: number | null, body: unknown): Promise<PairPrice> {
  return id === null
    ? api<PairPrice>("/api/v1/settings/pricing", { method: "POST", body })
    : api<PairPrice>(`/api/v1/settings/pricing/${id}`, { method: "PATCH", body });
}

/**
 * Rates are the only reference rows that can be deleted.
 *
 * Document types and languages are referenced by code or id from historical
 * orders, so they are deactivated instead — see the note on the API's
 * `update_language`. A rate row is referenced by nothing: document costs are
 * stored at creation, so removing a rate changes future quotes only.
 */
export async function deletePairPrice(id: number): Promise<void> {
  await api<void>(`/api/v1/settings/pricing/${id}`, { method: "DELETE" });
}
