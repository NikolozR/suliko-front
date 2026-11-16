"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";

import { useNotificationFeed } from "../hooks/useNotificationFeed";
import { NotificationList } from "./NotificationList";

/** A control on the gradient bar: white, with a faint white wash on hover (as Topbar's). */
const BAR_BUTTON =
  "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md text-white transition-colors hover:bg-white/15";

/** Office's half of the one bell, for someone signed in to Office. */
export interface OfficeBellPart {
  /** Unread in Office's own feed. */
  unread: number;
  /** Office's notifications page (a clean address, with its language). */
  href: string;
}

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      aria-hidden
      className="bg-destructive absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full px-1 text-xs leading-4 font-semibold text-white"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

/**
 * The one bell on every screen. Its badge counts Translate's feed and, for
 * someone signed in to Office, Office's own; its panel lists the latest
 * Translate entries (payments, finished batches, balance, renewals) and links
 * to Office's page for Office's. When the API has no Translate feed it is only
 * a link to Office's page (or nothing, for someone without Office).
 */
export function NotificationBell({ office }: { office?: OfficeBellPart }) {
  const t = useTranslations("Notifications");
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

  const officeUnread = office?.unread ?? 0;

  if (!available) {
    if (!office) return null;
    // No Translate feed (yet): the bell is Office's, as it always was.
    return (
      <a
        href={office.href}
        aria-label={officeUnread > 0 ? t("bellUnread", { count: officeUnread }) : t("bell")}
        className={`${BAR_BUTTON} relative size-9 pointer-coarse:size-11`}
      >
        <Bell className="size-[1.1rem]" aria-hidden />
        <Badge count={officeUnread} />
      </a>
    );
  }

  const total = unread + officeUnread;

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={total > 0 ? t("bellUnread", { count: total }) : t("bell")}
        aria-expanded={open}
        aria-controls={panelId}
        className={`${BAR_BUTTON} relative size-9 pointer-coarse:size-11`}
      >
        <Bell className="size-[1.1rem]" aria-hidden />
        <Badge count={total} />
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

          <div className="max-h-[calc(70vh-5.5rem)] overflow-y-auto">
            {error ? (
              <p className="text-muted-foreground px-3 py-6 text-center text-sm">{t("loadError")}</p>
            ) : items === null ? (
              <p className="text-muted-foreground px-3 py-6 text-center text-sm">{t("loading")}</p>
            ) : items.length === 0 ? (
              <p className="text-muted-foreground px-3 py-6 text-center text-sm">{t("empty")}</p>
            ) : (
              <NotificationList items={items} onRead={(id) => void markRead(id)} onNavigate={() => setOpen(false)} />
            )}
          </div>

          {office && (
            <div className="border-border flex items-center justify-between gap-3 border-t px-3 py-2 text-sm">
              <a href={office.href} className="text-link font-medium hover:underline">
                {t("officeLink")}
              </a>
              {officeUnread > 0 && (
                <span className="bg-suliko-default-color rounded-full px-2 py-0.5 text-xs font-semibold text-white">
                  {t("officeUnread", { count: officeUnread })}
                </span>
              )}
              <a href={`${office.href}?source=translate`} className="text-muted-foreground hover:text-foreground text-xs hover:underline">
                {t("seeAll")}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
