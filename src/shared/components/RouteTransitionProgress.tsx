"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import ProgressBar from "@/shared/components/ProgressBar";

declare global {
  interface Window {
    __sulikoRouteTiming?: {
      from: string;
      to: string;
      startedAt: number;
    };
  }
}

/**
 * Custom event that lets any call site announce a navigation the DOM can't see
 * — a `router.push()` from a submit handler, for example. Follows the same
 * window-event idiom the app already uses for "translations-updated".
 */
const START_EVENT = "suliko:route-progress-start";

/**
 * Announce that a client-side navigation is starting.
 *
 * Anchor clicks are picked up automatically, but App Router exposes no
 * navigation-start hook for `router.push()` / `router.replace()`, so those call
 * sites opt in explicitly to get a progress bar.
 */
export function startRouteProgress(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(START_EVENT));
}

/** Don't flash a bar for navigations that resolve near-instantly. */
const SHOW_DELAY_MS = 150;
/** Time for the fade-out after hitting 100% before we unmount. */
const FADE_OUT_MS = 260;
/**
 * Hard ceiling. A click that never produces a navigation (prevented default,
 * same-URL link, failed route) used to leave the bar parked at 90% forever —
 * this guarantees it always resolves.
 */
const MAX_DURATION_MS = 8000;

export default function RouteTransitionProgress() {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [width, setWidth] = useState(0);
  const [isAnnouncing, setIsAnnouncing] = useState(false);

  const isPendingRef = useRef(false);
  const isMountedRef = useRef(false);
  const startHrefRef = useRef<string | null>(null);
  const creepTimerRef = useRef<number | null>(null);
  const showTimerRef = useRef<number | null>(null);
  const bailoutTimerRef = useRef<number | null>(null);
  const fadeTimerRef = useRef<number | null>(null);

  const clearPendingTimers = useCallback(() => {
    if (creepTimerRef.current) window.clearInterval(creepTimerRef.current);
    if (showTimerRef.current) window.clearTimeout(showTimerRef.current);
    if (bailoutTimerRef.current) window.clearTimeout(bailoutTimerRef.current);
    creepTimerRef.current = null;
    showTimerRef.current = null;
    bailoutTimerRef.current = null;
  }, []);

  /** Run the bar to 100%, fade it out, then unmount. */
  const finish = useCallback(() => {
    if (!isPendingRef.current) return;
    isPendingRef.current = false;
    startHrefRef.current = null;
    clearPendingTimers();
    setIsAnnouncing(false);

    // Never painted (the navigation beat SHOW_DELAY_MS) — nothing to animate.
    if (!isMountedRef.current) {
      setWidth(0);
      return;
    }

    setWidth(100);
    setIsFadingOut(true);
    if (fadeTimerRef.current) window.clearTimeout(fadeTimerRef.current);
    fadeTimerRef.current = window.setTimeout(() => {
      isMountedRef.current = false;
      setIsMounted(false);
      setIsFadingOut(false);
      setWidth(0);
    }, FADE_OUT_MS);
  }, [clearPendingTimers]);

  useEffect(() => {
    const start = (toPath?: string) => {
      if (isPendingRef.current) return; // already tracking a navigation
      isPendingRef.current = true;
      startHrefRef.current = window.location.href;

      if (fadeTimerRef.current) window.clearTimeout(fadeTimerRef.current);
      clearPendingTimers();
      setIsFadingOut(false);
      setWidth(0);

      // Hold off on painting: most client navigations finish inside
      // SHOW_DELAY_MS, and a bar that appears then vanishes reads as a glitch.
      showTimerRef.current = window.setTimeout(() => {
        if (!isPendingRef.current) return;
        isMountedRef.current = true;
        setIsMounted(true);
        setIsAnnouncing(true);
        setWidth(20);
        creepTimerRef.current = window.setInterval(() => {
          setWidth((prev) => Math.min(90, prev + Math.max(2, (100 - prev) * 0.08)));
        }, 120);
      }, SHOW_DELAY_MS);

      bailoutTimerRef.current = window.setTimeout(finish, MAX_DURATION_MS);

      if (toPath) {
        window.__sulikoRouteTiming = {
          from: window.location.pathname,
          to: toPath,
          startedAt: performance.now(),
        };
      }
    };

    const onClick = (event: MouseEvent) => {
      // Modified clicks open a new tab — this document isn't navigating.
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/")) return;

      const nextPath = href.split("#")[0];
      // A bare "#anchor", or a link back to the URL we are already on, is not
      // a navigation and must not start a bar that nothing will ever finish.
      if (!nextPath) return;
      if (nextPath === window.location.pathname + window.location.search) return;

      start(nextPath);
    };

    /**
     * App Router commits `router.push()` / `router.replace()` through the
     * History API, and back/forward fire popstate. Watching both means
     * query-string-only transitions — which never change `pathname`, and so
     * used to hang the bar indefinitely — resolve correctly too.
     *
     * Deferred to a fresh task because this runs inside a monkey-patched
     * `history` method: App Router calls those from within its own render and
     * commit work, and scheduling React state updates synchronously from
     * another component's commit phase is not safe.
     */
    const onHistoryChange = () => {
      window.setTimeout(() => {
        if (isPendingRef.current) {
          if (window.location.href !== startHrefRef.current) finish();
          return;
        }
        start();
      }, 0);
    };

    const onExplicitStart = () => start();

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      const result = originalPushState.apply(this, args);
      onHistoryChange();
      return result;
    };
    window.history.replaceState = function (...args) {
      const result = originalReplaceState.apply(this, args);
      onHistoryChange();
      return result;
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onHistoryChange);
    window.addEventListener(START_EVENT, onExplicitStart);

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onHistoryChange);
      window.removeEventListener(START_EVENT, onExplicitStart);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      clearPendingTimers();
      if (fadeTimerRef.current) window.clearTimeout(fadeTimerRef.current);
    };
    // Mount-only: every mutable value this closure reads lives in a ref, so
    // re-subscribing on each pathname change would only churn listeners.
  }, [clearPendingTimers, finish]);

  // The navigation landed — usePathname is the authoritative signal.
  useEffect(() => {
    finish();
  }, [pathname, finish]);

  return (
    <>
      {/*
        The bar itself is decoration. Announcing a value that changes every
        120ms would make screen readers chatter, so this region says
        "Loading page" once instead.
      */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {isAnnouncing ? "Loading page" : ""}
      </div>

      {isMounted && (
        <div
          data-testid="route-progress"
          className={`fixed left-0 top-0 z-[120] w-full transition-opacity duration-200 ease-out ${
            isFadingOut ? "opacity-0" : "opacity-100"
          }`}
        >
          <ProgressBar
            value={width}
            size="xs"
            tone="brand"
            className="rounded-none bg-transparent"
            fillClassName="rounded-none !duration-200 shadow-[0_0_10px_1px_var(--suliko-default-color)]"
          />
        </div>
      )}
    </>
  );
}
