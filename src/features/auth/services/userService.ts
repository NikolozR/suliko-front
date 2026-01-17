import { useAuthStore } from "@/features/auth/store/authStore";
import { reaccessToken } from "./authorizationService";
import { UpdateUserProfile, UserProfile } from "@/features/auth/types/types.User";
import { getUserID } from "@/shared/lib/utils";
import { API_BASE_URL } from "@/shared/constants/api";


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
      const newTokens = await reaccessToken(refreshToken) as { token: string; refreshToken: string };
      const { setToken, setRefreshToken } = useAuthStore.getState();
      setToken(newTokens.token);
      setRefreshToken(newTokens.refreshToken);
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
      `Failed to fetch user profile: ${response.status} ${response.statusText
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
  if (response.status === 401 && token && refreshToken) {
    try {
      const newTokens = await reaccessToken(refreshToken) as { token: string; refreshToken: string };
      const { setToken, setRefreshToken } = useAuthStore.getState();
      setToken(newTokens.token);
      setRefreshToken(newTokens.refreshToken);
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
      `Failed to update user profile: ${response.status} ${response.statusText
      }. ${errorData?.message || ""}`
    );
  }
}

export interface ChangePasswordRequest {
  id: string;
  currentPassword: string;
  newPassword: string;
}

export const changePassword = async (passwordData: ChangePasswordRequest) => {
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
    method: "PATCH",
    body: JSON.stringify(passwordData),
  });

  if (response.status === 401 && token && refreshToken) {
    try {
      const newTokens = await reaccessToken(refreshToken) as { token: string; refreshToken: string };
      const { setToken, setRefreshToken } = useAuthStore.getState();
      setToken(newTokens.token);
      setRefreshToken(newTokens.refreshToken);
      headers.set("Authorization", `Bearer ${newTokens.token}`);
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers,
        method: "PATCH",
        body: JSON.stringify(passwordData),
      });
    } catch (error) {
      useAuthStore.getState().reset();
      throw new Error("Failed to refresh token " + error);
    }
  }

  if (response.status !== 200) {
    const errorData = await response.json().catch(() => ({
      message: "Failed to change password and couldn't parse error JSON.",
    }));
    throw new Error(
      `Failed to change password: ${response.status} ${response.statusText
      }. ${errorData?.message || ""}`
    );
  }
}


export const deleteAccount = async (userId: string) => {
  const { refreshToken, token, reset } = useAuthStore.getState();

  if (!token) {
    throw new Error("No token found");
  }

  const endpoint = `/User/${userId}`;
  const headers = new Headers();

  headers.set("Authorization", `Bearer ${token}`);

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers,
    method: "DELETE",
  });
  reset()
  if (response.status === 401 && token && refreshToken) {
    try {
      const newTokens = await reaccessToken(refreshToken) as {
        token: string;
        refreshToken: string;
      };

      const { setToken, setRefreshToken } = useAuthStore.getState();
      setToken(newTokens.token);
      setRefreshToken(newTokens.refreshToken);

      headers.set("Authorization", `Bearer ${newTokens.token}`);

      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers,
        method: "DELETE",
      });
    } catch (error) {
      useAuthStore.getState().reset();
      throw new Error("Failed to refresh token " + error);
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: "Failed to delete account and couldn't parse error JSON.",
    }));

    throw new Error(
      `Failed to delete account: ${response.status} ${response.statusText
      }. ${errorData?.message || ""}`
    );
  }
};
