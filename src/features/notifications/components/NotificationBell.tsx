"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNow, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { describeNotification, relativeAge } from "../describe";
import { useNotificationFeed } from "../hooks/useNotificationFeed";

/** A control on the gradient bar: white, with a faint white wash on hover (as Topbar's). */
const BAR_BUTTON =
  "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md text-white transition-colors hover:bg-white/15";

/**
 * The bell for someone with Translate only (Office's own bell serves those
 * signed in to Office). A badge with the unread count, and a panel with the
 * latest entries: payments, finished batches, balance, renewals.
 * Shows nothing until the API has a feed to read.
 */
export function NotificationBell() {
  const t = useTranslations("Notifications");
  const now = useNow({ updateInterval: 60_000 });
  const { available, unread, items, error, load, markRead, markAllRead } = useNotificationFeed();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  // Closes on a click elsewhere or Escape; Escape returns focus to the bell.
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!available) return null;

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unread > 0 ? t("bellUnread", { count: unread }) : t("bell")}
        aria-expanded={open}
        aria-controls={panelId}
        className={`${BAR_BUTTON} relative size-9 pointer-coarse:size-11`}
      >
        <Bell className="size-[1.1rem]" aria-hidden />
        {unread > 0 && (
          <span
            aria-hidden
            className="bg-destructive absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full px-1 text-xs leading-4 font-semibold text-white"
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          id={panelId}
          role="region"
          aria-label={t("title")}
          className="bg-popover text-popover-foreground border-border fixed top-14 right-2 left-2 z-50 mt-1 max-h-[70vh] overflow-hidden rounded-lg border shadow-lg sm:absolute sm:top-full sm:right-0 sm:left-auto sm:w-96"
        >
          <div className="border-border flex items-center justify-between gap-3 border-b px-3 py-2">
            <h2 className="text-sm font-semibold">{t("title")}</h2>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-link cursor-pointer text-xs font-medium hover:underline"
              >
                {t("markAllRead")}
              </button>
            )}
          </div>

          <div className="max-h-[calc(70vh-2.75rem)] overflow-y-auto">
            {error ? (
              <p className="text-muted-foreground px-3 py-6 text-center text-sm">{t("loadError")}</p>
            ) : items === null ? (
              <p className="text-muted-foreground px-3 py-6 text-center text-sm">{t("loading")}</p>
            ) : items.length === 0 ? (
              <p className="text-muted-foreground px-3 py-6 text-center text-sm">{t("empty")}</p>
            ) : (
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
                          <span className="text-muted-foreground block text-xs">
                            {relativeAge(n.createdAt, now, t)}
                          </span>
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
                            if (!n.isRead) void markRead(n.id);
                            setOpen(false);
                          }}
                          className={row}
                        >
                          {body}
                        </Link>
                      ) : (
                        <button type="button" onClick={() => !n.isRead && void markRead(n.id)} className={`${row} cursor-pointer`}>
                          {body}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
