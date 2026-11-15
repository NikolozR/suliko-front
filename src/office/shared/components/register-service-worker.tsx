"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { useEffect } from "react";
import { withBasePath } from "@office/shared/lib/base-path";

/** Registers /sw.js so Chrome offers to install Suliko Office as an app. */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register(withBasePath("/sw.js")).catch(() => {
      // Installing is a convenience: the site works the same without it.
    });
  }, []);
  return null;
}
