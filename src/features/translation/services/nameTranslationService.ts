import { API_BASE_URL } from "@/shared/constants/api";
import { NameTranslationItem, NameTranslationType } from "@/features/translation/types/types.Translation";
import { useAuthStore } from "@/features/auth/store/authStore";
import { reaccessToken } from "@/features/auth/services/authorizationService";

interface SuggestNameTranslationsResponse {
  Success?: boolean;
  success?: boolean;
  Items?: RawNameItem[];
  items?: RawNameItem[];
}

interface RawNameItem {
  original?: string;
  translation?: string;
  type?: string;
}

const normalizeType = (type?: string): NameTranslationType =>
  type && type.toLowerCase().startsWith("org") ? "Organization" : "Person";

/**
 * Asks the backend to detect proper names (people + organizations) in the document and
 * suggest a target-language rendering for each, for the user to confirm/edit before translation.
 * Returns an empty array when nothing is detected or the request fails — callers must never
 * let this block the translation flow.
 */
export const suggestNameTranslations = async (
  file: File,
  sourceLanguageId: number,
  targetLanguageId: number
): Promise<NameTranslationItem[]> => {
  const endpoint = "/Document/suggest-name-translations";

  const formData = new FormData();
  formData.append("File", file);
  formData.append("sourceLanguageId", String(sourceLanguageId));
  formData.append("targetLanguageId", String(targetLanguageId));

  const { token, refreshToken } = useAuthStore.getState();

  const headers = new Headers();
  if (token) {
    headers.append("Authorization", `Bearer ${token}`);
  } else {
    throw new Error("No token found");
  }

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (response.status === 401 && token && refreshToken) {
    try {
      const newTokens = (await reaccessToken(refreshToken)) as { token: string; refreshToken: string };
      const { setToken, setRefreshToken } = useAuthStore.getState();
      setToken(newTokens.token);
      setRefreshToken(newTokens.refreshToken);
      headers.set("Authorization", `Bearer ${newTokens.token}`);
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers,
        body: formData,
      });
    } catch {
      useAuthStore.getState().reset();
      throw new Error("Token refresh failed");
    }
  }

  if (response.status < 200 || response.status >= 300) {
    // Non-blocking feature: surface nothing rather than throwing into the translation flow.
    return [];
  }

  const data: SuggestNameTranslationsResponse = await response.json();
  const rawItems = data.items ?? data.Items ?? [];

  return rawItems
    .filter((item): item is RawNameItem => !!item && !!item.original)
    .map((item) => ({
      original: (item.original ?? "").trim(),
      translation: (item.translation ?? "").trim(),
      type: normalizeType(item.type),
    }))
    .filter((item) => item.original.length > 0);
};
