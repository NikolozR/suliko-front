// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import "server-only";

import type { PageMeta } from "@office/features/directory/types";
import { api } from "@office/shared/lib/api";

/**
 * The bell, mirroring `api/v1/notifications.py`.
 *
 * Every endpoint is scoped server-side to the signed-in user. There is no
 * parameter for "whose feed" — you can only ever read your own.
 */

export type NotificationKind =
  | "comment"
  | "mention"
  | "status_change"
  | "payment"
  | "order_created"
  | "system";

export type NotificationTab = "all" | "unread" | "mentions";

export const NOTIFICATION_TABS: NotificationTab[] = ["all", "unread", "mentions"];

export interface Notification {
  id: number;
  kind: NotificationKind;
  body: string;
  actor_user_id: number | null;
  actor_name: string | null;
  order_id: number | null;
  comment_id: number | null;
  subject_label: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationPage {
  items: Notification[];
  meta: PageMeta;
  /** Unread across the whole feed — the bell badge, not this page's count. */
  unread: number;
}

export async function listNotifications(
  params: { tab?: NotificationTab; limit?: number; offset?: number } = {},
): Promise<NotificationPage> {
  const query = new URLSearchParams();
  query.set("tab", params.tab ?? "all");
  query.set("limit", String(params.limit ?? 30));
  query.set("offset", String(params.offset ?? 0));
  return api<NotificationPage>(`/api/v1/notifications?${query}`);
}

export async function getUnreadCount(): Promise<number> {
  const { unread } = await api<{ unread: number }>("/api/v1/notifications/unread-count");
  return unread;
}

export async function markAllRead(): Promise<{ marked: number; unread: number }> {
  return api<{ marked: number; unread: number }>("/api/v1/notifications/read-all", {
    method: "POST",
  });
}

export async function markRead(id: number): Promise<Notification> {
  return api<Notification>(`/api/v1/notifications/${id}/read`, { method: "POST" });
}

// ── Order comments ──────────────────────────────────────────────────────────

export interface OrderComment {
  id: number;
  order_id: number;
  author_user_id: number | null;
  author_name: string;
  body: string;
  is_pinned: boolean;
  mentions: string[];
  created_at: string;
}

export async function listComments(orderId: number): Promise<OrderComment[]> {
  return api<OrderComment[]>(`/api/v1/orders/${orderId}/comments`);
}

/** A colleague the note box offers after "@": `MentionablePerson` in the API. */
export interface MentionablePerson {
  /** What goes after the "@" so the mention resolves to exactly this person. */
  handle: string;
  full_name: string;
  position: string | null;
}

export async function listMentionablePeople(orderId: number): Promise<MentionablePerson[]> {
  return api<MentionablePerson[]>(`/api/v1/orders/${orderId}/comments/people`);
}

export async function createComment(
  orderId: number,
  body: { body: string; is_pinned?: boolean },
): Promise<OrderComment> {
  return api<OrderComment>(`/api/v1/orders/${orderId}/comments`, { method: "POST", body });
}

export async function setCommentPinned(
  orderId: number,
  commentId: number,
  isPinned: boolean,
): Promise<OrderComment> {
  return api<OrderComment>(`/api/v1/orders/${orderId}/comments/${commentId}`, {
    method: "PATCH",
    body: { is_pinned: isPinned },
  });
}

export async function deleteComment(orderId: number, commentId: number): Promise<void> {
  return api<void>(`/api/v1/orders/${orderId}/comments/${commentId}`, { method: "DELETE" });
}
