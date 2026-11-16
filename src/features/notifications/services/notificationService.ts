import { reaccessToken, useAuthStore } from "@/features/auth";
import { API_BASE_URL } from "@/shared";

/** One entry in the person's Translate feed (Api24 `api/Notification`). */
export interface TranslateNotification {
  id: string;
  kind: string;
  /** The small object the text is filled from: amounts, counts, a plan name. */
  payload: Record<string, unknown> | null;
  /** A path on this site the entry leads to, without the language. */
  link: string | null;
  createdAt: string;
  isRead: boolean;
}

export interface TranslateNotificationPage {
  items: TranslateNotification[];
  total: number;
  /** Unread across the whole feed, not just this page. */
  unread: number;
}

/** The feed is not on this API yet (or is switched off): the bell stays away. */
export class FeedUnavailableError extends Error {}

async function call(path: string, init?: RequestInit): Promise<Response> {
  const { token, refreshToken } = useAuthStore.getState();
  if (!token) throw new Error("No token found");

  const send = (bearer: string) =>
    fetch(`${API_BASE_URL}/Notification${path}`, {
      ...init,
      headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${bearer}` },
    });

  let res = await send(token);
  if (res.status === 401 && refreshToken) {
    const t = (await reaccessToken(refreshToken)) as { token: string; refreshToken: string };
    const s = useAuthStore.getState();
    s.setToken(t.token);
    s.setRefreshToken(t.refreshToken);
    res = await send(t.token);
  }
  if (res.status === 404 || res.status === 405) throw new FeedUnavailableError();
  if (!res.ok) throw new Error(`Notification request failed: ${res.status}`);
  return res;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function normalize(n: any): TranslateNotification {
  return {
    id: String(n.id),
    kind: String(n.kind ?? ""),
    payload: n.payload && typeof n.payload === "object" ? n.payload : null,
    link: typeof n.link === "string" && n.link.startsWith("/") ? n.link : null,
    createdAt: n.createdAt ?? "",
    isRead: Boolean(n.isRead),
  };
}

export async function getUnreadCount(): Promise<number> {
  const data = await (await call("/unread-count")).json();
  return Number(data?.unread ?? 0);
}

export async function listNotifications(limit = 20, offset = 0): Promise<TranslateNotificationPage> {
  const data = await (await call(`?limit=${limit}&offset=${offset}`)).json();
  return {
    items: Array.isArray(data?.items) ? data.items.map(normalize) : [],
    total: Number(data?.total ?? 0),
    unread: Number(data?.unread ?? 0),
  };
}

export async function markNotificationRead(id: string): Promise<void> {
  await call(`/${encodeURIComponent(id)}/read`, { method: "POST" });
}

export async function markAllNotificationsRead(): Promise<void> {
  await call("/read-all", { method: "POST" });
}
