import { useAuthStore } from "../store/authStore";
import { reaccessToken } from "./authorizationService";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface TranslateUserContentParams {
  description: string;
  LanguageId: number;
  SourceLanguageId: number;
  Files: File[];
  IsPdf: boolean;
}

export const translateUserContent = async (
  params: TranslateUserContentParams
): Promise<string> => {
  const formData = new FormData();

  formData.append("description", params.description);
  formData.append("LanguageId", params.LanguageId.toString());
  formData.append("SourceLanguageId", params.SourceLanguageId.toString());
  params.Files.forEach((file) => {
    formData.append("Files", file);
  });
  formData.append("IsPdf", params.IsPdf.toString());

  const endpoint = "/UserContent/translate";
  const token = useAuthStore.getState().token;
  const refreshToken = useAuthStore.getState().refreshToken;
  
  
  const headers = new Headers();
  if (token) {
    headers.append("Authorization", `Bearer ${token}`);
  }

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (response.status === 401 && token && refreshToken) {
    try {
      const newTokens = await reaccessToken(token, refreshToken);
      useAuthStore.getState().setToken(newTokens.accessToken);
      useAuthStore.getState().setRefreshToken(newTokens.refreshToken);
      headers.set("Authorization", `Bearer ${newTokens.accessToken}`);
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers,
        body: formData,
      });
    } catch {
      throw new Error("Token refresh failed");
    }
  }

  if (response.status !== 200) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Translation failed");
  } else {
    const data = await response.json();
    console.log(data);
    return data;
  }
};
