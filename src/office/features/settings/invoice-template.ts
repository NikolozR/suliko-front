// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import "server-only";

import { api } from "@office/shared/lib/api";

/**
 * The bureau's own invoice, a Word file with `{{placeholders}}`. Mirrors
 * `api/v1/invoice_templates.py`.
 */

export interface InvoiceTemplate {
  uploaded: boolean;
  file_name: string | null;
  size_bytes: number | null;
  updated_at: string | null;
  /** Names in the file that Office does not know: they print as nothing. */
  unknown: string[];
  /** Everything that can be written. */
  placeholders: { name: string; meaning: string }[];
}

export async function getInvoiceTemplate(): Promise<InvoiceTemplate> {
  return api<InvoiceTemplate>("/api/v1/invoice-template");
}

export async function uploadInvoiceTemplate(file: File): Promise<InvoiceTemplate> {
  const body = new FormData();
  body.set("file", file, file.name);
  return api<InvoiceTemplate>("/api/v1/invoice-template", { method: "PUT", body });
}

export async function removeInvoiceTemplate(): Promise<InvoiceTemplate> {
  return api<InvoiceTemplate>("/api/v1/invoice-template", { method: "DELETE" });
}
