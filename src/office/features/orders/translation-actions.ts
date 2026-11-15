"use server";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { getTranslations } from "next-intl/server";

import type { DocumentFile } from "@office/features/orders/files";
import {
  listTranslations,
  saveWordDocument,
  startTranslation,
  type DocumentTranslation,
} from "@office/features/orders/translations";
import { ApiError } from "@office/shared/lib/api";

/**
 * Server actions behind Suliko Translate on an order.
 *
 * Each returns a plain result rather than throwing, like the files panel's:
 * "not enough pages" is a sentence the person has to read, with the numbers
 * in it, not an error digest.
 */

type Failure = {
  ok: false;
  error: string;
  /** Set when the way forward is to buy pages on suliko.ge. */
  topUp?: boolean;
};

const isId = (value: unknown): value is number => Number.isInteger(value) && Number(value) > 0;
const isFileId = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z0-9_-]{8,100}$/.test(value);

async function explain(error: unknown): Promise<Failure> {
  const t = await getTranslations("files.translate.errors");
  if (!(error instanceof ApiError)) return { ok: false, error: t("unavailable") };

  if (error.code === "insufficient_balance") {
    const extra = (error.body ?? {}) as { pages?: unknown; balance?: unknown };
    const pages = Number(extra.pages);
    const balance = Number(extra.balance);
    return {
      ok: false,
      topUp: true,
      error:
        Number.isFinite(pages) && Number.isFinite(balance)
          ? t("insufficientBalance", { pages, balance })
          : t("insufficientBalancePlain"),
    };
  }
  if (error.code === "suliko_account_required") return { ok: false, error: t("accountRequired") };
  if (error.code === "language_not_available") {
    return { ok: false, error: t("languageNotAvailable") };
  }
  if (error.code === "unsupported_file") return { ok: false, error: t("unsupportedFile") };
  if (error.status === 413) return { ok: false, error: t("tooLarge") };
  if (error.status === 404) return { ok: false, error: t("gone") };
  if (error.status === 403) return { ok: false, error: t("noAccess") };
  if (error.status === 409 || error.status === 422) return { ok: false, error: error.detail };
  return { ok: false, error: t("unavailable") };
}

/** One click: send this source file to Suliko Translate. */
export async function startTranslationAction(
  orderId: number,
  documentId: number,
  fileId: string,
): Promise<{ ok: true; translation: DocumentTranslation } | Failure> {
  if (!isId(orderId) || !isId(documentId) || !isFileId(fileId)) return explain(null);
  try {
    return { ok: true, translation: await startTranslation(orderId, documentId, fileId) };
  } catch (error) {
    return explain(error);
  }
}

/**
 * The document's translations. Asking is what moves a running one along, so
 * the files panel calls this on a timer while one runs.
 */
export async function loadTranslationsAction(
  orderId: number,
  documentId: number,
): Promise<{ ok: true; translations: DocumentTranslation[] } | Failure> {
  if (!isId(orderId) || !isId(documentId)) return explain(null);
  try {
    return { ok: true, translations: await listTranslations(orderId, documentId) };
  } catch (error) {
    return explain(error);
  }
}

/**
 * Save the document the Word editor wrote: the form carries the order, the
 * document, the file it was opened from, and the .docx. The file that comes
 * back replaces the old one.
 */
export async function saveWordDocumentAction(
  formData: FormData,
): Promise<{ ok: true; file: DocumentFile } | Failure> {
  const orderId = Number(formData.get("order_id"));
  const documentId = Number(formData.get("document_id"));
  const fileId = formData.get("file_id");
  const file = formData.get("file");
  if (
    !isId(orderId) ||
    !isId(documentId) ||
    !isFileId(fileId) ||
    !(file instanceof Blob) ||
    file.size === 0
  ) {
    return explain(null);
  }
  try {
    return { ok: true, file: await saveWordDocument(orderId, documentId, fileId, file) };
  } catch (error) {
    return explain(error);
  }
}
