"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  FeedUnavailableError,
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type TranslateNotification,
} from "../services/notificationService";

/** How often the badge asks again while the tab is in front. There is no live push. */
const POLL_MS = 60_000;

/**
 * The person's Translate feed for the bell: the unread count (polled while the
 * tab is visible) and, once opened, the latest entries. `available` is false
 * until the API has answered once, and stays false if it has no feed.
 */
export function useNotificationFeed() {
  const [available, setAvailable] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<TranslateNotification[] | null>(null);
  const [error, setError] = useState(false);
  const off = useRef(false);

  const refreshCount = useCallback(async () => {
    if (off.current) return;
    try {
      setUnread(await getUnreadCount());
      setAvailable(true);
    } catch (e) {
      // No feed on this API: stop asking. Anything else is a blip; try again next time.
      if (e instanceof FeedUnavailableError) off.current = true;
    }
  }, []);

  useEffect(() => {
    void refreshCount();
    const tick = () => {
      if (document.visibilityState === "visible") void refreshCount();
    };
    const timer = window.setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [refreshCount]);

  const load = useCallback(async () => {
    setError(false);
    try {
      const page = await listNotifications(20, 0);
      setItems(page.items);
      setUnread(page.unread);
    } catch {
      setError(true);
    }
  }, []);

  const markRead = useCallback(async (id: string) => {
    setItems((list) => list?.map((n) => (n.id === id ? { ...n, isRead: true } : n)) ?? list);
    setUnread((n) => Math.max(0, n - 1));
    try {
      await markNotificationRead(id);
    } catch {
      void refreshCount();
    }
  }, [refreshCount]);

  const markAllRead = useCallback(async () => {
    setItems((list) => list?.map((n) => ({ ...n, isRead: true })) ?? list);
    setUnread(0);
    try {
      await markAllNotificationsRead();
    } catch {
      void refreshCount();
    }
  }, [refreshCount]);

  return { available, unread, items, error, load, markRead, markAllRead };
}
