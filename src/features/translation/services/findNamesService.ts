import { API_BASE_URL } from "@/shared/constants/api";
import { reaccessToken, useAuthStore } from "@/features/auth";
import type { NameTranslationItem, NameTranslationType } from "../types/types.Translation";

export interface FindNamesParams {
  fileUri: string;
  mimeType: string;
  /** 0 or omitted lets the model detect it. */
  sourceLanguageId?: number;
  targetLanguageId: number;
  signal?: AbortSignal;
}

interface RawItem {
  original?: string;
  translation?: string;
  type?: string;
}

interface FindNamesResponse {
  success?: boolean;
  items?: RawItem[];
}

const ENDPOINT = `${API_BASE_URL}/Document/find-names`;

const normalizeType = (type?: string): NameTranslationType =>
  type && type.toLowerCase().startsWith("org") ? "Organization" : "Person";

/**
 * Asks the backend for the people and organisations in a prepared document, each with a suggested
 * rendering in the target language, for the confirm-names review. One small call on the file the
 * server already holds: about 5 s on a 20-page document.
 *
 * Returns null on any failure, and an empty list when the document names no one: the caller falls
 * back to the old search only for the first, never for the second.
 */
export async function findNames(params: FindNamesParams): Promise<NameTranslationItem[] | null> {
  const { signal, ...body } = params;
  const { token, refreshToken } = useAuthStore.getState();
  if (!token) return null;

  const send = (bearer: string) =>
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${bearer}` },
      body: JSON.stringify({
        ...body,
        sourceLanguageId: body.sourceLanguageId && body.sourceLanguageId > 0 ? body.sourceLanguageId : undefined,
      }),
      signal,
    });

  try {
    let response = await send(token);

    if (response.status === 401 && refreshToken) {
      const next = (await reaccessToken(refreshToken)) as { token: string; refreshToken: string };
      const { setToken, setRefreshToken } = useAuthStore.getState();
      setToken(next.token);
      setRefreshToken(next.refreshToken);
      response = await send(next.token);
    }

    if (!response.ok) return null;

    const data = (await response.json()) as FindNamesResponse;
    if (!data.success || !Array.isArray(data.items)) return null;

    return data.items
      .filter((item): item is RawItem => !!item && !!item.original)
      .map((item) => ({
        original: (item.original ?? "").trim(),
        translation: (item.translation ?? "").trim(),
        type: normalizeType(item.type),
      }))
      .filter((item) => item.original.length > 0);
  } catch (err) {
    if ((err as Error)?.name !== "AbortError") {
      console.error("Finding names failed:", err);
    }
    return null;
  }
}
