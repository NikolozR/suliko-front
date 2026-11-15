"use server";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { getTranslations } from "next-intl/server";

import {
  deleteDocumentFile,
  linkDocumentFiles,
  listDocumentFiles,
  updateDocumentFile,
  uploadDocumentFile,
  type DocumentFile,
  type FileKind,
} from "@office/features/orders/files";
import { listTranslations, type DocumentTranslation } from "@office/features/orders/translations";
import { ApiError } from "@office/shared/lib/api";

/**
 * Server actions behind the document files panel.
 *
 * Called from a client component, so each one returns a plain result object
 * rather than throwing: a thrown error in a server action reaches the browser
 * as an opaque digest, and "file storage is not available" is exactly the
 * message the person looking at the panel needs to read.
 */

export type FilesResult = { ok: true; files: DocumentFile[] } | { ok: false; error: string };

async function explain(error: unknown): Promise<{ error: string }> {
  const t = await getTranslations("files.errors");
  if (error instanceof ApiError) {
    // The API's wording for this one is already written for a person.
    if (error.status === 503) return { error: error.detail };
    if (error.status === 403) return { error: t("noAccess") };
    if (error.status === 404) return { error: t("gone") };
    return { error: error.detail };
  }
  return { error: t("unreachable") };
}

async function message(key: "invalidDocument" | "invalidFile" | "chooseFile" | "tooLarge") {
  return (await getTranslations("files.errors"))(key);
}

function ids(orderId: unknown, documentId: unknown): [number, number] | null {
  const o = Number(orderId);
  const d = Number(documentId);
  return Number.isInteger(o) && Number.isInteger(d) ? [o, d] : null;
}

/** The files of one document. */
export async function loadDocumentFiles(
  orderId: number,
  documentId: number,
): Promise<FilesResult> {
  const parsed = ids(orderId, documentId);
  if (!parsed) return { ok: false, error: await message("invalidDocument") };

  try {
    return { ok: true, files: await listDocumentFiles(...parsed) };
  } catch (error) {
    return { ok: false, ...(await explain(error)) };
  }
}

/** One document's files and its Suliko Translate jobs, as the order's files panel holds them. */
export interface DocumentFilesState {
  id: number;
  files: DocumentFile[];
  translations: DocumentTranslation[];
}

/**
 * Every document's files, in one round trip.
 *
 * The panel shows the whole order at once. Asked for one document at a time
 * from the browser, a ten-document order was twenty server actions, and those
 * run one after another. Here they are read side by side on the server.
 *
 * The translations are asked for first: asking is what brings a finished
 * one's file over, so the file list read after it already has it. A document
 * whose translations cannot be read still shows its files.
 */
export async function loadOrderFilesAction(
  orderId: number,
  documentIds: number[],
): Promise<{ ok: true; documents: DocumentFilesState[] } | { ok: false; error: string }> {
  const valid =
    Number.isInteger(orderId) &&
    Array.isArray(documentIds) &&
    documentIds.length <= 200 &&
    documentIds.every((id) => Number.isInteger(id));
  if (!valid) return { ok: false, error: await message("invalidDocument") };

  try {
    const documents = await Promise.all(
      documentIds.map(async (id) => {
        const translations = await listTranslations(orderId, id).catch(() => []);
        return { id, files: await listDocumentFiles(orderId, id), translations };
      }),
    );
    return { ok: true, documents };
  } catch (error) {
    return { ok: false, ...(await explain(error)) };
  }
}

/** Move a file to the other side (Source, Translation), or rename it. */
export async function updateDocumentFileAction(
  orderId: number,
  documentId: number,
  fileId: string,
  change: { kind?: FileKind; name?: string },
): Promise<{ ok: true; file: DocumentFile } | { ok: false; error: string }> {
  const parsed = ids(orderId, documentId);
  if (!parsed || !/^[A-Za-z0-9_-]{8,100}$/.test(fileId)) {
    return { ok: false, error: await message("invalidFile") };
  }
  const kind = change?.kind === "source" || change?.kind === "translation" ? change.kind : undefined;
  const name = typeof change?.name === "string" ? change.name.trim().slice(0, 255) : undefined;
  if (!kind && !name) return { ok: false, error: await message("invalidFile") };

  try {
    return { ok: true, file: await updateDocumentFile(...parsed, fileId, { kind, name }) };
  } catch (error) {
    // 409: kept in the Order Vault. The API says so in words.
    if (error instanceof ApiError && error.status === 409) return { ok: false, error: error.detail };
    return { ok: false, ...(await explain(error)) };
  }
}

export async function uploadDocumentFileAction(
  formData: FormData,
): Promise<{ ok: true; file: DocumentFile } | { ok: false; error: string }> {
  const parsed = ids(formData.get("order_id"), formData.get("document_id"));
  if (!parsed) return { ok: false, error: await message("invalidDocument") };

  const kind = formData.get("kind") === "translation" ? "translation" : "source";
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: await message("chooseFile") };
  }

  try {
    const uploaded = await uploadDocumentFile(...parsed, kind as FileKind, file);
    return { ok: true, file: uploaded };
  } catch (error) {
    if (error instanceof ApiError && error.status === 413) {
      return { ok: false, error: await message("tooLarge") };
    }
    return { ok: false, ...(await explain(error)) };
  }
}

/** Link files to the documents they belong to: the dialog's Link button. */
export async function linkFilesAction(
  orderId: number,
  links: { fileId: string; documentId: number }[],
): Promise<{ ok: true; moved: number } | { ok: false; error: string }> {
  const valid =
    Number.isInteger(orderId) &&
    Array.isArray(links) &&
    links.length > 0 &&
    links.length <= 200 &&
    links.every(
      (link) =>
        typeof link?.fileId === "string" &&
        /^[A-Za-z0-9_-]{8,100}$/.test(link.fileId) &&
        Number.isInteger(link.documentId),
    );
  if (!valid) return { ok: false, error: await message("invalidFile") };

  try {
    const moved = await linkDocumentFiles(orderId, links);
    return { ok: true, moved: moved.length };
  } catch (error) {
    if (error instanceof ApiError) {
      // 409: a translation is running on one of them; the API says which.
      if (error.status === 409) return { ok: false, error: error.detail };
      if (error.status === 404) {
        return { ok: false, error: (await getTranslations("files.errors"))("linkGone") };
      }
    }
    return { ok: false, ...(await explain(error)) };
  }
}

export async function deleteDocumentFileAction(
  orderId: number,
  documentId: number,
  fileId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = ids(orderId, documentId);
  if (!parsed || !/^[A-Za-z0-9_-]{8,100}$/.test(fileId)) {
    return { ok: false, error: await message("invalidFile") };
  }

  try {
    await deleteDocumentFile(...parsed, fileId);
    return { ok: true };
  } catch (error) {
    return { ok: false, ...(await explain(error)) };
  }
}
