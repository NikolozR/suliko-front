// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import "server-only";

import type { DocumentFile } from "@office/features/orders/files";
import { api } from "@office/shared/lib/api";

/**
 * Suliko Translate from an order, mirroring `api/v1/order_translations.py`.
 *
 * A source file goes to suliko.ge's translator in the name of the person who
 * asked, whose own page balance pays. The API has no worker: asking for the
 * list is what moves a running job along and, once it is done, files the
 * result, a Word document, under the document's Translation files.
 */

export type TranslationStatus = "processing" | "completed" | "failed";

export interface DocumentTranslation {
  id: string;
  document_id: number | null;
  status: TranslationStatus;
  /** Null once that file has been removed. */
  source_file_id: string | null;
  result_file_id: string | null;
  target_language: string;
  /** What suliko.ge measured and charged. */
  page_count: number;
  /** 0 to 100 while it runs. */
  progress: number | null;
  error: string | null;
  created_at: string | null;
  finished_at: string | null;
  /** On starting one only: what is left of the person's balance. */
  balance: string | null;
}

const base = (orderId: number, documentId: number) =>
  `/api/v1/orders/${orderId}/documents/${documentId}`;

export async function startTranslation(
  orderId: number,
  documentId: number,
  fileId: string,
): Promise<DocumentTranslation> {
  return api<DocumentTranslation>(
    `${base(orderId, documentId)}/files/${encodeURIComponent(fileId)}/translate`,
    { method: "POST", body: { rich: false } },
  );
}

export async function listTranslations(
  orderId: number,
  documentId: number,
): Promise<DocumentTranslation[]> {
  return api<DocumentTranslation[]>(`${base(orderId, documentId)}/translations`);
}

export interface EditorDocument {
  /** The document in the Word editor's own format: its JSON text. */
  sfdt: string;
  file_name: string;
}

/**
 * A translation, in the form the Word editor opens. The API has suliko.ge's
 * backend turn the stored Word (or HTML) file into it, so this can be refused
 * when that is not reachable (503) or cannot read the file (422).
 */
export async function openInEditor(
  orderId: number,
  documentId: number,
  fileId: string,
): Promise<EditorDocument> {
  return api<EditorDocument>(
    `${base(orderId, documentId)}/files/${encodeURIComponent(fileId)}/editor`,
  );
}

/**
 * Save the Word document the editor wrote. Answers with the file that
 * replaces the old one, which is retired.
 */
export async function saveWordDocument(
  orderId: number,
  documentId: number,
  fileId: string,
  file: Blob,
): Promise<DocumentFile> {
  const body = new FormData();
  body.set("file", file, "translation.docx");
  return api<DocumentFile>(`${base(orderId, documentId)}/files/${encodeURIComponent(fileId)}/docx`, {
    method: "PUT",
    body,
  });
}
