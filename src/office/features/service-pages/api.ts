// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import "server-only";

import type { PageMeta } from "@office/features/directory/types";
import { api } from "@office/shared/lib/api";

/**
 * Marketing-site CMS, mirroring `api/v1/service_pages.py`.
 *
 * Two shapes on purpose: a page is a document, a string is a cell in a grid.
 * They are edited differently, so they are not folded together.
 */

export type PageStatus = "draft" | "published";

/** The locales the public site is published in. Mirrors LOCALES on the API. */
export const CMS_LOCALES = ["ka", "en"] as const;
export type CmsLocale = (typeof CMS_LOCALES)[number];

export const LOCALE_LABELS: Record<CmsLocale, string> = {
  ka: "Georgian",
  en: "English",
};

export interface ServicePageSummary {
  id: number;
  slug: string;
  locale: string;
  title: string;
  summary: string | null;
  status: PageStatus;
  sort_order: number;
  published_at: string | null;
  updated_at: string;
}

export interface ServicePageDetail extends ServicePageSummary {
  body: string;
  meta_title: string | null;
  meta_description: string | null;
  updated_by_user_id: number | null;
}

export interface ServicePageList {
  items: ServicePageSummary[];
  meta: PageMeta;
  /** Slugs that exist in one locale but not the other. */
  missing_translations: string[];
}

export interface SiteString {
  id: number;
  key: string;
  locale: string;
  value: string;
  group_name: string;
  context_note: string | null;
  updated_at: string;
}

export interface SiteStringList {
  items: SiteString[];
  meta: PageMeta;
  groups: string[];
}

export async function listPages(
  params: {
    locale?: string;
    status?: PageStatus;
    search?: string;
    limit?: number;
    offset?: number;
  } = {},
): Promise<ServicePageList> {
  const query = new URLSearchParams();
  if (params.locale) query.set("locale", params.locale);
  if (params.status) query.set("status", params.status);
  if (params.search) query.set("search", params.search);
  query.set("limit", String(params.limit ?? 50));
  query.set("offset", String(params.offset ?? 0));
  return api<ServicePageList>(`/api/v1/service-pages?${query}`);
}

export async function getPage(id: number): Promise<ServicePageDetail> {
  return api<ServicePageDetail>(`/api/v1/service-pages/${id}`);
}

export async function createPage(body: unknown): Promise<ServicePageDetail> {
  return api<ServicePageDetail>("/api/v1/service-pages", { method: "POST", body });
}

export async function updatePage(id: number, body: unknown): Promise<ServicePageDetail> {
  return api<ServicePageDetail>(`/api/v1/service-pages/${id}`, { method: "PATCH", body });
}

export async function deletePage(id: number): Promise<void> {
  return api<void>(`/api/v1/service-pages/${id}`, { method: "DELETE" });
}

export async function listStrings(
  params: {
    locale?: string;
    group?: string;
    search?: string;
    untranslated?: boolean;
    limit?: number;
    offset?: number;
  } = {},
): Promise<SiteStringList> {
  const query = new URLSearchParams();
  if (params.locale) query.set("locale", params.locale);
  if (params.group) query.set("group", params.group);
  if (params.search) query.set("search", params.search);
  if (params.untranslated) query.set("untranslated", "true");
  query.set("limit", String(params.limit ?? 100));
  query.set("offset", String(params.offset ?? 0));
  return api<SiteStringList>(`/api/v1/site-strings?${query}`);
}

/** Bulk upsert — the grid saves everything it changed in one request. */
export async function saveStrings(
  rows: { key: string; locale: string; value: string; context_note?: string | null }[],
): Promise<SiteString[]> {
  return api<SiteString[]>("/api/v1/site-strings", { method: "PUT", body: rows });
}
