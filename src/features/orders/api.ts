import { useAuthStore } from "@/features/auth/store/authStore";
import { reaccessToken } from "@/features/auth/services/authorizationService";
import type { NameTranslationItem } from "@/features/translation/types/types.Translation";
import type { AssignedOrder, AssignedOrderDetail, OrderTranslation } from "./types";

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

// ── Suliko Translate on a file the bureau sent ──────────────────────────────

/** What the translator may tell Suliko before it translates. Both are optional. */
export type TranslationRequest = {
  /** Free-text notes: terms, tone, what to leave as it is. */
  instructions: string;
  /** Spellings fixed for names, so the model does not choose its own. */
  names: NameTranslationItem[];
};

export type TranslationStart =
  | { status: "started"; translation: OrderTranslation }
  /** The balance does not cover the file. Nothing was charged. */
  | { status: "insufficientBalance"; pages: number | null; balance: string | null }
  | { status: "unsupportedFile" }
  | { status: "tooLarge" }
  | { status: "languageNotAvailable" }
  /** The bureau pressed the same button first; its result will appear here. */
  | { status: "alreadyTranslating" }
  | { status: "signedOut" }
  | { status: "error" };

/** The Office API's error code: the last part of a problem document's `type`. */
function problemCode(body: unknown): string {
  const type = (body as { type?: unknown } | null)?.type;
  return typeof type === "string" ? type.slice(type.lastIndexOf("/") + 1) : "";
}

export async function startTranslation(
  slug: string,
  orderId: number,
  documentId: number,
  fileId: string,
  request: TranslationRequest,
): Promise<TranslationStart> {
  const response = await ask(`${fileDownloadUrl(slug, orderId, documentId, fileId)}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instructions: request.instructions.trim() || null,
      names: request.names.filter((name) => name.original.trim() && name.translation.trim()),
    }),
  });
  if (response === "signedOut") return { status: "signedOut" };
  if (response === "error") return { status: "error" };

  const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (response.ok && body) return { status: "started", translation: body as OrderTranslation };

  const code = problemCode(body);
  if (response.status === 402 || code === "insufficient_balance") {
    return {
      status: "insufficientBalance",
      pages: typeof body?.pages === "number" ? body.pages : null,
      balance: typeof body?.balance === "string" ? body.balance : null,
    };
  }
  if (response.status === 413) return { status: "tooLarge" };
  if (code === "unsupported_file") return { status: "unsupportedFile" };
  if (code === "language_not_available") return { status: "languageNotAvailable" };
  if (response.status === 409) return { status: "alreadyTranslating" };
  return { status: "error" };
}

/** This translator's jobs on one document. Asking is what files a finished one. */
export const fetchTranslations = (slug: string, orderId: number, documentId: number) =>
  load<OrderTranslation[]>(`${orderUrl(slug, orderId)}/documents/${documentId}/translations`);
