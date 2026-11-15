"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * Theme provider. `class` strategy puts `.dark` on <html>, which is what
 * globals.css keys off (`@custom-variant dark (&:is(.dark *))`).
 *
 * `disableTransitionOnChange` prevents every transition in the app firing at
 * once when the theme flips. The sidebar has its own belt-and-braces fix in
 * globals.css (`transition: none !important`) for the same reason.
 */
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
