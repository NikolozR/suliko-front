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
    const maxAttempts = 40; 
    const delayMs = 3000; 
    let attempt = 0;
    
    while (attempt < maxAttempts) {
        try {
            const suggestionsResponse = await getSuggestions(jobId);
            if (isSuggestionsResponse(suggestionsResponse)) {
                const filtered = suggestionsResponse.suggestions.filter(s =>
                    s.description !== null || s.originalText !== null || s.suggestedText !== null
                );
                if (filtered.length > 0) {
                    setSuggestions(filtered);
                    return 'success';
                }
            } else if (suggestionsResponse.status === 'processing') {
            } else {
                setSuggestions([]);
                return suggestionsResponse.status;
            }
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            setSuggestions([]);
            return 'empty';
        }
        attempt++;
        if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }
    
    setSuggestions([]);
    return 'empty';
}

export async function generateMoreSuggestions(jobId: string): Promise<string> {
    const { addSuggestions } = useSuggestionsStore.getState();
    const maxAttempts = 20; 
    const delayMs = 3000; 
    let attempt = 0;
    
    while (attempt < maxAttempts) {
        try {
            const suggestionsResponse = await getSuggestions(jobId);
            if (isSuggestionsResponse(suggestionsResponse)) {
                const filtered = suggestionsResponse.suggestions.filter(s =>
                    s.description !== null || s.originalText !== null || s.suggestedText !== null
                );
                if (filtered.length > 0) {
                    addSuggestions(filtered);
                    return 'success';
                }
            } else if (suggestionsResponse.status === 'processing') {
            } else {
                return suggestionsResponse.status;
            }
        } catch (error) {
            console.error('Error fetching more suggestions:', error);
            return 'empty';
        }
        attempt++;
        if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }
    
    return 'empty';
}