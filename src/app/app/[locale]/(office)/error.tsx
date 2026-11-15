"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { useEffect } from "react";

import { FatalError } from "@office/shared/components/data/fatal-error";

/**
 * Error boundary for every screen in the authenticated area.
 *
 * Without this, one screen throwing takes the whole app down to Next's default
 * "Application error" page — no navigation, no explanation, just a digest.
 * With it, the sidebar stays up and only the failing screen is replaced, so
 * the user can go somewhere that works.
 *
 * Per-segment boundaries (like `clients/error.tsx`) still win where they exist;
 * this is the catch-all behind them.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] screen failed to render", error);
  }, [error]);

  return <FatalError error={error} reset={reset} />;
}
