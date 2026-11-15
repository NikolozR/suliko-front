// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import "server-only";

import { api } from "@office/shared/lib/api";

/**
 * A document's files, mirroring `api/v1/order_files.py`.
 *
 * Every document has Source and Translation files. Suliko stores them itself,
 * so there is nothing for an organisation to connect first: the first upload
 * just works.
 */

export type FileKind = "source" | "translation";

export interface DocumentFile {
  id: string;
  name: string;
  kind: FileKind;
  content_type: string;
  size_bytes: number | null;
  /** `user:<id>` for a Suliko Office upload, `portal:<id>` for a translator's. */
  uploaded_by: string | null;
  created_at: string | null;
  /** Archived in the Order Vault (encrypted; opened in the vault's own panel). */
  in_vault?: boolean;
  /** The vault's own order number for that file, to find it by. */
  vault_order?: number | null;
  /**
   * False once only the vault has the file: its download copy is removed when
   * the order closes. Absent on an API that predates the vault, meaning true.
   */
  downloadable?: boolean;
  /**
   * Whether the translation page can open it for correcting: a translation
   * Suliko Translate made. Absent on an API that predates Word translations.
   */
  editable?: boolean;
}

const base = (orderId: number, documentId: number) =>
  `/api/v1/orders/${orderId}/documents/${documentId}`;

export async function listDocumentFiles(
  orderId: number,
  documentId: number,
): Promise<DocumentFile[]> {
  return api<DocumentFile[]>(`${base(orderId, documentId)}/files`);
}

export async function uploadDocumentFile(
  orderId: number,
  documentId: number,
  kind: FileKind,
  file: File,
): Promise<DocumentFile> {
  const body = new FormData();
  body.set("file", file, file.name);
  return api<DocumentFile>(`${base(orderId, documentId)}/files?kind=${kind}`, {
    method: "POST",
    body,
  });
}

/** Move a file to the other side, or rename it. The bytes stay where they are. */
export async function updateDocumentFile(
  orderId: number,
  documentId: number,
  fileId: string,
  change: { kind?: FileKind; name?: string },
): Promise<DocumentFile> {
  return api<DocumentFile>(`${base(orderId, documentId)}/files/${encodeURIComponent(fileId)}`, {
    method: "PATCH",
    body: change,
  });
}

/**
 * Say which document of the order each file belongs to. All or nothing: the
 * answer lists the files that actually moved, which leaves out any that were
 * already where they were asked to go.
 */
export async function linkDocumentFiles(
  orderId: number,
  links: { fileId: string; documentId: number }[],
): Promise<{ id: string; document_id: number }[]> {
  return api<{ id: string; document_id: number }[]>(`/api/v1/orders/${orderId}/files/link`, {
    method: "POST",
    body: { links: links.map((link) => ({ file_id: link.fileId, document_id: link.documentId })) },
  });
}

export async function deleteDocumentFile(
  orderId: number,
  documentId: number,
  fileId: string,
): Promise<void> {
  await api<void>(`${base(orderId, documentId)}/files/${encodeURIComponent(fileId)}`, {
    method: "DELETE",
  });
}
