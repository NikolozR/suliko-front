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
  {
    maxAttempts = 40,
    signal,
    waitForNew = false,
  }: { maxAttempts?: number; signal?: AbortSignal; waitForNew?: boolean } = {}
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
        // The review runs after the job completes, so "nothing yet" is the
        // normal answer for the first few polls. Returning "empty" here made
        // the translation page regenerate on top of a review still in flight.
        if (!waitForNew && !response.isGenerating) {
          setSuggestions([]);
          return "empty";
        }
        // Still generating, or waiting for a regenerate — keep polling
      } else if (response.status === "not_found") {
        setSuggestions([]);
        return "not_found";
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
