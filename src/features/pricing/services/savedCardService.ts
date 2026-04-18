import { reaccessToken, useAuthStore } from "@/features/auth";
import { API_BASE_URL } from "@/shared";
import { SavedCard } from "../types/savedCard";

const USE_MOCK_CARDS = false;

const MOCK_CARDS: SavedCard[] = [
  { id: "mock-1", last4: "4242", brand: "Visa", expMonth: 12, expYear: 2027, isDefault: true },
  { id: "mock-2", last4: "5555", brand: "Mastercard", expMonth: 8, expYear: 2026 },
];

async function getAuthHeaders(): Promise<Headers> {
  const { token } = useAuthStore.getState();
  if (!token) throw new Error("No token found");
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");
  return headers;
}

async function withTokenRefresh<T>(fn: (headers: Headers) => Promise<Response>): Promise<T> {
  const { refreshToken, token } = useAuthStore.getState();
  let headers = await getAuthHeaders();
  let response = await fn(headers);

  if (response.status === 401 && token && refreshToken) {
    const newTokens = (await reaccessToken(refreshToken)) as { token: string; refreshToken: string };
    const { setToken, setRefreshToken } = useAuthStore.getState();
    setToken(newTokens.token);
    setRefreshToken(newTokens.refreshToken);
    headers = new Headers();
    headers.set("Authorization", `Bearer ${newTokens.token}`);
    headers.set("Content-Type", "application/json");
    response = await fn(headers);
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Request failed");
  }

  return response.json() as Promise<T>;
}

export async function getSavedCards(): Promise<SavedCard[]> {
  if (USE_MOCK_CARDS) return Promise.resolve(MOCK_CARDS);
  return withTokenRefresh<SavedCard[]>((headers) =>
    fetch(`${API_BASE_URL}/Payment/saved-cards`, { headers })
  );
}

export async function deleteSavedCard(id: string): Promise<void> {
  if (USE_MOCK_CARDS) return Promise.resolve();
  await withTokenRefresh<unknown>((headers) =>
    fetch(`${API_BASE_URL}/Payment/saved-cards/${id}`, { method: "DELETE", headers })
  );
}

export async function addCard(): Promise<{ checkoutUrl: string }> {
  if (USE_MOCK_CARDS) return Promise.resolve({ checkoutUrl: "#" });
  return withTokenRefresh<{ checkoutUrl: string }>((headers) =>
    fetch(`${API_BASE_URL}/Payment/add-card`, { method: "POST", headers })
  );
}
