// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import "server-only";

import { notFound } from "next/navigation";

import { openInEditor } from "@office/features/orders/translations";
import { ApiError } from "@office/shared/lib/api";

/**
 * A translation in the form the Word editor opens, for the two pages that
 * show it. What cannot be shown is told apart, so each page can say what to do:
 * the editor's server (suliko.ge's backend) could not be reached, or it could
 * not read this document. A file that is not there, or not one the editor
 * opens, is a 404.
 */
export async function loadEditorDocument(
  orderId: number,
  documentId: number,
  fileId: string,
): Promise<{ sfdt: string } | { failure: "unavailable" | "unreadable" }> {
  try {
    return { sfdt: (await openInEditor(orderId, documentId, fileId)).sfdt };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) notFound();
      if (error.status === 422 || error.code === "editor_document_unreadable") {
        return { failure: "unreadable" };
      }
      if (error.status === 503 || error.status === 502) return { failure: "unavailable" };
      // 413: too large for the editor. Said the same way as one it cannot read.
      if (error.status === 413) return { failure: "unreadable" };
    }
    throw error;
  }
}
