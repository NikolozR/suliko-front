import { translateDocumentUserContent } from "../services/translationService";
import { DocumentTranslateUserContentParams } from "../types/types.Translation";
import { useDocumentTranslationStore } from "../store/documentTranslationStore";
import { getResult, getStatus } from "../services/jobService";
import { DocumentFormData } from "../components/DocumentTranslationCard";
import { settingUpSuggestions } from "./settingUpSuggestions";

export async function documentTranslatingWithJobId(
  data: DocumentFormData,
  setError: (error: string) => void,
  onProgress?: (progress: number, message: string) => void
) {
  const { setJobId, setTranslatedMarkdown } =
    useDocumentTranslationStore.getState();
  const { currentFile } =
    useDocumentTranslationStore.getState();
  if (!currentFile || currentFile.length === 0) {
    throw new Error("No file selected");
  }
  const params: DocumentTranslateUserContentParams = {
    File: data.currentFile[0],
    TargetLanguageId: data.currentTargetLanguageId,
    SourceLanguageId: data.currentSourceLanguageId,
    OutputFormat: 0,
  };
  onProgress?.(10, "Uploading document...");
  const result = await translateDocumentUserContent(params, data.isSrt);
  const currentJobId = result.jobId;
  setJobId(currentJobId);
  let completed = false;
  if (currentJobId) {
    onProgress?.(25, "Processing document...");
    while (true) {
      const result = await getStatus(currentJobId);
      if (result.status === "Completed") {
        completed = true;
        onProgress?.(60, "Translation completed!");
        break;
      } else if (result.status === "Failed") {
        break;
      }
      onProgress?.(40, "Translating content...");
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    onProgress?.(70, "Setting up suggestions...");
    let suggestionsStatus = await settingUpSuggestions(currentJobId);
    if (completed) {
      if (suggestionsStatus !== 'success') {
        while (true) {
            onProgress?.(80, "Finalizing suggestions...");
            suggestionsStatus = await settingUpSuggestions(currentJobId);
            if (suggestionsStatus === 'success') {
                break;
            }
            await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
      onProgress?.(90, "Retrieving results...");
      const result = (await getResult(currentJobId)) as Blob;
      const text = await result.text();
      onProgress?.(97, "Finalizing...");
      setTranslatedMarkdown(text);
    } else {
      setError("Failed to get translation result");
    }
  }
}
