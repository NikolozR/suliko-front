import { getChatById, updateChatDocumentContent } from "@/features/chatHistory/services/chatService";
import { translationAsHtml } from "@/features/translation/utils/wordPage";

/**
 * A translation's wording alone: no tags, no spacing. Two versions that read
 * the same compare equal, whatever each is written in (the history keeps what
 * the translation service sent until the first edit, the order's file the
 * editor's HTML).
 */
function wordingOf(content: string): string {
  const page = new DOMParser().parseFromString(translationAsHtml(content), "text/html");
  // Their text is not the translation's.
  page.querySelectorAll("style, script, template").forEach((element) => element.remove());
  return (page.body.textContent ?? "").replace(/\s+/g, "");
}

/**
 * - "updated": the history now reads as the corrected file does.
 * - "differs": the history was changed after the file was sent, and was left alone.
 * - "failed": it could not be read or written just now.
 */
export type HistoryCorrection = "updated" | "differs" | "failed";

/**
 * A correction made to the order's file, made to the translation in the
 * history it was sent from, so that the two do not part: opening the
 * translation again, or sending it again, starts from the corrected text.
 *
 * Only where the history still reads as the file did when it was opened. If it
 * was changed there since (edits never sent to the order), those changes are
 * not in the corrected file, and writing over them would lose them.
 */
export async function correctHistory(
  chatId: string,
  /** The order's file as it was opened for correcting. */
  opened: string,
  corrected: string,
): Promise<HistoryCorrection> {
  try {
    const chat = await getChatById(chatId);
    const inHistory = wordingOf(chat.data.translationResult?.translatedContent ?? "");
    // Reads as corrected already: nothing to write.
    if (inHistory === wordingOf(corrected)) return "updated";
    if (inHistory !== wordingOf(opened)) return "differs";
    await updateChatDocumentContent(chatId, corrected);
    return "updated";
  } catch {
    return "failed";
  }
}
