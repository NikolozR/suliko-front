import type { AssignedOrder, AssignedOrderDetail } from "./types";

export type OrdersLoad<T> =
  | { status: "ok"; data: T }
  | { status: "unavailable" }
  | { status: "notFound" }
  /** Signed in, but no bureau works with this account as a translator. */
  | { status: "notTranslator" }
  | { status: "error" };

async function load<T>(url: string): Promise<OrdersLoad<T>> {
  try {
    const response = await fetch(url, { cache: "no-store" });
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
