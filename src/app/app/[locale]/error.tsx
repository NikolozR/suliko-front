"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { useEffect } from "react";

import { FatalError } from "@office/shared/components/data/fatal-error";

/**
 * Error boundary for the locale segment.
 *
 * This is the one that catches a throw from the `(app)` *layout* itself — most
 * importantly the session lookup, which is the first API call every
 * authenticated page makes. When the API is unreachable, that call throws a
 * `TypeError` rather than an `ApiError`, so `getSession` cannot tell it apart
 * from a bug and rightly rethrows. Before this file existed, the result was a
 * blank page on every route in the app at once.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[locale] layout failed to render", error);
  }, [error]);

  return <FatalError error={error} reset={reset} />;
}
