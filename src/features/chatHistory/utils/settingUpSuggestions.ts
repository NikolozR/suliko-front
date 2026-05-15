import { getSuggestions } from "@/features/translation/services/suggestionsService";
import { useChatSuggestionsStore } from "@/features/chatHistory/store/chatSuggestionsStore";
import { SuggestionsResponse, SuggestionsResponseProcessing } from "@/features/translation/types/types.Translation";

function isSuggestionsResponse(
  obj: SuggestionsResponse | SuggestionsResponseProcessing
): obj is SuggestionsResponse {
  return (
    obj &&
    typeof obj === "object" &&
    "jobId" in obj &&
    "suggestionCount" in obj &&
    "suggestions" in obj
  );
}

export async function settingUpChatSuggestions(jobId: string, options?: { waitForNew?: boolean }): Promise<string> {
  const { setSuggestions } = useChatSuggestionsStore.getState();
  const maxAttempts = 40;
  const delayMs = 3000;
  let attempt = 0;

  while (attempt < maxAttempts) {
    try {
      const suggestionsResponse = await getSuggestions(jobId);
      if (isSuggestionsResponse(suggestionsResponse)) {
        const filtered = suggestionsResponse.suggestions.filter(
          (s) =>
            s.description !== null ||
            s.originalText !== null ||
            s.suggestedText !== null
        );
        if (filtered.length > 0) {
          setSuggestions(filtered);
          return "success";
        }
        if (!options?.waitForNew) {
          // Server responded with 0 suggestions and we're not waiting for new ones
          setSuggestions([]);
          return "empty";
        }
        // waitForNew=true: keep polling — background generation may still be running
      } else if (suggestionsResponse.status === "not_found") {
        setSuggestions([]);
        return "not_found";
      } else if (suggestionsResponse.status === "processing") {
        // continue polling
      } else {
        setSuggestions([]);
        return suggestionsResponse.status;
      }
    } catch {
      setSuggestions([]);
      return "empty";
    }
    attempt++;
    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  setSuggestions([]);
  return "empty";
}


