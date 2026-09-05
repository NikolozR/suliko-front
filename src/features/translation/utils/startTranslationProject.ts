import { translateDocumentUserContent, translateDocumentWithUri } from "../services/translationService";
import { DocumentTranslateUserContentParams, NameTranslationItem, DEFAULT_DOCUMENT_OUTPUT_FORMAT } from "../types/types.Translation";
import { DocumentFormData } from "../components/DocumentTranslationCard";
import { prepareDocumentUpload } from "../services/prepareUploadService";
import type { PrepareUploadResponse } from "../types/types.Translation";

/**
 * Starts a new translation project without waiting for completion.
 * Submits the document and returns jobId + chatId for redirect to translation detail page.
 * `confirmedNames` (non-SRT only) are user-approved name renderings injected into the prompt.
 */
export interface StartTranslationHooks {
  /** Fraction of bytes sent, 0..1. Only fires if this call does the upload. */
  onUploadProgress?: (fraction: number) => void;
  /** Fires once the file is prepared and the translation request goes out. */
  onStarting?: () => void;
  /**
   * A file already handed to /Document/prepare-upload. The document screen
   * prepares on file selection so it can quote a real page count before the
   * user commits, and passes the result through here rather than uploading a
   * second time. Callers without one make the server prepare it now.
   */
  prepared?: PrepareUploadResponse | null;
}

export async function startTranslationProject(
  data: DocumentFormData,
  pageCount?: number,
  confirmedNames?: NameTranslationItem[],
  outputFormat: number = DEFAULT_DOCUMENT_OUTPUT_FORMAT,
  hooks: StartTranslationHooks = {}
): Promise<{ jobId: string; chatId: string }> {
  const model = 2;
  const outputLanguageId =
    typeof window !== "undefined" &&
    window.location &&
    window.location.pathname.startsWith("/en")
      ? 2
      : 1;

  let result;

  if (data.isSrt) {
    const params: DocumentTranslateUserContentParams = {
      File: data.currentFile[0],
      TargetLanguageId: data.currentTargetLanguageId,
      OutputLanguageId: outputLanguageId,
      OutputFormat: 0,
      model,
    };
    result = await translateDocumentUserContent(params, true);
  } else {
    const prepared =
      hooks.prepared ??
      (await prepareDocumentUpload(data.currentFile[0], {
        onProgress: hooks.onUploadProgress,
      }));
    const { fileUri, mimeType } = prepared;
    hooks.onStarting?.();
    result = await translateDocumentWithUri({
      fileUri,
      mimeType,
      fileName: data.currentFile[0].name,
      TargetLanguageId: data.currentTargetLanguageId,
      OutputLanguageId: outputLanguageId,
      OutputFormat: outputFormat,
      model,
      // Advisory only: translate-with-uri bills from the count prepare-upload
      // measured server-side and ignores this. Sent so older backends still work.
      pageCount: prepared.pageCount ?? pageCount ?? 1,
      nameTranslations: confirmedNames && confirmedNames.length > 0 ? confirmedNames : undefined,
    });
  }

  if (!result.jobId || !result.chatId) {
    throw new Error("Failed to start translation project");
  }

  return { jobId: result.jobId, chatId: result.chatId };
}
