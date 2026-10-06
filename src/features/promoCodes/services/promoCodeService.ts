import { useAuthStore } from "@/features/auth/store/authStore";
import { reaccessToken } from "@/features/auth/services/authorizationService";
import { API_BASE_URL } from "@/shared/constants/api";
import {
  CreatePromoCodeInput,
  PromoCode,
  PromoCodeRedemption,
  RedeemCouponError,
  RedeemCouponResult,
  RedeemErrorCode,
  UpdatePromoCodeInput,
} from "../types";

const fetchWithAuth = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const { token, refreshToken, setToken, setRefreshToken, reset } = useAuthStore.getState();
  if (!token) throw new Error("No token found");

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  if (options.body) headers.set("Content-Type", "application/json");

  let response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers, cache: "no-store" });

  if (response.status === 401 && refreshToken) {
    try {
      const newTokens = (await reaccessToken(refreshToken)) as { token: string; refreshToken: string };
      setToken(newTokens.token);
      setRefreshToken(newTokens.refreshToken);
      headers.set("Authorization", `Bearer ${newTokens.token}`);
      response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers, cache: "no-store" });
    } catch (error) {
      reset();
      throw new Error("Failed to refresh token " + error);
    }
  }

  return response;
};

const errorMessage = async (response: Response, fallback: string): Promise<string> => {
  if (response.status === 403) return "Your account is not allowed to manage promo codes.";
  const data = await response.json().catch(() => null);
  return (data && (data.message || data.error)) || fallback;
};

export async function listPromoCodes(): Promise<PromoCode[]> {
  const response = await fetchWithAuth("/PromoCode");
  if (!response.ok) throw new Error(await errorMessage(response, "Failed to load promo codes"));
  return response.json();
}

export async function createPromoCode(input: CreatePromoCodeInput): Promise<PromoCode> {
  const response = await fetchWithAuth("/PromoCode", { method: "POST", body: JSON.stringify(input) });
  if (!response.ok) throw new Error(await errorMessage(response, "Failed to create promo code"));
  return response.json();
}

export async function updatePromoCode(id: string, input: UpdatePromoCodeInput): Promise<PromoCode> {
  const response = await fetchWithAuth(`/PromoCode/${id}`, { method: "PATCH", body: JSON.stringify(input) });
  if (!response.ok) throw new Error(await errorMessage(response, "Failed to update promo code"));
  return response.json();
}

export async function getPromoCodeRedemptions(id: string): Promise<PromoCodeRedemption[]> {
  const response = await fetchWithAuth(`/PromoCode/${id}/redemptions`);
  if (!response.ok) throw new Error(await errorMessage(response, "Failed to load redemptions"));
  return response.json();
}

export async function redeemCoupon(code: string): Promise<RedeemCouponResult> {
  const response = await fetchWithAuth("/PromoCode/redeem", {
    method: "POST",
    body: JSON.stringify({ code }),
  });

  if (response.ok) return response.json();

  const data = await response.json().catch(() => null);
  const known: RedeemErrorCode[] = ["invalid_code", "already_redeemed", "too_many_attempts"];
  const errorCode: RedeemErrorCode =
    response.status === 429 ? "too_many_attempts" : known.includes(data?.error) ? data.error : "unknown";
  throw new RedeemCouponError(errorCode, data?.message || "Coupon could not be applied");
}
