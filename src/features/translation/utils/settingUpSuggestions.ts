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
    const maxAttempts = 20; 
    const delayMs = 3000; 
    let attempt = 0;
    
    while (attempt < maxAttempts) {
        try {
            const suggestionsResponse = await getSuggestions(jobId);
            console.log(jobId);
            if (isSuggestionsResponse(suggestionsResponse)) {
                const filtered = suggestionsResponse.suggestions.filter(s =>
                    s.description !== null || s.originalText !== null || s.suggestedText !== null
                );
                if (filtered.length > 0) {
                    setSuggestions(filtered);
                    return 'success';
                }
                console.log('Suggestions response successful but empty, attempt:', attempt + 1);
            } else if (suggestionsResponse.status === 'processing') {
                console.log('Suggestions still processing, attempt:', attempt + 1);
            } else {
                console.log('Suggestions failed with status:', suggestionsResponse.status);
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
    
    console.log('18 seconds elapsed, no suggestions available');
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
            console.log(jobId);
            if (isSuggestionsResponse(suggestionsResponse)) {
                const filtered = suggestionsResponse.suggestions.filter(s =>
                    s.description !== null || s.originalText !== null || s.suggestedText !== null
                );
                if (filtered.length > 0) {
                    addSuggestions(filtered);
                    return 'success';
                }
                console.log('More suggestions response successful but empty, attempt:', attempt + 1);
            } else if (suggestionsResponse.status === 'processing') {
                console.log('More suggestions still processing, attempt:', attempt + 1);
            } else {
                console.log('More suggestions failed with status:', suggestionsResponse.status);
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
    
    console.log('18 seconds elapsed, no more suggestions available');
    return 'empty';
}