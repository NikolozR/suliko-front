import { translateDocumentUserContent } from "../services/translationService";
import { DocumentTranslateUserContentParams } from "../types/types.Translation";
import { useDocumentTranslationStore } from "../store/documentTranslationStore";
import { getResult, getStatus } from "../services/jobService";
import { DocumentFormData } from "../components/DocumentTranslationCard";
import { settingUpSuggestions } from "./settingUpSuggestions";

export async function documentTranslatingWithJobId(
  data: DocumentFormData,
  setError: (error: string) => void
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
  const result = await translateDocumentUserContent(params);
  const currentJobId = result.jobId;
  setJobId(currentJobId);
  let completed = false;
  if (currentJobId) {
    while (true) {
      const result = await getStatus(currentJobId);
      if (result.status === "Completed") {
        completed = true;
        break;
      } else if (result.status === "Failed") {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    let suggestionsStatus = await settingUpSuggestions(currentJobId);
    if (completed) {
      if (suggestionsStatus !== 'success') {
        while (true) {
            suggestionsStatus = await settingUpSuggestions(currentJobId);
            if (suggestionsStatus === 'success') {
                break;
            }
            await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
      const result = (await getResult(currentJobId)) as Blob;
      const text = await result.text();
      setTranslatedMarkdown(text);
    } else {
      setError("Failed to get translation result");
    }
  }
}
