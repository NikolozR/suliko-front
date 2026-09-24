import { API_BASE_URL } from "@/shared/constants/api";
import {
  DocumentTranslateUserContentParams,
  DocumentTranslateWithUriParams,
  DocumentTranslationResponse,
  TextTranslateUserContentParams,
  TextTranslateUserContentResponse,
} from "@/features/translation/types/types.Translation";
import { useAuthStore } from "@/features/auth/store/authStore";
import { reaccessToken } from "@/features/auth/services/authorizationService";

/**
 * Extracts a human-readable message from a failed response.
 *
 * The API returns validation failures as bare strings with `text/plain`
 * (ASP.NET Core's StringOutputFormatter), so calling `response.json()`
 * directly throws a SyntaxError and swallows the real reason. Read the body
 * as text first, then parse it as JSON only if it actually is JSON.
 */
const readErrorMessage = async (
  response: Response,
  fallback: string
): Promise<string> => {
  let body: string;
  try {
    body = await response.text();
  } catch {
    return fallback;
  }

  if (!body.trim()) return fallback;

  try {
    const parsed = JSON.parse(body);
    if (typeof parsed === "string") return parsed || fallback;
    if (parsed && typeof parsed === "object") {
      const { message, errorText, title, detail } = parsed as Record<string, unknown>;
      const found = [message, errorText, title, detail].find(
        (v): v is string => typeof v === "string" && v.trim().length > 0
      );
      return found ?? fallback;
    }
    return fallback;
  } catch {
    // Not JSON — the plain-text body is the message.
    return body;
  }
};

/**
 * Thrown by `translateDocumentWithUri` for the two failures the backend now
 * reports synchronously. Insufficient balance used to surface as a background
 * job failure minutes later; a stale URI could not be detected at all.
 */
export class DocumentTranslateError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly reason: "insufficientBalance" | "fileChanged" | "unknown",
  ) {
    super(message);
    this.name = "DocumentTranslateError";
  }
}

/**
 * The backend distinguishes these in prose rather than with a code, so match
 * on it — but keep the server's own wording as the message either way.
 */
const classify400 = (message: string): "insufficientBalance" | "fileChanged" | "unknown" => {
  const m = message.toLowerCase();
  if (/balance|ბალანს|insufficient/.test(m)) return "insufficientBalance";
  if (/no longer|changed|mismatch|re-?upload|stale/.test(m)) return "fileChanged";
  return "unknown";
};

export const translateUserContent = async (
  params: TextTranslateUserContentParams
): Promise<TextTranslateUserContentResponse> => {
  const endpoint = "/UserContent/translate";

  const formData = new FormData();

  formData.append("UserText", params.UserText);
  formData.append("LanguageId", String(params.LanguageId));
  formData.append("SourceLanguageId", String(params.SourceLanguageId));

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
      const newTokens = await reaccessToken(refreshToken) as { token: string; refreshToken: string };
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

  if (response.status !== 200) {
    throw new Error(await readErrorMessage(response, "Translation failed"));
  } else {
    const data = await response.json();
    return data;
  }
};


export const translateDocumentUserContent = async (
  params: DocumentTranslateUserContentParams, 
  isSrt: boolean = false
): Promise<DocumentTranslationResponse> => {
  const claudedEndpoint = "/Document/translate";
  // const tesseractEndpoint = "/Document/tesseract/translate";
  const srtEndpoint = "/Document/srt/translate";  
  let endpoint = "";
  
  if (isSrt) {
    endpoint = srtEndpoint;
  } else {
    // const fileExtension = params.File.name.split('.').pop()?.toLowerCase();
    
    // const isImageBasedDocument = ['pdf', 'jpg', 'jpeg', 'png', 'bmp', 'tiff', 'gif', 'webp'].includes(fileExtension || '');
    
    endpoint = claudedEndpoint;
  }
  const formData = new FormData();  
  formData.append("File", params.File);
  formData.append("TargetLanguageId", String(params.TargetLanguageId));
  formData.append("OutputLanguageId", String(params.OutputLanguageId));
  formData.append("OutputFormat", String(params.OutputFormat));
  formData.append("model", String(params.model));

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
      const newTokens = await reaccessToken(refreshToken) as { token: string; refreshToken: string };
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
    throw new Error(await readErrorMessage(response, "Translation failed"));
  } else {
    const data = await response.json();
    return data;
  }
};


export const translateDocumentWithUri = async (
  params: DocumentTranslateWithUriParams
): Promise<DocumentTranslationResponse> => {
  const endpoint = "/Document/translate-with-uri";

  const { token, refreshToken } = useAuthStore.getState();

  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  if (token) {
    headers.append("Authorization", `Bearer ${token}`);
  } else {
    throw new Error("No token found");
  }

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify(params),
  });

  if (response.status === 401 && token && refreshToken) {
    try {
      const newTokens = await reaccessToken(refreshToken) as { token: string; refreshToken: string };
      const { setToken, setRefreshToken } = useAuthStore.getState();
      setToken(newTokens.token);
      setRefreshToken(newTokens.refreshToken);
      headers.set("Authorization", `Bearer ${newTokens.token}`);
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers,
        body: JSON.stringify(params),
      });
    } catch {
      useAuthStore.getState().reset();
      throw new Error("Token refresh failed");
    }
  }

  if (response.status < 200 || response.status >= 300) {
    const message = await readErrorMessage(response, "Translation failed");
    throw new DocumentTranslateError(
      message,
      response.status,
      response.status === 400 ? classify400(message) : "unknown",
    );
  } else {
    const data = await response.json();
    return data;
  }
};