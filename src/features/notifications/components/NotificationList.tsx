"use client";

import { useNow, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { describeNotification, relativeAge } from "../describe";
import type { TranslateNotification } from "../services/notificationService";

/**
 * The entries of the Translate feed: a dot while unread, the sentence, how long
 * ago. Used by the bell's panel and by the Translate tab of the notifications
 * page. An entry with a link goes there and counts as read.
 */
export function NotificationList({
  items,
  onRead,
  onNavigate,
}: {
  items: TranslateNotification[];
  onRead: (id: string) => void;
  /** After an entry's link was followed (the bell closes its panel). */
  onNavigate?: () => void;
}) {
  const t = useTranslations("Notifications");
  const now = useNow({ updateInterval: 60_000 });

  return (
    <ul>
      {items.map((n) => {
        const body = (
          <>
            <span
              aria-hidden
              className={`mt-1.5 size-2 shrink-0 rounded-full ${n.isRead ? "bg-transparent" : "bg-suliko-default-color"}`}
            />
            <span className="min-w-0 flex-1">
              <span className={`block text-sm ${n.isRead ? "" : "font-medium"}`}>
                {n.isRead ? null : <span className="sr-only">{t("unreadMark")} </span>}
                {describeNotification(n, t)}
              </span>
              {n.createdAt && (
                <span className="text-muted-foreground block text-xs">{relativeAge(n.createdAt, now, t)}</span>
              )}
            </span>
          </>
        );
        const row = "border-border hover:bg-accent flex w-full items-start gap-2.5 border-b px-3 py-2.5 text-left last:border-b-0";
        return (
          <li key={n.id}>
            {n.link ? (
              <Link
                href={n.link}
                onClick={() => {
                  if (!n.isRead) onRead(n.id);
                  onNavigate?.();
                }}
                className={row}
              >
                {body}
              </Link>
            ) : (
              <button type="button" onClick={() => !n.isRead && onRead(n.id)} className={`${row} cursor-pointer`}>
                {body}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
