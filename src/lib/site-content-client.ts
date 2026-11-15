import { useAuthStore } from "@/features/auth/store/authStore";
import { reaccessToken } from "@/features/auth/services/authorizationService";
import { API_BASE_URL } from "@/shared/constants/api";

// The admin panel's changes to the blog and the passport templates, sent from the browser
// straight to the API (which keeps both; they used to be in Supabase), as the signed-in admin.
// Uploads go there directly too, so no 4.5 MB Vercel function sits in their way.

/** Calls the API as the signed-in user, renewing the sign-in once if it has run out. */
async function call(path: string, init: RequestInit = {}): Promise<Response> {
  const { token, refreshToken, setToken, setRefreshToken } = useAuthStore.getState();
  if (!token) throw new Error("You are not signed in.");

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  // A FormData body sets its own type, boundary included.
  if (typeof init.body === "string") headers.set("Content-Type", "application/json");

  let res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, cache: "no-store" });
  if (res.status === 401 && refreshToken) {
    const next = (await reaccessToken(refreshToken)) as { token: string; refreshToken: string };
    setToken(next.token);
    setRefreshToken(next.refreshToken);
    headers.set("Authorization", `Bearer ${next.token}`);
    res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, cache: "no-store" });
  }
  return res;
}

/** The API's answer, or an Error carrying its explanation. */
async function expectOk<T>(res: Response, fallback: string): Promise<T> {
  if (res.ok) return (await res.json()) as T;
  if (res.status === 403) throw new Error("Your account is not allowed to change this.");
  const data = await res.json().catch(() => null);
  throw new Error((data && (data.error || data.message || data.title)) || fallback);
}

function upload(path: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  return call(path, { method: "POST", body: form });
}

// ── Blog ──────────────────────────────────────────────────────────────────

export interface BlogPostPayload {
  cover_image: string | null;
  author_name: string;
  tags: string[];
  status: "draft" | "published";
  published_at: string | null;
  translations: { locale: string; slug: string; title: string; excerpt: string; content: string }[];
}

/** Creates a post (id null) or replaces one's fields and the locales it names. */
export async function saveBlogPost(id: string | null, payload: BlogPostPayload): Promise<void> {
  const res = await call(id ? `/Blog/admin/posts/${encodeURIComponent(id)}` : "/Blog/admin/posts", {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(payload),
  });
  await expectOk(res, "Failed to save post");
}

export async function deleteBlogPost(id: string): Promise<void> {
  await expectOk(await call(`/Blog/admin/posts/${encodeURIComponent(id)}`, { method: "DELETE" }), "Failed to delete post");
}

/** Stores an image for a post and answers with the address to use. */
export async function uploadBlogImage(file: File): Promise<string> {
  const stored = await expectOk<{ url: string }>(await upload("/Blog/admin/images", file), "Failed to upload image");
  return stored.url;
}

// ── Passport templates ────────────────────────────────────────────────────

export interface PassportTemplatePayload {
  name?: string;
  country?: string;
  docx_file_id?: string;
  fields?: { key: string; label: string; description: string; order: number }[];
  is_active?: boolean;
}

/** Creates a template (id null) or changes the fields given. */
export async function savePassportTemplate(id: string | null, payload: PassportTemplatePayload): Promise<void> {
  const res = await call(id ? `/PassportTemplate/${encodeURIComponent(id)}` : "/PassportTemplate", {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(payload),
  });
  await expectOk(res, "Save failed");
}

export async function deletePassportTemplate(id: string): Promise<void> {
  await expectOk(await call(`/PassportTemplate/${encodeURIComponent(id)}`, { method: "DELETE" }), "Delete failed");
}

/** Stores a template's Word file: its id (to save with the template), address and {{placeholders}}. */
export function uploadPassportTemplateDocx(file: File) {
  return upload("/PassportTemplate/upload", file).then((res) =>
    expectOk<{ id: string; url: string; placeholders: string[] }>(res, "Upload failed"),
  );
}
