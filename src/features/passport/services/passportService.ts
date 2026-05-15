import { API_BASE_URL } from "@/shared/constants/api";
import { useAuthStore } from "@/features/auth/store/authStore";
import { reaccessToken } from "@/features/auth/services/authorizationService";
import type { OcrResponse, PreviewResponse } from "../types/types.Passport";

// Cloudflare proxy in front of the backend has a hard 100-second timeout.
// We abort slightly before that so the user sees a clear message instead of
// a confusing "CORS error" (which is what the browser reports for a 524).
const OCR_TIMEOUT_MS = 90_000;
const PREVIEW_TIMEOUT_MS = 85_000;

function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(id)
  );
}

function getAuthHeaders(): Headers {
  const headers = new Headers();
  const { token } = useAuthStore.getState();
  if (token) {
    headers.append("Authorization", `Bearer ${token}`);
  }
  return headers;
}

async function handleTokenRefresh(
  makeRequest: (headers: Headers) => Promise<Response>
): Promise<Response> {
  const headers = getAuthHeaders();
  let response = await makeRequest(headers);

  if (response.status === 401) {
    const { token, refreshToken } = useAuthStore.getState();
    if (token && refreshToken) {
      try {
        const newTokens = (await reaccessToken(refreshToken)) as {
          token: string;
          refreshToken: string;
        };
        const { setToken, setRefreshToken } = useAuthStore.getState();
        setToken(newTokens.token);
        setRefreshToken(newTokens.refreshToken);
        headers.set("Authorization", `Bearer ${newTokens.token}`);
        response = await makeRequest(headers);
      } catch {
        useAuthStore.getState().reset();
        throw new Error("Authentication expired. Please sign in again.");
      }
    }
  }

  return response;
}

export async function extractPassportFields(
  file: File,
  templateId: string,
  fieldKeys: string[]
): Promise<OcrResponse> {
  let response: Response;
  try {
    response = await handleTokenRefresh((headers) => {
      const formData = new FormData();
      formData.append("File", file);
      formData.append("TemplateId", templateId);
      formData.append("FieldsJson", JSON.stringify(fieldKeys));

      return fetchWithTimeout(
        `${API_BASE_URL}/Passport/ocr`,
        { method: "POST", headers, body: formData },
        OCR_TIMEOUT_MS
      );
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Processing timed out. The server is busy — please try again in a moment.");
    }
    throw err;
  }

  if (!response.ok) {
    if (response.status === 402) {
      throw new Error("QUOTA_EXCEEDED");
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.errorText || "OCR extraction failed");
  }

  return response.json();
}

export async function generatePassportDocx(
  templateId: string,
  docxUrl: string,
  fields: Record<string, string>
): Promise<Blob> {
  let response: Response;
  try {
    response = await handleTokenRefresh((headers) => {
      headers.set("Content-Type", "application/json");
      return fetchWithTimeout(
        `${API_BASE_URL}/Passport/generate`,
        { method: "POST", headers, body: JSON.stringify({ templateId, docxUrl, fields }) },
        OCR_TIMEOUT_MS
      );
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Document generation timed out. Please try again.");
    }
    throw err;
  }

  if (!response.ok) {
    if (response.status === 402) {
      throw new Error("QUOTA_EXCEEDED");
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.errorText || error.error || "Document generation failed");
  }

  return response.blob();
}

export async function getPassportPreview(
  templateId: string,
  docxUrl: string,
  fields: Record<string, string>
): Promise<PreviewResponse> {
  let response: Response;
  try {
    response = await handleTokenRefresh((headers) => {
      headers.set("Content-Type", "application/json");
      return fetchWithTimeout(
        `${API_BASE_URL}/Passport/preview`,
        { method: "POST", headers, body: JSON.stringify({ templateId, docxUrl, fields }) },
        PREVIEW_TIMEOUT_MS
      );
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Preview timed out. You can still download the document.");
    }
    throw err;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.errorText || "Preview generation failed");
  }

  return response.json();
}
