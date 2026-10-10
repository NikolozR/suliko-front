import type { AssignedOrder, AssignedOrderDetail, PortalMe } from "./types";

export type OrdersLoad<T> =
  | { status: "ok"; data: T }
  | { status: "unavailable" }
  | { status: "notFound" }
  | { status: "error" };

async function load<T>(url: string): Promise<OrdersLoad<T>> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    // 503: the portal is not switched on for this deployment.
    if (response.status === 503) return { status: "unavailable" };
    if (response.status === 404) return { status: "notFound" };
    if (!response.ok) return { status: "error" };
    return { status: "ok", data: (await response.json()) as T };
  } catch {
    return { status: "error" };
  }
}

export const fetchPortalMe = () => load<PortalMe>("/api/office/me");

export const fetchAssignments = () => load<AssignedOrder[]>("/api/office/assignments");

export const fetchAssignedOrder = (slug: string, orderId: string) =>
  load<AssignedOrderDetail>(
    `/api/office/orders/${encodeURIComponent(slug)}/${encodeURIComponent(orderId)}`
  );

export const fileDownloadUrl = (slug: string, orderId: number, documentId: number, fileId: string) =>
  `/api/office/orders/${encodeURIComponent(slug)}/${orderId}/documents/${documentId}/files/${encodeURIComponent(fileId)}`;
