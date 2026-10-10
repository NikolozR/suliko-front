import { useAuthStore } from "@/features/auth/store/authStore";
import { reaccessToken } from "@/features/auth/services/authorizationService";
import type { AssignedOrder, AssignedOrderDetail } from "./types";

export type OrdersLoad<T> =
  | { status: "ok"; data: T }
  | { status: "unavailable" }
  | { status: "notFound" }
  /** Signed in, but no bureau works with this account as a translator. */
  | { status: "notTranslator" }
  /** Nobody is signed in, or the sign-in has ended and could not be renewed. */
  | { status: "signedOut" }
  | { status: "error" };

/**
 * Refused by this site's own route for want of a usable `token` cookie
 * (`requirePortalUser`), as opposed to anything the Office API answered.
 */
async function signInRefused(response: Response): Promise<boolean> {
  if (response.status !== 401) return false;
  const body = (await response.clone().json().catch(() => null)) as { error?: unknown } | null;
  return body?.error === "unauthorized";
}

/**
 * A fresh access token, put where the Orders routes read it (`setToken`
 * rewrites the `token` cookie).
 *
 * "over": the sign-in itself has ended. "failed": it could not be renewed
 * right now, which says nothing about the sign-in.
 */
async function renewSignIn(): Promise<"renewed" | "over" | "failed"> {
  const { token, refreshToken, setToken, setRefreshToken } = useAuthStore.getState();
  if (!token || !refreshToken) return "over";
  try {
    const fresh = (await reaccessToken(refreshToken)) as { token: string; refreshToken: string };
    setToken(fresh.token);
    setRefreshToken(fresh.refreshToken);
    return "renewed";
  } catch (error) {
    // The session routes answer 401 only when there is no sign-in left to renew.
    return error instanceof Error && error.message.includes("(401)") ? "over" : "failed";
  }
}

async function load<T>(url: string): Promise<OrdersLoad<T>> {
  try {
    let response = await fetch(url, { cache: "no-store" });
    // The access token in the cookie lasts half an hour. Someone arriving after
    // a pause still carries the expired one: the session provider renews it,
    // but only once the page is up, and this request has left by then. So a
    // refusal here means "renew and ask again", not "could not load".
    if (await signInRefused(response)) {
      const renewal = await renewSignIn();
      if (renewal === "over") return { status: "signedOut" };
      if (renewal === "failed") return { status: "error" };
      response = await fetch(url, { cache: "no-store" });
    }
    // 503: the portal is not switched on for this deployment.
    if (response.status === 503) return { status: "unavailable" };
    if (response.status === 404) return { status: "notFound" };
    // 403: the Office API knows who is asking and has no translator by that account.
    if (response.status === 403) return { status: "notTranslator" };
    if (!response.ok) return { status: "error" };
    return { status: "ok", data: (await response.json()) as T };
  } catch {
    return { status: "error" };
  }
}

export const fetchAssignments = () => load<AssignedOrder[]>("/api/office/assignments");

export const fetchAssignedOrder = (slug: string, orderId: string) =>
  load<AssignedOrderDetail>(
    `/api/office/orders/${encodeURIComponent(slug)}/${encodeURIComponent(orderId)}`
  );

export const fileDownloadUrl = (slug: string, orderId: number, documentId: number, fileId: string) =>
  `/api/office/orders/${encodeURIComponent(slug)}/${orderId}/documents/${documentId}/files/${encodeURIComponent(fileId)}`;
