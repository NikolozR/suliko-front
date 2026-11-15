"use server";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { getTranslations } from "next-intl/server";

import { listDocumentFiles, type DocumentFile } from "@office/features/orders/files";
import {
  getMailOptions,
  sendOrderFiles,
  type MailLanguage,
  type MailOptions,
  type SendFilesResult,
} from "@office/features/orders/mail";
import { ApiError } from "@office/shared/lib/api";

/**
 * Server actions behind the "Send by email" dialog.
 *
 * Like the files panel's, each returns a plain result rather than throwing:
 * the person looking at the dialog needs the reason in words.
 */

export type SendFormResult =
  | { ok: true; options: MailOptions; documents: { id: number; files: DocumentFile[] }[] }
  | { ok: false; error: string };

type ErrorKey =
  | "tooLarge"
  | "rateLimited"
  | "notConfigured"
  | "deliveryFailed"
  | "gone"
  | "noAccess"
  | "unreachable";

async function explain(error: unknown): Promise<string> {
  const t = await getTranslations("files.send.errors");
  const say = (key: ErrorKey) => t(key);
  if (!(error instanceof ApiError)) return say("unreachable");
  if (error.code === "mail_not_configured") return say("notConfigured");
  if (error.code === "mail_delivery_failed") return say("deliveryFailed");
  if (error.status === 413) return say("tooLarge");
  if (error.status === 429) return say("rateLimited");
  if (error.status === 404) return say("gone");
  if (error.status === 403) return say("noAccess");
  // What is left is the API explaining a choice the form should not have
  // offered (a translator who is not on the order). Its own words are the
  // most exact thing there is to show.
  return error.detail;
}

const isId = (value: unknown): value is number => Number.isInteger(value) && Number(value) > 0;

/** Who can be written to, how the message would leave, and the order's files. */
export async function loadSendFormAction(
  orderId: number,
  documentIds: number[],
): Promise<SendFormResult> {
  if (!isId(orderId) || documentIds.length > 200 || !documentIds.every(isId)) {
    return { ok: false, error: await explain(null) };
  }
  try {
    const [options, ...lists] = await Promise.all([
      getMailOptions(orderId),
      ...documentIds.map((id) => listDocumentFiles(orderId, id)),
    ]);
    return {
      ok: true,
      options,
      documents: documentIds.map((id, index) => ({ id, files: lists[index] })),
    };
  } catch (error) {
    return { ok: false, error: await explain(error) };
  }
}

export async function sendFilesAction(input: {
  orderId: number;
  to: "client" | "translator";
  translatorId?: number;
  fileIds: string[];
  message: string;
  language: MailLanguage;
}): Promise<({ ok: true } & SendFilesResult) | { ok: false; error: string }> {
  const fileIds = [...new Set(input.fileIds)];
  const valid =
    isId(input.orderId) &&
    (input.to === "client" || (input.to === "translator" && isId(input.translatorId))) &&
    fileIds.length > 0 &&
    fileIds.length <= 20 &&
    fileIds.every((id) => /^[A-Za-z0-9_-]{8,100}$/.test(id)) &&
    (input.language === "ka" || input.language === "en");
  if (!valid) return { ok: false, error: await explain(null) };

  try {
    const sent = await sendOrderFiles(input.orderId, {
      to: input.to,
      translator_id: input.to === "translator" ? input.translatorId : undefined,
      file_ids: fileIds,
      message: input.message.trim().slice(0, 2000) || undefined,
      language: input.language,
    });
    return { ok: true, ...sent };
  } catch (error) {
    return { ok: false, error: await explain(error) };
  }
}
