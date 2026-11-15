// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import "server-only";

import { api } from "@office/shared/lib/api";

/**
 * Importing a bureau's own spreadsheet of clients, translators, notaries or orders.
 *
 * Mirrors `api/v1/imports.py`. The file travels with each step: the server
 * keeps nothing between them.
 */

export type ImportKind = "clients" | "translators" | "notaries" | "orders";

/** What a batch was: one of the kinds, or a whole file of several. */
export type BatchKind = ImportKind | "combined";

export interface ImportColumn {
  index: number;
  header: string;
  /** The first few values under it, to tell which column is which. */
  sample: string[];
}

export interface ImportFieldDef {
  key: string;
  required: boolean;
}

export interface ImportAnalysis {
  file_name: string;
  total_rows: number;
  max_rows: number;
  columns: ImportColumn[];
  fields: ImportFieldDef[];
  /** field key -> column index, as guessed from the headers. */
  suggested: Record<string, number>;
}

export interface ImportRow {
  row: number;
  status: "ok" | "duplicate" | "error";
  name: string;
  messages: string[];
  warnings: string[];
  matched: string | null;
  /** What would be saved, as short text. */
  summary: string[];
}

export interface ImportPreview {
  total: number;
  will_create: number;
  duplicates: number;
  errors: number;
  with_warnings: number;
  sample: ImportRow[];
  problems: ImportRow[];
  problems_truncated: boolean;
}

export interface ImportBatch {
  id: number;
  kind: BatchKind;
  file_name: string;
  rows_total: number;
  created_count: number;
  duplicate_count: number;
  error_count: number;
  created_at: string;
  undone_at: string | null;
  /** Only the latest import that has not been undone can be. */
  can_undo: boolean;
}

/** One sheet of a combined file: what it looks like it holds, and its columns. */
export interface ImportSheet {
  index: number;
  name: string;
  /** None: the sheet is left out unless the person says what it holds. */
  kind: ImportKind | null;
  confidence: "high" | "low" | "none";
  /** Why it got that kind. */
  why: "columns" | "name" | "unsure" | "nothing" | "chosen";
  header_row: number | null;
  /** Rows under the header that hold something. */
  total_rows: number;
  /** Rows among them that are headings or totals, not records. */
  skipped_count: number;
  skipped: { row: number; reason: "heading" | "totals" }[];
  columns: ImportColumn[];
  /** field key -> column index, for `kind`. */
  mapping: Record<string, number>;
  /** The same guess for each kind, so the kind can be changed without asking again. */
  suggested: Record<ImportKind, Record<string, number>>;
}

export interface CombinedAnalysis {
  file_name: string;
  max_rows: number;
  sheets: ImportSheet[];
  fields: Record<ImportKind, ImportFieldDef[]>;
}

export interface SheetPreview {
  index: number;
  name: string;
  kind: ImportKind;
  total: number;
  will_create: number;
  duplicates: number;
  errors: number;
  with_warnings: number;
  skipped_count: number;
  sample: ImportRow[];
  problems: ImportRow[];
  problems_truncated: boolean;
}

/** What the import would add, counting the people the orders bring with them. */
export interface ImportCreates {
  clients: number;
  translators: number;
  notaries: number;
  orders: number;
}

export interface CombinedPreview {
  sheets: SheetPreview[];
  total: number;
  will_create: number;
  duplicates: number;
  errors: number;
  with_warnings: number;
  creates: ImportCreates;
}

function form(file: File, mapping?: Record<string, number>, choices?: string): FormData {
  const body = new FormData();
  body.set("file", file, file.name);
  if (mapping) body.set("mapping", JSON.stringify(mapping));
  if (choices !== undefined) body.set("choices", choices);
  return body;
}

export async function analyseCombined(file: File): Promise<CombinedAnalysis> {
  return api<CombinedAnalysis>("/api/v1/imports/combined/analyse", {
    method: "POST",
    body: form(file),
  });
}

/** `choices` is JSON: for each sheet, `{index, skip}` or `{index, kind, mapping}`. */
export async function previewCombined(file: File, choices: string): Promise<CombinedPreview> {
  return api<CombinedPreview>("/api/v1/imports/combined/preview", {
    method: "POST",
    body: form(file, undefined, choices),
  });
}

export async function commitCombined(file: File, choices: string): Promise<ImportBatch> {
  return api<ImportBatch>("/api/v1/imports/combined/commit", {
    method: "POST",
    body: form(file, undefined, choices),
  });
}

export async function analyseImport(kind: ImportKind, file: File): Promise<ImportAnalysis> {
  return api<ImportAnalysis>(`/api/v1/imports/${kind}/analyse`, {
    method: "POST",
    body: form(file),
  });
}

export async function previewImport(
  kind: ImportKind,
  file: File,
  mapping: Record<string, number>,
): Promise<ImportPreview> {
  return api<ImportPreview>(`/api/v1/imports/${kind}/preview`, {
    method: "POST",
    body: form(file, mapping),
  });
}

export async function commitImport(
  kind: ImportKind,
  file: File,
  mapping: Record<string, number>,
): Promise<ImportBatch> {
  return api<ImportBatch>(`/api/v1/imports/${kind}/commit`, {
    method: "POST",
    body: form(file, mapping),
  });
}

export async function listImports(): Promise<ImportBatch[]> {
  return api<ImportBatch[]>("/api/v1/imports");
}

export async function undoImport(id: number): Promise<ImportBatch> {
  return api<ImportBatch>(`/api/v1/imports/${id}/undo`, { method: "POST" });
}
