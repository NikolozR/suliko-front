import { API_BASE_URL } from "@/shared/constants/api";

/**
 * Asks the API whether `token` belongs to an admin. The API enforces the same check on every
 * admin endpoint; this only decides what admin UI to show. Any failure counts as "not admin".
 */
export async function fetchIsAdmin(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/User/is-admin`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { isAdmin?: boolean };
    return data?.isAdmin === true;
  } catch {
    return false;
  }
}
