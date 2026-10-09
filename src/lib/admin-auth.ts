import { cache } from "react";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchIsAdmin } from "@/features/auth/services/adminService";

// Server-only: admin pages and admin API routes gate on the API's verdict for the request's
// `token` cookie. The old `adminAllowed` cookie was set by client JS and proved nothing.

/** Whether the current request is from an admin. Deduplicated per server render. */
export const isAdminRequest = cache(async (): Promise<boolean> => {
  const token = (await cookies()).get("token")?.value;
  return token ? fetchIsAdmin(token) : false;
});

/** For route handlers: a 403 response unless the caller is an admin, otherwise null. */
export async function requireAdmin(): Promise<NextResponse | null> {
  return (await isAdminRequest())
    ? null
    : NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
