// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import "server-only";

import { cache } from "react";

import type { ClientFormValues } from "@office/features/clients/schema";
import { api } from "@office/shared/lib/api";

/**
 * Clients API.
 *
 * Mirrors `api/v1/clients.py`. Field names are snake_case because that is what
 * the API sends; they are converted to camelCase at the component boundary
 * rather than here, so a response shape that drifts fails loudly at the fetch
 * instead of silently producing `undefined` three layers down.
 */

export type ClientType = "B2B" | "B2C";

export interface ClientSummary {
  id: number;
  /** The bureau's own number, 1, 2, 3: what people see. `id` is for links. */
  number: number;
  name: string;
  client_type: ClientType;
  email: string | null;
  phone: string | null;
  /** Only the last four digits — the full value needs the detail endpoint. */
  personal_number_masked: string | null;
}

export interface ClientDetail extends ClientSummary {
  address: string | null;
  acquisition_source: string | null;
  notes: string | null;
}

export interface PageMeta {
  total: number;
  limit: number;
  offset: number;
}

export interface ClientPage {
  items: ClientSummary[];
  meta: PageMeta;
}

export interface ClientListParams {
  search?: string;
  clientType?: ClientType;
  sort?: "name" | "-name" | "id" | "-id";
  limit?: number;
  offset?: number;
}

export const CLIENTS_PAGE_SIZE = 20;

export async function listClients(params: ClientListParams = {}): Promise<ClientPage> {
  const query = new URLSearchParams();

  // Only send parameters that are actually set. An empty `search=` would be
  // matched as a literal empty string by the API's ILIKE filter.
  if (params.search) query.set("search", params.search);
  if (params.clientType) query.set("client_type", params.clientType);
  query.set("sort", params.sort ?? "-id");
  query.set("limit", String(params.limit ?? CLIENTS_PAGE_SIZE));
  query.set("offset", String(params.offset ?? 0));

  return api<ClientPage>(`/api/v1/clients?${query}`);
}

/**
 * One request per page view: the page and its tab title (`pageTitle`) both
 * ask, and React's cache answers the second from the first.
 */
export const getClient = cache(async (id: number): Promise<ClientDetail> => {
  return api<ClientDetail>(`/api/v1/clients/${id}`);
});

export async function createClient(values: ClientFormValues): Promise<ClientDetail> {
  return api<ClientDetail>("/api/v1/clients", { method: "POST", body: values });
}

/**
 * PATCH, so only the fields that actually changed are sent.
 *
 * Sending the whole object would work, but it would also overwrite a field
 * another user edited between this page loading and the form being saved.
 */
export async function updateClient(
  id: number,
  changes: Partial<ClientFormValues>,
): Promise<ClientDetail> {
  return api<ClientDetail>(`/api/v1/clients/${id}`, { method: "PATCH", body: changes });
}

export async function deleteClient(id: number): Promise<void> {
  await api<void>(`/api/v1/clients/${id}`, { method: "DELETE" });
}

export interface PossibleDuplicate {
  id: number;
  number: number;
  name: string;
  client_type: ClientType;
  /** Which submitted details matched: "phone", "email", "personal_number". */
  matched_on: string[];
}

/** Existing clients sharing a phone, email or ID number — a warning, not a refusal. */
export async function findDuplicates(params: {
  phone?: string;
  email?: string;
  personalNumber?: string;
  excludeId?: number;
}): Promise<PossibleDuplicate[]> {
  const query = new URLSearchParams();
  if (params.phone) query.set("phone", params.phone);
  if (params.email) query.set("email", params.email);
  if (params.personalNumber) query.set("personal_number", params.personalNumber);
  if (params.excludeId) query.set("exclude_id", String(params.excludeId));
  if ([...query.keys()].length === 0) return [];
  return api<PossibleDuplicate[]>(`/api/v1/clients/duplicates?${query}`);
}
