import { translateDocumentUserContent } from "../services/translationService";
import { DocumentTranslateUserContentParams } from "../types/types.Translation";
import { DocumentFormData } from "../components/DocumentTranslationCard";

/**
 * Starts a new translation project without waiting for completion.
 * Submits the document and returns jobId + chatId for redirect to project detail page.
 */
export async function startTranslationProject(
  data: DocumentFormData
): Promise<{ jobId: string; chatId: string }> {
  const model = 2;
  const outputLanguageId =
    typeof window !== "undefined" &&
    window.location &&
    window.location.pathname.startsWith("/en")
      ? 2
      : 1;

  const params: DocumentTranslateUserContentParams = {
    File: data.currentFile[0],
    TargetLanguageId: data.currentTargetLanguageId,
    OutputLanguageId: outputLanguageId,
    OutputFormat: 0,
    model,
  };

  const result = await translateDocumentUserContent(params, data.isSrt);

  if (!result.jobId || !result.chatId) {
    throw new Error("Failed to start translation project");
  }

  return { jobId: result.jobId, chatId: result.chatId };
}
