"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { useState, type ReactNode } from "react";

import { Tabs } from "@office/shared/components/ui/tabs";

/**
 * Tabs whose selection lives in the URL (`?tab=`).
 *
 * So a link can open a specific tab ("Settings → Pricing", "Finances →
 * Payments" after recording one), a reload keeps it, and the back button
 * behaves. Plain `defaultValue` Tabs ignored every such link and always
 * opened the first tab.
 *
 * `history.replaceState` rather than a router navigation: switching tabs must
 * not refetch the page, and the App Router keeps `useSearchParams` in step
 * with it.
 */
export function UrlTabs({
  value,
  param = "tab",
  className,
  children,
}: {
  /** The tab to open with — the page reads it from its search params. */
  value: string;
  param?: string;
  className?: string;
  children: ReactNode;
}) {
  const [current, setCurrent] = useState(value);

  return (
    <Tabs
      value={current}
      onValueChange={(next) => {
        setCurrent(next);
        const url = new URL(window.location.href);
        url.searchParams.set(param, next);
        window.history.replaceState(null, "", url);
      }}
      className={className}
    >
      {children}
    </Tabs>
  );
}
