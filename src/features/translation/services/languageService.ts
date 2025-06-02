import { API_BASE_URL } from "@/shared/constants/api";
import { useAuthStore } from "@/features/auth/store/authStore";
import { reaccessToken } from "@/features/auth/services/authorizationService";


export interface Language {
  id: number;
  name: string;
  nameGeo: string;
}

export async function getAllLanguages() {
  const endpoint = "/Language";
  const { refreshToken, token } = useAuthStore.getState();
  const headers = new Headers();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  } else {
    throw new Error("No token found");
  }

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers,
  });

  if (response.status === 401 && token && refreshToken) {
    try {
      const newTokens = await reaccessToken(refreshToken);
      useAuthStore.getState().setToken(newTokens.token);
      useAuthStore.getState().setRefreshToken(newTokens.refreshToken);
      headers.set("Authorization", `Bearer ${newTokens.token}`);
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers,
      });
    } catch (error) {
      // useAuthStore.getState().reset();
      throw new Error("Failed to refresh token " + error);
    }
  }


  if (response.status !== 200) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Translation failed");
  } else {
    const data = await response.json();
    return data;
  }
}
