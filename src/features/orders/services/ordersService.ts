import { useAuthStore } from "@/features/auth/store/authStore";
import { reaccessToken } from "@/features/auth/services/authorizationService";
import type {
  AssignedOrder,
  AssignedOrderDetail,
  FileKind,
  FileTarget,
  OrderFile,
  PersonalFile,
  PersonalOrderDetail,
  PersonalOrderInput,
  PersonalOrderSummary,
  PortalMe,
} from "../types/types.Orders";

/**
 * The Orders tab talks to the bureau CRM through suliko.ge's own server
 * (`/api/crm/*`), which verifies the suliko.ge login and signs the request.
 * Files are the exception: the server hands out a short-lived URL and the
 * browser uploads or downloads straight from the CRM.
 */

export class OrdersApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "OrdersApiError";
  }
}

async function readError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as { detail?: unknown } | null;
  return typeof body?.detail === "string" ? body.detail : `Request failed (${response.status})`;
}

/** fetch with the suliko.ge token, refreshing it once if it has expired. */
export async function authorizedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const send = (token: string | null) => {
    const headers = new Headers(init.headers);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return fetch(input, { ...init, headers, cache: "no-store" });
  };

  const { token, refreshToken } = useAuthStore.getState();
  let response = await send(token);

  if (response.status === 401 && refreshToken) {
    try {
      const fresh = (await reaccessToken(refreshToken)) as { token: string; refreshToken: string };
      const { setToken, setRefreshToken } = useAuthStore.getState();
      setToken(fresh.token);
      setRefreshToken(fresh.refreshToken);
      response = await send(fresh.token);
    } catch {
      // Leave the 401 for the caller to show; signing out is not ours to decide.
    }
  }
  return response;
}

export async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await authorizedFetch(url, init);
  if (!response.ok) throw new OrdersApiError(response.status, await readError(response));
  return (response.status === 204 ? undefined : await response.json()) as T;
}

const portal = <T>(path: string, init?: RequestInit) => requestJson<T>(`/api/crm/portal${path}`, init);

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const getPortalMe = () => portal<PortalMe>("/me");

export const getAssignments = () => portal<AssignedOrder[]>("/assignments");

export const getAssignedOrder = (slug: string, orderId: number) =>
  portal<AssignedOrderDetail>(`/organizations/${encodeURIComponent(slug)}/orders/${orderId}`);

export const getPersonalOrders = () => portal<PersonalOrderSummary[]>("/personal-orders");

export const getPersonalOrder = (orderId: number) =>
  portal<PersonalOrderDetail>(`/personal-orders/${orderId}`);

export const createPersonalOrder = (input: PersonalOrderInput) =>
  portal<PersonalOrderDetail>("/personal-orders", json("POST", input));

export const updatePersonalOrder = (orderId: number, input: Partial<PersonalOrderInput>) =>
  portal<PersonalOrderDetail>(`/personal-orders/${orderId}`, json("PATCH", input));

export const deletePersonalOrder = (orderId: number) =>
  portal<void>(`/personal-orders/${orderId}`, { method: "DELETE" });

// ── Files ───────────────────────────────────────────────────────────────────

function filesPath(target: FileTarget): string {
  return target.type === "assigned"
    ? `/portal/organizations/${target.slug}/orders/${target.orderId}/documents/${target.documentId}/files`
    : `/portal/personal-orders/${target.orderId}/files`;
}

async function ticketUrl(
  method: "GET" | "POST",
  path: string,
  query?: Record<string, string>,
): Promise<string> {
  const { url } = await requestJson<{ url: string }>(
    "/api/crm/file-ticket",
    json("POST", { method, path, query }),
  );
  return url;
}

/**
 * Upload one file. For a bureau's order it is always a translation — source
 * files come from the bureau; for a personal order `kind` picks the side.
 */
export async function uploadOrderFile(target: FileTarget, file: File, kind: FileKind) {
  const url = await ticketUrl(
    "POST",
    filesPath(target),
    target.type === "personal" ? { kind } : undefined,
  );
  const form = new FormData();
  form.append("file", file);

  // Straight to the CRM: a document scan does not fit through a Vercel function.
  const response = await fetch(url, { method: "POST", body: form });
  if (!response.ok) throw new OrdersApiError(response.status, await readError(response));
  return (await response.json()) as OrderFile | PersonalFile;
}

/** A file's bytes in the browser — for handing a source document to Suliko's translator. */
export async function fetchOrderFile(target: FileTarget, fileId: string | number, name: string) {
  const url = await ticketUrl("GET", `${filesPath(target)}/${fileId}`);
  const response = await fetch(url);
  if (!response.ok) throw new OrdersApiError(response.status, await readError(response));
  const blob = await response.blob();
  return new File([blob], name, { type: blob.type || "application/octet-stream" });
}

/** Start a download. The CRM answers with `Content-Disposition: attachment`. */
export async function downloadOrderFile(target: FileTarget, fileId: string | number) {
  const url = await ticketUrl("GET", `${filesPath(target)}/${fileId}`);
  const link = document.createElement("a");
  link.href = url;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export const deleteOrderFile = (target: FileTarget, fileId: string | number) =>
  portal<void>(`${filesPath(target).replace(/^\/portal/, "")}/${fileId}`, { method: "DELETE" });
