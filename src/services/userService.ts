import { useAuthStore } from "@/store/authStore";
import { reaccessToken } from "./authorizationService";
import { UpdateUserProfile, UserProfile } from "@/types/types.User";
import { getUserID } from "@/lib/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export const getUserProfile = async (): Promise<UserProfile> => {
  const { refreshToken, token } = useAuthStore.getState();

  if (!token) {
    throw new Error("No token found");
  }

  const userID = getUserID(token || "");
  const endpoint = `/User/${userID}`;
  const headers = new Headers();

  headers.set("Authorization", `Bearer ${token}`);

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
      useAuthStore.getState().reset();
      throw new Error("Failed to refresh token " + error);
    }
  }

  if (response.status !== 200) {
    const errorData = await response.json().catch(() => ({
      message: "Failed to fetch user profile and couldn't parse error JSON.",
    }));
    throw new Error(
      `Failed to fetch user profile: ${response.status} ${
        response.statusText
      }. ${errorData?.message || ""}`
    );
  }

  const data = await response.json();
  return data;
};



export const updateUserProfile = async (userProfile: UpdateUserProfile) => {
  const { refreshToken, token } = useAuthStore.getState();
  if (!token) {
    throw new Error("No token found");
  }

  const endpoint = `/User`;
  const headers = new Headers();

  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers,
    method: "PUT",
    body: JSON.stringify(userProfile),
  });
  console.log(response);
  if (response.status === 401 && token && refreshToken) {
    try {
      const newTokens = await reaccessToken(refreshToken);
      useAuthStore.getState().setToken(newTokens.token);
      useAuthStore.getState().setRefreshToken(newTokens.refreshToken);
      headers.set("Authorization", `Bearer ${newTokens.token}`);
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers,
        method: "PUT",
        body: JSON.stringify(userProfile),
      });
    } catch (error) {
      useAuthStore.getState().reset();
      throw new Error("Failed to refresh token " + error);
    }
  }

  if (response.status !== 200) {
    const errorData = await response.json().catch(() => ({
      message: "Failed to update user profile and couldn't parse error JSON.",
    }));
    throw new Error(
      `Failed to update user profile: ${response.status} ${
        response.statusText
      }. ${errorData?.message || ""}`
    );
  }
}