import { API_BASE_URL } from "@/shared/constants/api";
import { useAuthStore } from "@/features/auth/store/authStore";
import { reaccessToken } from "@/features/auth/services/authorizationService";
import type { OcrResponse, PreviewResponse } from "../types/types.Passport";

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
  const response = await handleTokenRefresh((headers) => {
    const formData = new FormData();
    formData.append("File", file);
    formData.append("TemplateId", templateId);
    formData.append("FieldsJson", JSON.stringify(fieldKeys));

    return fetch(`${API_BASE_URL}/Passport/ocr`, {
      method: "POST",
      headers,
      body: formData,
    });
  });

  if (!response.ok) {
    if (response.status === 402) {
      throw new Error("QUOTA_EXCEEDED");
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.errorText || "OCR extraction failed");
  }

  return response.json();
}

export async function generatePassportDocx(
  templateId: string,
  docxUrl: string,
  fields: Record<string, string>
): Promise<Blob> {
  const response = await handleTokenRefresh((headers) => {
    headers.set("Content-Type", "application/json");
    return fetch(`${API_BASE_URL}/Passport/generate`, {
      method: "POST",
      headers,
      body: JSON.stringify({ templateId, docxUrl, fields }),
    });
  });

  if (!response.ok) {
    if (response.status === 402) {
      throw new Error("QUOTA_EXCEEDED");
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.errorText || error.error || "Document generation failed");
  }

  return response.blob();
}

export async function getPassportPreview(
  templateId: string,
  docxUrl: string,
  fields: Record<string, string>
): Promise<PreviewResponse> {
  const response = await handleTokenRefresh((headers) => {
    headers.set("Content-Type", "application/json");
    return fetch(`${API_BASE_URL}/Passport/preview`, {
      method: "POST",
      headers,
      body: JSON.stringify({ templateId, docxUrl, fields }),
    });
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.errorText || "Preview generation failed");
  }

  return response.json();
}
