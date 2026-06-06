import { getSuggestions } from "@/features/translation/services/suggestionsService";
import { Suggestion, SuggestionsResponse, SuggestionsResponseProcessing } from "@/features/translation/types/types.Translation";

function isSuggestionsResponse(
  obj: SuggestionsResponse | SuggestionsResponseProcessing
): obj is SuggestionsResponse {
  return (
    obj !== null &&
    typeof obj === "object" &&
    "suggestions" in obj &&
    "suggestionCount" in obj
  );
}

function abortableDelay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(new DOMException("Aborted", "AbortError")); return; }
    const timeout = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timeout);
      reject(new DOMException("Aborted", "AbortError"));
    }, { once: true });
  });
}

export async function pollSuggestions(
  jobId: string,
  setSuggestions: (suggestions: Suggestion[]) => void,
  { maxAttempts = 40, signal }: { maxAttempts?: number; signal?: AbortSignal } = {}
): Promise<string> {
  const delayMs = 3000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (signal?.aborted) return "cancelled";

    try {
      const response = await getSuggestions(jobId);

      if (isSuggestionsResponse(response)) {
        const filtered = response.suggestions.filter(
          (s) => s.description !== null && s.originalText !== null && s.suggestedText !== null
        );
        if (filtered.length > 0) {
          setSuggestions(filtered);
          return "success";
        }
      } else if (response.status !== "processing") {
        setSuggestions([]);
        return response.status;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
      console.error("Error polling suggestions:", error);
      setSuggestions([]);
      return "empty";
    }

    if (attempt < maxAttempts - 1) {
      try {
        await abortableDelay(delayMs, signal);
      } catch {
        return "cancelled";
      }
    }
  }

  setSuggestions([]);
  return "empty";
}
