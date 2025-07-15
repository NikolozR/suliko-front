import { translateDocumentUserContent } from "../services/translationService";
import { DocumentTranslateUserContentParams } from "../types/types.Translation";
import { useDocumentTranslationStore } from "../store/documentTranslationStore";
import { getResult, getStatus } from "../services/jobService";
import { DocumentFormData } from "../components/DocumentTranslationCard";
import { settingUpSuggestions } from "./settingUpSuggestions";
import { useUserStore } from "@/features/auth/store/userStore";

export async function documentTranslatingWithJobId(
  data: DocumentFormData,
  setError: (error: string) => void,
  onProgress?: (progress: number, message: string) => void,
  model?: number
) {
  const { setJobId, setTranslatedMarkdown } =
    useDocumentTranslationStore.getState();
  const { currentFile } =
    useDocumentTranslationStore.getState();
  const { fetchUserProfile } = useUserStore.getState();
  
  if (!currentFile || currentFile.length === 0) {
    throw new Error("No file selected");
  }

  onProgress?.(10, "Uploading document...");
  let result;

  if (model === -1) {
    try {
      const paramsClaude: DocumentTranslateUserContentParams = {
        File: data.currentFile[0],
        TargetLanguageId: data.currentTargetLanguageId,
        SourceLanguageId: data.currentSourceLanguageId,
        OutputFormat: 0,
        model: 0, // Claude
      };
      const paramsGemini: DocumentTranslateUserContentParams = {
        ...paramsClaude,
        model: 2, // Gurami
      };

      const promiseClaude = translateDocumentUserContent(paramsClaude, data.isSrt);
      const promiseGemini = translateDocumentUserContent(paramsGemini, data.isSrt);
      console.log(promiseClaude, "promiseClaude");
      console.log(promiseGemini, "promiseGemini");
      result = await Promise.any([promiseClaude, promiseGemini]);
    } catch (error) {
      console.error("Both translation models failed:", error);
      throw new Error("Both translation models failed. Please try again.");
    }
  } else {
    const params: DocumentTranslateUserContentParams = {
      File: data.currentFile[0],
      TargetLanguageId: data.currentTargetLanguageId,
      SourceLanguageId: data.currentSourceLanguageId,
      OutputFormat: 0,
      model: model ?? 0,
    };
    result = await translateDocumentUserContent(params, data.isSrt);
  }

  const currentJobId = result.jobId;
  setJobId(currentJobId);
  let completed = false;
  if (currentJobId) {
    onProgress?.(25, "Processing document...");
    while (true) {
      const result = await getStatus(currentJobId);
      if (result.status === "Completed") {
        completed = true;
        // Revalidate user profile to update balance
        await fetchUserProfile();
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
