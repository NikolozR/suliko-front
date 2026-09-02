"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarDays, X, ArrowRight } from "lucide-react";
import { Button } from "@/features/ui";
import { BOOK_DEMO_URL } from "@/shared/constants/booking";

/** Remembers a dismissal so the panel never auto-opens at the same person twice. */
const DISMISSED_KEY = "suliko:demo-bubble-dismissed";

/** Kept clear of the hero, which carries its own demo link. */
const REVEAL_AFTER_PX = 250;

/** Bounded fallback for scroll positions that arrive without a scroll event. */
const REVEAL_POLL_MS = 400;
const REVEAL_POLL_TICKS = 15;

/** Breathing room between the head appearing and the panel popping open. */
const AUTO_OPEN_DELAY_MS = 500;

export default function BookDemoBubble() {
  const t = useTranslations("DemoBubble");
  const [isRevealed, setIsRevealed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true); // assume dismissed until storage says otherwise
  const hasAutoOpened = useRef(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const headRef = useRef<HTMLButtonElement | null>(null);

  // Storage can throw in private mode / when site data is blocked — never let that
  // break the page, just fall back to showing the bubble.
  useEffect(() => {
    try {
      setIsDismissed(window.localStorage.getItem(DISMISSED_KEY) === "1");
    } catch {
      setIsDismissed(false);
    }
  }, []);

  useEffect(() => {
    if (isDismissed) return;

    let poll = 0;

    const stop = () => {
      window.removeEventListener("scroll", check);
      window.clearInterval(poll);
    };

    function check() {
      if (window.scrollY <= REVEAL_AFTER_PX) return;
      setIsRevealed(true);
      stop();
    }

    // The scroll listener covers ordinary reading. The poll covers the cases that
    // never fire one: a #hash landing (which only jumps once the deferred sections
    // below the hero have rendered) and the browser restoring a scroll position.
    // It gives up on its own so an unscrolled page isn't polled forever.
    check();
    let ticks = 0;
    poll = window.setInterval(() => {
      check();
      if (++ticks >= REVEAL_POLL_TICKS) window.clearInterval(poll);
    }, REVEAL_POLL_MS);
    window.addEventListener("scroll", check, { passive: true });

    return stop;
  }, [isDismissed]);

  // Pop the panel open once, unprompted — then leave the head for manual reopen.
  useEffect(() => {
    if (!isRevealed || isDismissed || hasAutoOpened.current) return;
    hasAutoOpened.current = true;
    const timer = window.setTimeout(() => setIsOpen(true), AUTO_OPEN_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [isRevealed, isDismissed]);

  const dismiss = useCallback(() => {
    setIsOpen(false);
    setIsDismissed(true);
    try {
      window.localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // A dismissal we can't persist still holds for this page view.
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        headRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  if (isDismissed || !isRevealed) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-3 print:hidden">
      {isOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-labelledby="book-demo-bubble-title"
          className="w-[calc(100vw-3rem)] max-w-[320px] rounded-2xl border border-border bg-background p-4 shadow-xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200"
        >
          <div className="flex items-start justify-between gap-3">
            <p
              id="book-demo-bubble-title"
              className="text-sm font-semibold leading-snug text-foreground"
            >
              {t("title")}
            </p>
            <button
              type="button"
              onClick={dismiss}
              aria-label={t("closeLabel")}
              className="-mr-1 -mt-1 shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {t("body")}
          </p>

          <Button
            size="sm"
            className="group mt-3 w-full"
            onClick={() => window.open(BOOK_DEMO_URL, "_blank", "noopener,noreferrer")}
            type="button"
          >
            <span className="flex items-center gap-1.5">
              {t("cta")}
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </Button>
        </div>
      )}

      <button
        ref={headRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-label={t("openLabel")}
        className="flex h-[56px] w-[56px] items-center justify-center rounded-full bg-suliko-default-color text-white shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-50"
      >
        {isOpen ? (
          <X className="h-[22px] w-[22px]" aria-hidden="true" />
        ) : (
          <CalendarDays className="h-[24px] w-[24px]" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
