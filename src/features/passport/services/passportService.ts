import { API_BASE_URL } from "@/shared/constants/api";
import { useAuthStore } from "@/features/auth/store/authStore";
import { reaccessToken } from "@/features/auth/services/authorizationService";
import type { OcrResponse, PreviewResponse } from "../types/types.Passport";

// Short timeout just for the initial POST (should return 202 in < 5s)
// and for preview/generate which still run synchronously.
const SUBMIT_TIMEOUT_MS = 15_000;
const PREVIEW_TIMEOUT_MS = 85_000;
// How long to poll for a background OCR job before giving up
const POLL_MAX_MS = 5 * 60_000; // 5 minutes
const POLL_INTERVAL_MS = 3_000;

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
  // Step 1: submit the job (returns 202 { jobId } immediately)
  let submitResponse: Response;
  try {
    submitResponse = await handleTokenRefresh((headers) => {
      const formData = new FormData();
      formData.append("File", file);
      formData.append("TemplateId", templateId);
      formData.append("FieldsJson", JSON.stringify(fieldKeys));
      return fetchWithTimeout(
        `${API_BASE_URL}/Passport/ocr`,
        { method: "POST", headers, body: formData },
        SUBMIT_TIMEOUT_MS
      );
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Could not reach the server. Please check your connection and try again.");
    }
    throw err;
  }

  if (!submitResponse.ok) {
    if (submitResponse.status === 402) throw new Error("QUOTA_EXCEEDED");
    const error = await submitResponse.json().catch(() => ({}));
    throw new Error(error.message || error.errorText || "OCR submission failed");
  }

  const { jobId } = await submitResponse.json();

  // Step 2: poll until completed / failed / timeout
  const deadline = Date.now() + POLL_MAX_MS;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    let pollResponse: Response;
    try {
      pollResponse = await handleTokenRefresh((headers) =>
        fetch(`${API_BASE_URL}/Passport/ocr/${jobId}`, { headers })
      );
    } catch {
      // transient network error — keep polling
      continue;
    }

    if (!pollResponse.ok) {
      if (pollResponse.status === 404)
        throw new Error("Processing job expired. Please try again.");
      continue;
    }

    const poll = await pollResponse.json();

    if (poll.status === "completed") return poll.result as OcrResponse;
    if (poll.status === "failed")
      throw new Error(poll.error || "OCR processing failed on the server.");
    // "queued" or "processing" — keep waiting
  }

  throw new Error("Processing timed out. The server is busy — please try again in a moment.");
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
        PREVIEW_TIMEOUT_MS
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
