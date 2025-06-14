import { API_BASE_URL } from "@/shared/constants/api";
import {
  DocumentTranslateUserContentParams,
  DocumentTranslationResponse,
  TextTranslateUserContentParams,
  TextTranslateUserContentResponse,
} from "@/features/translation/types/types.Translation";
import { useAuthStore } from "@/features/auth/store/authStore";
import { reaccessToken } from "@/features/auth/services/authorizationService";

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
      const newTokens = await reaccessToken(refreshToken);
      const { setToken, setRefreshToken } = useAuthStore.getState();
      setToken(newTokens.accessToken);
      setRefreshToken(newTokens.refreshToken);
      headers.set("Authorization", `Bearer ${newTokens.accessToken}`);
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
    const errorData = await response.json();
    throw new Error(errorData.message || "Translation failed");
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
  const tesseractEndpoint = "/Document/tesseract/translate";
  const srtEndpoint = "/Document/srt/translate";
  let endpoint = "";
  if (isSrt) {
    endpoint = srtEndpoint;
  } else {
    endpoint = params.SourceLanguageId === 1 ? claudedEndpoint : tesseractEndpoint;
  }
  console.log(endpoint);
  const formData = new FormData();

  formData.append("File", params.File);
  formData.append("TargetLanguageId", String(params.TargetLanguageId));
  formData.append("OutputFormat", String(params.OutputFormat));

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
      const newTokens = await reaccessToken(refreshToken);
      const { setToken, setRefreshToken } = useAuthStore.getState();
      setToken(newTokens.accessToken);
      setRefreshToken(newTokens.refreshToken);
      headers.set("Authorization", `Bearer ${newTokens.accessToken}`);
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
    const errorData = await response.json();
    throw new Error(errorData.message || "Translation failed");
  } else {
    const data = await response.json();
    return data;
  }
};