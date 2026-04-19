import { useAuthStore } from "@/features/auth";
import { reaccessToken } from "@/features/auth/services/authorizationService";
import { API_BASE_URL } from "@/shared/constants/api";

export async function cancelSubscription(): Promise<void> {
  const endpoint = "/Subscription/cancel";
  const { refreshToken, token } = useAuthStore.getState();
  const headers = new Headers();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  } else {
    throw new Error("No token found");
  }

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "DELETE",
    headers,
  });

  if (response.status === 401 && token && refreshToken) {
    try {
      const newTokens = (await reaccessToken(refreshToken)) as {
        token: string;
        refreshToken: string;
      };
      const { setToken, setRefreshToken } = useAuthStore.getState();
      setToken(newTokens.token);
      setRefreshToken(newTokens.refreshToken);
      headers.set("Authorization", `Bearer ${newTokens.token}`);
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "DELETE",
        headers,
      });
    } catch (error) {
      useAuthStore.getState().reset();
      throw new Error("Failed to refresh token " + error);
    }
  }

  if (!response.ok && response.status !== 204) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error || "Failed to cancel subscription");
  }
}
