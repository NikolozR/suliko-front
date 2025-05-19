import { useAuthStore } from "../store/authStore";
import { reaccessToken } from "./authorizationService";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

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
  }
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers,
  });

  if (response.status === 401 && token && refreshToken) {
    const newTokens = await reaccessToken(refreshToken);
    useAuthStore.getState().setToken(newTokens.accessToken);
    useAuthStore.getState().setRefreshToken(newTokens.refreshToken);
    headers.set("Authorization", `Bearer ${newTokens.accessToken}`);
  }
  if (!response.ok) {
    throw new Error("Failed to fetch languages");
  }
  const data = await response.json();
  return data;
}
