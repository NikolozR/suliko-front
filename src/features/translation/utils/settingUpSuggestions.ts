import { pollSuggestions } from "./pollSuggestions";
import { useSuggestionsStore } from "../store/suggestionsStore";

let activePollController: AbortController | null = null;

export async function settingUpSuggestions(jobId: string): Promise<string> {
  activePollController?.abort();
  activePollController = new AbortController();

  const { setSuggestions } = useSuggestionsStore.getState();
  try {
    return await pollSuggestions(jobId, setSuggestions, { signal: activePollController.signal });
  } finally {
    activePollController = null;
  }
}

export async function generateMoreSuggestions(jobId: string): Promise<string> {
  const { addSuggestions } = useSuggestionsStore.getState();
  return pollSuggestions(jobId, addSuggestions, { maxAttempts: 20 });
}
