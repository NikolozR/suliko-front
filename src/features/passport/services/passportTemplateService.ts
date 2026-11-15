import { API_BASE_URL } from "@/shared/constants/api";
import type { PassportTemplate } from "../types/types.Passport";

/** The templates a passport can be translated into. The API keeps them; reading needs no sign-in. */
export async function listActiveTemplates(): Promise<PassportTemplate[]> {
  const res = await fetch(`${API_BASE_URL}/PassportTemplate?active=true`);
  if (!res.ok) throw new Error("Failed to fetch templates");
  return res.json();
}
