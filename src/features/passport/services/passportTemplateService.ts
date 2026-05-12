import type { PassportTemplate } from "../types/types.Passport";

export async function listActiveTemplates(): Promise<PassportTemplate[]> {
  const res = await fetch("/api/passport-templates?active=true");
  if (!res.ok) throw new Error("Failed to fetch templates");
  return res.json();
}
