"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import type { ComponentProps } from "react";

import { Link, useRouter } from "@office/i18n/navigation";

/**
 * A link that repeats down a list: a row's order number or client, a row's
 * edit button, a notification, a filter tab.
 *
 * Next prefetches every `<Link>` that scrolls into view, and on a dynamic
 * route each prefetch is a server render. A page of orders fired two per row
 * at once, and the burst drew HTTP 503s (audit F05). This one waits for a
 * sign of intent instead: it prefetches when the pointer rests on it or it
 * takes keyboard focus. Single links (the sidebar, a page's main buttons)
 * keep the default.
 */
export function RowLink({ href, onMouseEnter, onFocus, ...props }: ComponentProps<typeof Link>) {
  const router = useRouter();
  const warm = () => {
    if (typeof href === "string") router.prefetch(href);
  };

  return (
    <Link
      {...props}
      href={href}
      prefetch={false}
      onMouseEnter={(event) => {
        warm();
        onMouseEnter?.(event);
      }}
      onFocus={(event) => {
        warm();
        onFocus?.(event);
      }}
    />
  );
}
