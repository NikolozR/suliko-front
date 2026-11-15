// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import "server-only";

import {
  DIRECTORY_PAGE_SIZE,
  type DirectorySort,
  type NotaryDetail,
  type NotarySummary,
  type Page,
} from "@office/features/directory/types";
import { api } from "@office/shared/lib/api";

export interface NotaryListParams {
  search?: string;
  sort?: DirectorySort;
  limit?: number;
  offset?: number;
}

export async function listNotaries(
  params: NotaryListParams = {},
): Promise<Page<NotarySummary>> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  // Notaries default to alphabetical: it is a short list people scan by name,
  // unlike clients and translators where newest-first is more useful.
  query.set("sort", params.sort ?? "name");
  query.set("limit", String(params.limit ?? DIRECTORY_PAGE_SIZE));
  query.set("offset", String(params.offset ?? 0));

  return api<Page<NotarySummary>>(`/api/v1/notaries?${query}`);
}

export async function getNotary(id: number): Promise<NotaryDetail> {
  return api<NotaryDetail>(`/api/v1/notaries/${id}`);
}

export async function createNotary(body: unknown): Promise<NotaryDetail> {
  return api<NotaryDetail>("/api/v1/notaries", { method: "POST", body });
}

export async function updateNotary(id: number, body: unknown): Promise<NotaryDetail> {
  return api<NotaryDetail>(`/api/v1/notaries/${id}`, { method: "PATCH", body });
}

export async function deleteNotary(id: number): Promise<void> {
  await api<void>(`/api/v1/notaries/${id}`, { method: "DELETE" });
}
