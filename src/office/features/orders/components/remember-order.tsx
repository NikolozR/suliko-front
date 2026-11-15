"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { useEffect } from "react";

import { rememberOrder } from "@office/shared/lib/recent-orders";

/**
 * Notes that this order was opened, so the quick search (Ctrl+K) can offer
 * it again before anything is typed. Renders nothing.
 */
export function RememberOrder({
  scope,
  id,
  number,
  clientName,
}: {
  /** The organisation's slug: the list is kept per organisation. */
  scope: string;
  id: number;
  number: number;
  clientName: string;
}) {
  useEffect(() => {
    rememberOrder(scope, { id, number, clientName });
  }, [scope, id, number, clientName]);

  return null;
}
