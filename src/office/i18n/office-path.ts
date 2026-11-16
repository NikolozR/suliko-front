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
  "service-pages", "website-translations", "admin", "platform",
  // Sign-in screens (PUBLIC_MODULES) and the first-run screens.
  "login", "choose-account", "signup", "two-factor", "forgot-password", "reset-password",
  "verify-email", "accept-invite", "onboarding", "welcome",
] as const;

/** Office's screens reachable without a session (its middleware's PUBLIC_PATHS). */
export const PUBLIC_MODULES: readonly string[] = [
  "login", "choose-account", "signup", "two-factor", "forgot-password", "reset-password",
  "verify-email", "accept-invite",
];

/**
 * The Office modules this app serves at clean addresses: all of them.
 * Server only (the browser reads window.__sulikoLocal, written from this).
 */
export function enabledLocalModules(): string[] {
  // Every Office module has moved and is served here: the OFFICE_LOCAL_MODULES
  // switch of the move is gone with the Office deployment.
  return [...MOVED_MODULES];
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
export const CLEAN_NAMES: Record<string, string> = {
  translations: "orders",
  // Office's platform console (workspaces, platform billing). /ka/admin is
  // Translate's admin (blog, templates, promo codes): Office's sits inside it.
  admin: "admin/workspaces",
};

/**
 * The module a clean address belongs to, and its clean prefix: "orders/12" ->
 * translations, "admin/workspaces/billing" -> admin. Null for anything else.
 */
export function moduleOfClean(path: string): { module: string; clean: string } | null {
  for (const [module, clean] of Object.entries(CLEAN_NAMES)) {
    if (path === clean || path.startsWith(`${clean}/`) || path.startsWith(`${clean}?`) || path.startsWith(`${clean}#`)) {
      return { module, clean };
    }
  }
  return null;
}

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
  // Read back from a clean address: /orders/12 is the module "translations",
  // /admin/workspaces/billing the module "admin".
  const read = prefixed && !href.startsWith("/app") ? moduleOfClean(href.slice(1)) : null;
  if (read) {
    href = `/${read.module}${href.slice(read.clean.length + 1)}`;
    name = read.module;
  }
  const tail = href === "/" ? "" : href;
  if (name && localModules().includes(name)) {
    const clean = CLEAN_NAMES[name];
    return `/${lang}${clean ? `/${clean}${tail.slice(name.length + 1)}` : tail}`;
  }
  return `/app/${lang}${tail}`;
}
