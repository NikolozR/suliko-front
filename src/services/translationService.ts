import { TranslateUserContentParams } from "@/types/translation";
import { useAuthStore } from "../store/authStore";
import { reaccessToken } from "./authorizationService";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const translateUserContent = async (
  params: TranslateUserContentParams
): Promise<string> => {
  const endpoint = "/UserContent/translate";

  const formData = new FormData();
  formData.append("Description", params.Description);
  formData.append("LanguageId", params.LanguageId.toString());
  formData.append("SourceLanguageId", params.SourceLanguageId.toString());
  params.Files.forEach((file) => {
    formData.append("Files", file);
  });
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
    console.log("Refreshing token");
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
    console.log("What is happening here?", response);
    const errorData = await response.json();
    throw new Error(errorData.message || "Translation failed");
  } else {
    const data = await response.json();
    return data;
  }
};
