import { useAuthStore } from "@/features/auth/store/authStore";
import { reaccessToken } from "@/features/auth/services/authorizationService";
import { API_BASE_URL } from "@/shared/constants/api";

export type TrendGranularity = "week" | "month";

/** One week or month of the admin trend (GET Statistics/admin/user-trend). */
export interface UserTrendPoint {
  /** First day of the week (Monday) or month, UTC. */
  periodStart: string;
  newUsers: number;
  totalUsers: number;
  activeUsers: number;
  payingUsers: number;
}

export interface UserTrend {
  granularity: TrendGranularity;
  points: UserTrendPoint[];
}

const fetchWithAuth = async (endpoint: string): Promise<Response> => {
  const { token, refreshToken, setToken, setRefreshToken, reset } = useAuthStore.getState();
  if (!token) throw new Error("No token found");

  const headers = new Headers({ Authorization: `Bearer ${token}` });
  let response = await fetch(`${API_BASE_URL}${endpoint}`, { headers, cache: "no-store" });

  if (response.status === 401 && refreshToken) {
    try {
      const newTokens = (await reaccessToken(refreshToken)) as { token: string; refreshToken: string };
      setToken(newTokens.token);
      setRefreshToken(newTokens.refreshToken);
      headers.set("Authorization", `Bearer ${newTokens.token}`);
      response = await fetch(`${API_BASE_URL}${endpoint}`, { headers, cache: "no-store" });
    } catch (error) {
      reset();
      throw new Error("Failed to refresh token " + error);
    }
  }
  return response;
};

/** New, total, active and paying users per week or month. Dates are yyyy-mm-dd; empty means the default range. */
export async function getUserTrend(
  granularity: TrendGranularity,
  from: string,
  to: string,
  includeInternal: boolean,
): Promise<UserTrend> {
  const params = new URLSearchParams({ granularity, includeInternal: String(includeInternal) });
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const response = await fetchWithAuth(`/Statistics/admin/user-trend?${params.toString()}`);
  if (!response.ok) {
    throw new Error(
      response.status === 403
        ? "Your account is not allowed to see statistics."
        : `Failed to load the user trend (${response.status})`,
    );
  }
  return response.json();
}
