// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { defineRouting } from "next-intl/routing";

/**
 * Suliko Office is Georgian-first: client names, document types and notary names are
 * all Mkhedruli. `ka` is the default locale, and `<html lang="ka">` is what
 * activates the Georgian line-height fixes in globals.css. The browser's
 * language is not consulted: a visitor with an English browser still lands on
 * Georgian, and switches to English from the menu.
 */
export const routing = defineRouting({
  locales: ["ka", "en", "hy"],
  defaultLocale: "ka",
  // Under suliko.ge Office's pages are /app/ka/..., /app/en/...: the prefix
  // carries the /app, so Link and redirect produce full addresses.
  localePrefix: { mode: "always", prefixes: { ka: "/app/ka", en: "/app/en", hy: "/app/hy" } },
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
