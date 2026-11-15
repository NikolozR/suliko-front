import { cookies } from "next/headers";
import { API_BASE_URL } from "@/shared/constants/api";
import type { BlogPostRow } from "./blog-types";
import type { PassportTemplate } from "./passport-types";

// Server-only: what the admin pages show of the blog and the passport templates. Both are kept
// by the API (they used to be in Supabase). Reads go out with the signed-in admin's own `token`
// cookie, and the API checks that it is an admin's.

/** The API's answer, or null when there is no sign-in, no such thing, or the API said no. */
async function adminGet<T>(path: string): Promise<T | null> {
  const token = (await cookies()).get("token")?.value;
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

/** Every post, drafts included, newest first. */
export const getAdminBlogPosts = () => adminGet<BlogPostRow[]>("/Blog/admin/posts");

export const getAdminBlogPost = (id: string) =>
  adminGet<BlogPostRow>(`/Blog/admin/posts/${encodeURIComponent(id)}`);

/** Every template, inactive ones included, newest first. */
export const getAdminPassportTemplates = () => adminGet<PassportTemplate[]>("/PassportTemplate");

export const getAdminPassportTemplate = (id: string) =>
  adminGet<PassportTemplate>(`/PassportTemplate/${encodeURIComponent(id)}`);
