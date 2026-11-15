// Owned by suliko-front (clean addresses): see navigation.ts.

declare global {
  interface Window {
    __sulikoLocal?: string[];
  }
}

const LOCALES = ["ka", "en"];

/**
 * Office modules whose code has moved into this app (pages in
 * src/app/app/[locale]/(office) and (editor)). Add one per move.
 */
export const MOVED_MODULES = [
  "calculator", "clients", "notaries", "translators", "finances", "reports", "settings",
  "billing", "users", "dashboard", "notifications", "account", "translations",
] as const;

/**
 * The moved modules this deployment serves: those of MOVED_MODULES that
 * OFFICE_LOCAL_MODULES switches on. A name in the variable whose code has not
 * moved yet is ignored, so the variable can hold the final list from the start.
 * Server only (the browser reads window.__sulikoLocal, written from this).
 */
export function enabledLocalModules(): string[] {
  const listed = new Set(
    (process.env.OFFICE_LOCAL_MODULES ?? "")
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean),
  );
  return MOVED_MODULES.filter((m) => listed.has(m));
}

export function localModules(): string[] {
  if (typeof window !== "undefined") return window.__sulikoLocal ?? [];
  return enabledLocalModules();
}

/** "/clients/2?x=1" (or an already prefixed path) -> "/ka/clients/2?x=1" or "/app/ka/...". */
/**
 * Modules whose clean address is not their name. Office calls the bureau's
 * orders "translations" (its folder, its links); on suliko.ge that word is
 * Translate's results (/ka/translations/<id>), so orders are /ka/orders.
 */
export const CLEAN_NAMES: Record<string, string> = { translations: "orders" };
const MODULE_OF_CLEAN: Record<string, string> = Object.fromEntries(
  Object.entries(CLEAN_NAMES).map(([module, clean]) => [clean, module]),
);

export function officePath(href: string, locale: string): string {
  if (!href.startsWith("/")) return href; // absolute URL, mailto:, #anchor, relative
  // Already prefixed (a pathname read back from the address bar): take it apart.
  const prefixed = /^\/(?:app\/)?(ka|en)(?=\/|\?|#|$)/.exec(href);
  if (prefixed) {
    locale = prefixed[1];
    href = href.slice(prefixed[0].length) || "/";
  }
  const lang = LOCALES.includes(locale) ? locale : "ka";
  let name = href.split(/[/?#]/)[1] ?? "";
  // Read back from a clean address: /orders/12 is the module "translations".
  if (prefixed && !href.startsWith("/app") && MODULE_OF_CLEAN[name]) {
    href = `/${MODULE_OF_CLEAN[name]}${href.slice(name.length + 1)}`;
    name = MODULE_OF_CLEAN[name];
  }
  const tail = href === "/" ? "" : href;
  if (name && localModules().includes(name)) {
    const clean = CLEAN_NAMES[name];
    return `/${lang}${clean ? `/${clean}${tail.slice(name.length + 1)}` : tail}`;
  }
  return `/app/${lang}${tail}`;
}
