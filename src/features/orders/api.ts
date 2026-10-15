import { useAuthStore } from "@/features/auth/store/authStore";
import { reaccessToken } from "@/features/auth/services/authorizationService";
import type { AssignedOrder, AssignedOrderDetail, OrderFile } from "./types";

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

/**
 * One request to an Orders route, with the sign-in renewed once if it had run out.
 *
 * The access token in the cookie lasts half an hour. Someone arriving after a
 * pause still carries the expired one: the session provider renews it, but
 * only once the page is up, and this request has left by then. So a refusal
 * means "renew and ask again", not "could not load".
 */
async function ask(url: string, init?: RequestInit): Promise<Response | "signedOut" | "error"> {
  try {
    let response = await fetch(url, { ...init, cache: "no-store" });
    if (await signInRefused(response)) {
      const renewal = await renewSignIn();
      if (renewal === "over") return "signedOut";
      if (renewal === "failed") return "error";
      response = await fetch(url, { ...init, cache: "no-store" });
    }
    return response;
  } catch {
    return "error";
  }
}

async function load<T>(url: string): Promise<OrdersLoad<T>> {
  const response = await ask(url);
  if (response === "signedOut") return { status: "signedOut" };
  if (response === "error") return { status: "error" };
  // 503: the portal is not switched on for this deployment.
  if (response.status === 503) return { status: "unavailable" };
  if (response.status === 404) return { status: "notFound" };
  // 403: the Office API knows who is asking and has no translator by that account.
  if (response.status === 403) return { status: "notTranslator" };
  if (!response.ok) return { status: "error" };
  try {
    return { status: "ok", data: (await response.json()) as T };
  } catch {
    return { status: "error" };
  }
}

export const fetchAssignments = () => load<AssignedOrder[]>("/api/office/assignments");

const orderUrl = (slug: string, orderId: string | number) =>
  `/api/office/orders/${encodeURIComponent(slug)}/${encodeURIComponent(orderId)}`;

export const fetchAssignedOrder = (slug: string, orderId: string) =>
  load<AssignedOrderDetail>(orderUrl(slug, orderId));

export const fileDownloadUrl = (slug: string, orderId: number, documentId: number, fileId: string) =>
  `${orderUrl(slug, orderId)}/documents/${documentId}/files/${encodeURIComponent(fileId)}`;


// ── Files: the bureau's, to translate, and the translator's, to send back ───

export type OrderFileLoad =
  | { status: "ok"; file: File }
  | { status: "signedOut" }
  | { status: "error" };

/**
 * The bytes of one file of the order, as a `File` the document screen can take
 * as if it had been picked from disk. The route answers with a redirect to the
 * Office API, which the request follows.
 */
export async function fetchOrderFile(
  slug: string,
  orderId: number,
  documentId: number,
  file: Pick<OrderFile, "id" | "name" | "content_type">,
): Promise<OrderFileLoad> {
  const response = await ask(fileDownloadUrl(slug, orderId, documentId, file.id));
  if (response === "signedOut") return { status: "signedOut" };
  if (response === "error" || !response.ok) return { status: "error" };
  try {
    const bytes = await response.blob();
    return {
      status: "ok",
      file: new File([bytes], file.name, { type: file.content_type || bytes.type }),
    };
  } catch {
    return { status: "error" };
  }
}

export type TranslationUpload =
  | { status: "ok"; file: OrderFile }
  /** Over what the bureau's storage takes in one file. */
  | { status: "tooLarge" }
  /** The document is no longer this translator's to add to. */
  | { status: "gone" }
  | { status: "signedOut" }
  | { status: "error" };

/**
 * Add a translation to one document of the order. Two steps: this site says
 * where the file may go (a one-upload address on the Office API), then the
 * browser sends it there itself.
 */
export async function uploadTranslation(
  slug: string,
  orderId: number,
  documentId: number,
  file: File,
): Promise<TranslationUpload> {
  const ticket = await ask(`${orderUrl(slug, orderId)}/documents/${documentId}/files`, {
    method: "POST",
  });
  if (ticket === "signedOut") return { status: "signedOut" };
  if (ticket === "error" || !ticket.ok) return { status: "error" };

  try {
    const { url } = (await ticket.json()) as { url?: unknown };
    if (typeof url !== "string") return { status: "error" };
    const form = new FormData();
    form.append("file", file, file.name);
    const response = await fetch(url, { method: "POST", body: form });
    if (response.status === 413) return { status: "tooLarge" };
    if (response.status === 403 || response.status === 404) return { status: "gone" };
    if (!response.ok) return { status: "error" };
    return { status: "ok", file: (await response.json()) as OrderFile };
  } catch {
    return { status: "error" };
  }
}

export type TranslationRemoval =
  | { status: "ok" }
  /** Not this translator's to remove: the bureau's file, or someone else's. */
  | { status: "notMine" }
  | { status: "signedOut" }
  | { status: "error" };

/** Take back a translation this translator added to a document of the order. */
export async function removeTranslation(
  slug: string,
  orderId: number,
  documentId: number,
  fileId: string,
): Promise<TranslationRemoval> {
  const response = await ask(fileDownloadUrl(slug, orderId, documentId, fileId), {
    method: "DELETE",
  });
  if (response === "signedOut") return { status: "signedOut" };
  if (response === "error") return { status: "error" };
  // Already gone counts as removed: the list is read again either way.
  if (response.ok || response.status === 404) return { status: "ok" };
  if (response.status === 403) return { status: "notMine" };
  return { status: "error" };
}
