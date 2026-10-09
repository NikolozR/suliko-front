import { API_BASE_URL } from "@/shared/constants/api";
import { reaccessToken, useAuthStore } from "@/features/auth";
import { DocumentAnalysis } from "@/features/translation/types/types.Translation";

export interface AnalyzeDocumentParams {
  fileUri: string;
  mimeType: string;
  /** 0 or omitted lets the model detect it. */
  sourceLanguageId?: number;
  targetLanguageId: number;
  /** The reader's UI language, for the summary and questions. */
  outputLanguageId?: number;
  signal?: AbortSignal;
}

const ENDPOINT = `${API_BASE_URL}/Document/analyze`;

/**
 * Asks the backend to read a prepared document once and describe it: what it
 * is, the names and terms to decide, and any questions for the user.
 *
 * Returns null on any failure. The analysis helps the user decide things
 * before paying; it must never stand between them and the translate button.
 */
export async function analyzeDocument(params: AnalyzeDocumentParams): Promise<DocumentAnalysis | null> {
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

    const data = (await response.json()) as { success?: boolean; analysis?: DocumentAnalysis };
    return data.success && data.analysis ? data.analysis : null;
  } catch (err) {
    if ((err as Error)?.name !== "AbortError") {
      console.error("Document analysis failed:", err);
    }
    return null;
  }
}
