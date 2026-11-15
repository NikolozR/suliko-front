// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import "server-only";

import { cache } from "react";

import { DIRECTORY_PAGE_SIZE } from "@office/features/directory/types";
import type { OrderDetail, OrderPage } from "@office/features/orders/types";
import { api } from "@office/shared/lib/api";

/**
 * Orders — `api/v1/orders.py`.
 */

export interface OrderListParams {
  search?: string;
  clientType?: "B2B" | "B2C";
  status?: string;
  language?: string;
  clientId?: number;
  translatorId?: number;
  documentTypeId?: number;
  dateFrom?: string;
  dateTo?: string;
  /** Past due and still open, in the bureau's timezone. */
  overdue?: boolean;
  dueToday?: boolean;
  /** Something still owed, on an order that counts. */
  unpaid?: boolean;
  /** Created by the signed-in user. */
  mine?: boolean;
  sort?: "date" | "-date" | "id" | "-id" | "due" | "-due";
  limit?: number;
  offset?: number;
}

export function orderListQuery(params: OrderListParams = {}): URLSearchParams {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.clientType) query.set("client_type", params.clientType);
  if (params.status) query.set("status", params.status);
  if (params.language) query.set("language", params.language);
  if (params.clientId) query.set("client_id", String(params.clientId));
  if (params.translatorId) query.set("translator_id", String(params.translatorId));
  if (params.documentTypeId) query.set("document_type_id", String(params.documentTypeId));
  if (params.dateFrom) query.set("date_from", params.dateFrom);
  if (params.dateTo) query.set("date_to", params.dateTo);
  if (params.overdue) query.set("overdue", "true");
  if (params.dueToday) query.set("due_today", "true");
  if (params.unpaid) query.set("unpaid", "true");
  if (params.mine) query.set("mine", "true");
  query.set("sort", params.sort ?? "-id");
  query.set("limit", String(params.limit ?? DIRECTORY_PAGE_SIZE));
  query.set("offset", String(params.offset ?? 0));
  return query;
}

export async function listOrders(params: OrderListParams = {}): Promise<OrderPage> {
  return api<OrderPage>(`/api/v1/orders?${orderListQuery(params)}`);
}

/**
 * One request per page view: the page and its tab title (`pageTitle`) both
 * ask, and React's cache answers the second from the first.
 */
export const getOrder = cache(async (id: number): Promise<OrderDetail> => {
  return api<OrderDetail>(`/api/v1/orders/${id}`);
});

export async function createOrder(body: unknown): Promise<OrderDetail> {
  return api<OrderDetail>("/api/v1/orders", { method: "POST", body });
}

export interface OrderSaveBody {
  header?: Record<string, unknown>;
  add?: unknown[];
  update?: ({ id: number } & Record<string, unknown>)[];
  remove?: number[];
}

/** The edit screen's save: header and documents in one transaction. */
export async function saveOrder(
  id: number,
  body: OrderSaveBody,
): Promise<{ order: OrderDetail; added_document_ids: number[] }> {
  return api(`/api/v1/orders/${id}/save`, { method: "POST", body });
}

export async function deleteOrder(id: number): Promise<void> {
  await api<void>(`/api/v1/orders/${id}`, { method: "DELETE" });
}

export async function addOrderDocument(orderId: number, body: unknown): Promise<OrderDetail> {
  return api<OrderDetail>(`/api/v1/orders/${orderId}/documents`, { method: "POST", body });
}

export async function updateOrderDocument(
  orderId: number,
  documentId: number,
  body: unknown,
): Promise<OrderDetail> {
  return api<OrderDetail>(`/api/v1/orders/${orderId}/documents/${documentId}`, {
    method: "PATCH",
    body,
  });
}

export async function deleteOrderDocument(
  orderId: number,
  documentId: number,
): Promise<OrderDetail> {
  return api<OrderDetail>(`/api/v1/orders/${orderId}/documents/${documentId}`, {
    method: "DELETE",
  });
}

export async function changeOrderStatus(id: number, status: string): Promise<OrderDetail> {
  return api<OrderDetail>(`/api/v1/orders/${id}/status`, {
    method: "POST",
    body: { status },
  });
}
