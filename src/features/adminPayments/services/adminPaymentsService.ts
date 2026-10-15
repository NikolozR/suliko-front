import { useAuthStore } from "@/features/auth/store/authStore";
import { reaccessToken } from "@/features/auth/services/authorizationService";
import { API_BASE_URL } from "@/shared/constants/api";

/** One card payment of one user (GET Statistics/admin/payments/{userId}). */
export interface AdminUserPayment {
  orderId: string;
  createdAt: string;
  /** When the bank answered; null while it has not. */
  completedAt: string | null;
  amount: number;
  currency: string;
  /** succeeded, failed, created, pending, refunded, unknown. */
  status: string;
  provider: string;
  description: string | null;
  /** Pages put on the balance; only for a confirmed payment. */
  pages: number | null;
}

/** What one user has paid in one currency (GET Statistics/admin/paid-totals). */
export interface UserPaidTotal {
  userId: string;
  currency: string;
  total: number;
  payments: number;
  lastPaidAt: string;
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

const failure = (response: Response, what: string) =>
  new Error(
    response.status === 403
      ? "Your account is not allowed to see payments."
      : `Failed to load ${what} (${response.status})`,
  );

/** A user's card payments, newest first. Confirmed only unless `all`. */
export async function listUserPayments(userId: string, all: boolean): Promise<AdminUserPayment[]> {
  const response = await fetchWithAuth(
    `/Statistics/admin/payments/${encodeURIComponent(userId)}${all ? "?all=true" : ""}`,
  );
  if (!response.ok) throw failure(response, "payments");
  return response.json();
}

/** Every paying user's totals, per currency. */
export async function listPaidTotals(): Promise<UserPaidTotal[]> {
  const response = await fetchWithAuth("/Statistics/admin/paid-totals");
  if (!response.ok) throw failure(response, "payment totals");
  return response.json();
}
