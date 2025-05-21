import { TextTranslateUserContentParams, TextTranslateUserContentResponse } from "@/types/translation";
import { useAuthStore } from "../store/authStore";
import { reaccessToken } from "./authorizationService";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const translateUserContent = async (
  params: TextTranslateUserContentParams
): Promise<TextTranslateUserContentResponse> => {
  const endpoint = "/UserContent/translate";

  const formData = new FormData();
  formData.append("Description", params.Description);
  formData.append("LanguageId", String(params.LanguageId));
  formData.append("SourceLanguageId", String(params.SourceLanguageId));
  formData.append("IsPdf", params.IsPdf.toString());

  const {token, refreshToken} = useAuthStore.getState();

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
      useAuthStore.getState().setToken(newTokens.accessToken);
      useAuthStore.getState().setRefreshToken(newTokens.refreshToken);
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
    console.log(data);
    return data;
  }
};
