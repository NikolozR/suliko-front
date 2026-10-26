"use client";

import { useEffect } from "react";

/** Registers /sw.js so Chrome offers to install Suliko as an app. */
export default function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Installing is a convenience: the site works the same without it.
    });
  }, []);
  return null;
}
