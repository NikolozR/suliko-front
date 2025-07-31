import { translateDocumentUserContent } from "../services/translationService";
import { DocumentTranslateUserContentParams } from "../types/types.Translation";
import { useDocumentTranslationStore } from "../store/documentTranslationStore";
import { getResult, getStatus } from "../services/jobService";
import { DocumentFormData } from "../components/DocumentTranslationCard";
import { useUserStore } from "@/features/auth/store/userStore";

export async function documentTranslatingWithJobId(
  data: DocumentFormData,
  setError: (error: string) => void,
  onProgress?: (progress: number, message: string) => void,
  model?: number,
  setSuggestionsLoading?: (loading: boolean) => void
) {
  const { setJobId, setTranslatedMarkdown } =
    useDocumentTranslationStore.getState();
  const { currentFile } =
    useDocumentTranslationStore.getState();
  const { fetchUserProfile } = useUserStore.getState();
  const { setIsTranslating } = useDocumentTranslationStore.getState();
  
  setIsTranslating(true);
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
        model: 0,
      };
      const paramsGemini: DocumentTranslateUserContentParams = {
        ...paramsClaude,
        model: 2,
      };

      const promiseGemini = translateDocumentUserContent(paramsGemini, data.isSrt);
      result = await promiseGemini;
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
  if (currentJobId) {
    onProgress?.(25, "Processing document...");
    while (true) {
      const result = await getStatus(currentJobId);
      if (result.status === "Completed") {
        fetchUserProfile();
        onProgress?.(60, "Translation completed!");
        break;
      } else if (result.status === "Failed") {
        if (result.message && result.message.includes("არასაკმარისი")) {
          setError("Insufficient balance. Please top up your account to continue translation.");
        } else {
          const errorMessage = result.message || "Translation failed. Please try again.";
          setError(`Translation failed: ${errorMessage}`);
        }
        fetchUserProfile();
        setIsTranslating(false);
        return;
      }
      onProgress?.(40, "Translating content...");
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    onProgress?.(70, "Retrieving results...");
    const resultBlob = (await getResult(currentJobId)) as Blob;
    const text = await resultBlob.text();
    setTranslatedMarkdown(text);
    setIsTranslating(false);
    
    if (setSuggestionsLoading) {
      setSuggestionsLoading(true);
      const { settingUpSuggestions } = await import("./settingUpSuggestions");
      settingUpSuggestions(currentJobId)
        .then((result) => {
          console.log('Suggestions setup result:', result);
        })
        .catch((error) => {
          console.error('Error setting up suggestions:', error);
        })
        .finally(() => {
          setSuggestionsLoading(false);
        });
    }
  } else {
    setError("Failed to get translation result");
    setIsTranslating(false);
  }
}
