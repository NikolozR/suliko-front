// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import "server-only";

import { api } from "@office/shared/lib/api";

/**
 * Emailing an order's files, mirroring `api/v1/order_mail.py`.
 *
 * The address is never sent from here: the API writes only to the client on
 * the order, or to a translator assigned to one of its documents, at the
 * address it has on record.
 */

/** "smtp" is the organisation's own mail server, "platform" is Suliko's. */
export type MailVia = "smtp" | "platform";
export type MailLanguage = "ka" | "en";

export interface MailRecipient {
  name: string;
  /** Null when there is no address on record: nothing can be sent yet. */
  email: string | null;
}

export interface TranslatorRecipient extends MailRecipient {
  id: number;
  /** Only files of these documents may be sent to this translator. */
  document_ids: number[];
}

export interface MailOptions {
  client: MailRecipient;
  /** Empty without `translators.read`, and on an order nobody is assigned to. */
  translators: TranslatorRecipient[];
  /** Null: no mail server is available, sending is off. */
  via: MailVia | null;
  from_email: string | null;
  reply_to: string | null;
  /** The most the attached files may weigh together. */
  max_bytes: number;
}

export interface SendFilesBody {
  to: "client" | "translator";
  translator_id?: number;
  file_ids: string[];
  message?: string;
  language?: MailLanguage;
}

export interface SendFilesResult {
  recipient: string;
  files: number;
  via: MailVia;
}

export async function getMailOptions(orderId: number): Promise<MailOptions> {
  return api<MailOptions>(`/api/v1/orders/${orderId}/mail-options`);
}

export async function sendOrderFiles(
  orderId: number,
  body: SendFilesBody,
): Promise<SendFilesResult> {
  return api<SendFilesResult>(`/api/v1/orders/${orderId}/send-files`, { method: "POST", body });
}
