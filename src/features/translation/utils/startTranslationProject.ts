import { translateDocumentUserContent, translateDocumentWithUri } from "../services/translationService";
import { DocumentTranslateUserContentParams, NameTranslationItem } from "../types/types.Translation";
import { DocumentFormData } from "../components/DocumentTranslationCard";
import { uploadFileToGemini } from "../services/geminiUploadService";

/**
 * Starts a new translation project without waiting for completion.
 * Submits the document and returns jobId + chatId for redirect to translation detail page.
 * `confirmedNames` (non-SRT only) are user-approved name renderings injected into the prompt.
 */
export async function startTranslationProject(
  data: DocumentFormData,
  pageCount?: number,
  confirmedNames?: NameTranslationItem[]
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
    const { fileUri, mimeType } = await uploadFileToGemini(data.currentFile[0]);
    result = await translateDocumentWithUri({
      fileUri,
      mimeType,
      fileName: data.currentFile[0].name,
      TargetLanguageId: data.currentTargetLanguageId,
      OutputLanguageId: outputLanguageId,
      OutputFormat: 0,
      model,
      pageCount: pageCount ?? 1,
      nameTranslations: confirmedNames && confirmedNames.length > 0 ? confirmedNames : undefined,
    });
  }

  if (!result.jobId || !result.chatId) {
    throw new Error("Failed to start translation project");
  }

  return { jobId: result.jobId, chatId: result.chatId };
}
