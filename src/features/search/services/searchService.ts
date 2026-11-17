import { fetchWithAuth } from "@/features/chatHistory/services/chatService";
import type { Chat } from "@/features/chatHistory/types/types.Chat";

export interface TranslationHit {
  chatId: string;
  title: string;
  fileName: string;
  fileType: string;
  targetLanguage: string;
}

const PER_GROUP = 6;

/**
 * The person's own translations whose file name or title contains `query`,
 * newest activity first. The API does the search (`search` on the history
 * list); the same test is repeated here so an API that does not know the
 * option yet, and so returns everything, still shows only matches.
 */
export async function searchTranslations(query: string, signal?: AbortSignal): Promise<TranslationHit[]> {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return [];

  const params = new URLSearchParams({
    search: query.trim().slice(0, 100),
    pageSize: String(PER_GROUP * 3),
    pageNumber: "1",
  });
  const response = await fetchWithAuth(`/document-translation/chat/user?${params.toString()}`, { signal });
  if (!response.ok) throw new Error("Search failed");

  const body = await response.json();
  const chats: Chat[] = body?.data?.chats ?? [];
  return chats
    .filter((c) => `${c.title ?? ""} ${c.originalFileName ?? ""}`.toLocaleLowerCase().includes(needle))
    .slice(0, PER_GROUP)
    .map((c) => ({
      chatId: c.chatId,
      title: c.title || c.originalFileName,
      fileName: c.originalFileName,
      fileType: c.fileType,
      targetLanguage: c.targetLanguageName,
    }));
}
