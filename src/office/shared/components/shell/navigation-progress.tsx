"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@office/shared/lib/utils";
import { BASE_PATH } from "@office/shared/lib/base-path";

/** Fired by code that navigates without a link (a clickable table row). */
export const NAVIGATION_START_EVENT = "suliko:navigation-start";

export function startNavigationProgress() {
  window.dispatchEvent(new Event(NAVIGATION_START_EVENT));
}

/** Gives up after this long, so a navigation that never lands cannot leave the bar stuck. */
const GIVE_UP_MS = 20_000;

/**
 * A thin bar along the top edge while the next screen is on its way.
 *
 * The App Router gives no "navigation started" signal, so this listens for
 * clicks on same-site links instead, and treats the URL changing as arrival.
 * It covers what `loading.tsx` cannot: a click made before the link was
 * prefetched, and filter or page changes, which keep the current screen up
 * until the new one is ready.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  useEffect(() => {
    const start = () => setState("loading");

    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor || !anchor.href) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Route handlers (exports, file downloads) never change the page.
      if (url.pathname.startsWith(`${BASE_PATH}/api/`)) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }
      start();
    };

    // Capture phase: Next's <Link> calls preventDefault in its own handler.
    document.addEventListener("click", onClick, true);
    window.addEventListener(NAVIGATION_START_EVENT, start);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener(NAVIGATION_START_EVENT, start);
    };
  }, []);

  // The URL changed: the new screen has been committed.
  useEffect(() => {
    setState((current) => (current === "loading" ? "done" : current));
  }, [pathname, searchParams]);

  useEffect(() => {
    if (state === "idle") return;
    const timer = window.setTimeout(
      () => setState(state === "loading" ? "done" : "idle"),
      state === "loading" ? GIVE_UP_MS : 300,
    );
    return () => window.clearTimeout(timer);
  }, [state]);

  if (state === "idle") return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5"
    >
      <div
        className={cn(
          "h-full origin-left bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]",
          state === "loading"
            ? "animate-navProgress"
            : "scale-x-100 opacity-0 transition-opacity duration-300",
        )}
      />
    </div>
  );
}
