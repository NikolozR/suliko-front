import { useAuthStore } from "@/features/auth/store/authStore";
import { reaccessToken } from "@/features/auth/services/authorizationService";
import { API_BASE_URL } from "@/shared/constants/api";

/**
 * A one-time code that signs the current suliko.ge user in to Suliko Office.
 *
 * Office sends the browser here with its callback address and a PKCE
 * challenge; the backend issues a code bound to both, valid for a minute and
 * redeemable once, by Office's server alone. See the backend's
 * `OfficeSsoController`.
 */
export type OfficeCodeResult =
  | { ok: true; code: string; redirectUri: string }
  | { ok: false; reason: "signed_out" | "invalid_request" | "unavailable" };

async function post(token: string, body: unknown): Promise<Response> {
  return fetch(`${API_BASE_URL}/office/sso/code`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
}

export async function requestOfficeCode(
  redirectUri: string,
  codeChallenge: string,
): Promise<OfficeCodeResult> {
  const { token, refreshToken, setToken, setRefreshToken, reset } = useAuthStore.getState();
  if (!token) return { ok: false, reason: "signed_out" };

  const body = { redirectUri, codeChallenge, codeChallengeMethod: "S256" };
  let response: Response;
  try {
    response = await post(token, body);
    if (response.status === 401) {
      if (!refreshToken) {
        reset();
        return { ok: false, reason: "signed_out" };
      }
      try {
        const fresh = (await reaccessToken(refreshToken)) as { token: string; refreshToken: string };
        setToken(fresh.token);
        setRefreshToken(fresh.refreshToken);
        response = await post(fresh.token, body);
      } catch {
        reset();
        return { ok: false, reason: "signed_out" };
      }
    }
  } catch {
    return { ok: false, reason: "unavailable" };
  }

  if (response.status === 401) {
    reset();
    return { ok: false, reason: "signed_out" };
  }
  if (response.status === 400) return { ok: false, reason: "invalid_request" };
  if (!response.ok) return { ok: false, reason: "unavailable" };

  const data = (await response.json().catch(() => null)) as
    | { code?: unknown; redirectUri?: unknown }
    | null;
  if (typeof data?.code !== "string" || typeof data?.redirectUri !== "string") {
    return { ok: false, reason: "unavailable" };
  }
  return { ok: true, code: data.code, redirectUri: data.redirectUri };
}
