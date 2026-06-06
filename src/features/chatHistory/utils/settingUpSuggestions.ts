import { pollSuggestions } from "@/features/translation/utils/pollSuggestions";
import { useChatSuggestionsStore } from "../store/chatSuggestionsStore";

let activePollController: AbortController | null = null;

export async function settingUpChatSuggestions(jobId: string): Promise<string> {
  activePollController?.abort();
  activePollController = new AbortController();

  const { setSuggestions } = useChatSuggestionsStore.getState();
  try {
    return await pollSuggestions(jobId, setSuggestions, { signal: activePollController.signal });
  } finally {
    activePollController = null;
  }
}
