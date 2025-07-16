import { getSuggestions } from "../services/suggestionsService";
import { useSuggestionsStore } from "../store/suggestionsStore";
import { SuggestionsResponse, SuggestionsResponseProcessing } from "../types/types.Translation";

function isSuggestionsResponse(obj: SuggestionsResponse | SuggestionsResponseProcessing): obj is SuggestionsResponse {
  return (
    obj &&
    typeof obj === 'object' &&
    'jobId' in obj &&
    'suggestionCount' in obj &&
    'suggestions' in obj
  );
}

export async function settingUpSuggestions(jobId: string): Promise<string> {
    const { setSuggestions } = useSuggestionsStore.getState();
    try {
        const suggestionsResponse = await getSuggestions(jobId);
        if (isSuggestionsResponse(suggestionsResponse)) {
        
            setSuggestions(suggestionsResponse.suggestions);
        } else {
            return suggestionsResponse.status;
        }
        return 'success';
    } catch {
        throw new Error("Failed to get suggestions");
    }
}