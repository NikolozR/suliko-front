"use client";

import { useEffect } from "react";

const SITE_NAME = "Suliko";
const DEFAULT_TITLE = "Suliko — AI-Powered Document Translation";

/**
 * Sets the browser tab title from a client component and restores the
 * previous title on unmount. Pass the page-specific part only — the
 * "| Suliko" suffix is appended automatically to match the app's
 * `%s | Suliko` metadata template. Pass a falsy value to fall back to
 * the default site title (useful while data is still loading).
 */
export function useDocumentTitle(title: string | null | undefined) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
