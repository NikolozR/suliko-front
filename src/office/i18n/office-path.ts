// Owned by suliko-front (clean addresses): see navigation.ts.

declare global {
  interface Window {
    __sulikoLocal?: string[];
  }
}

const LOCALES = ["ka", "en"];

export function localModules(): string[] {
  if (typeof window !== "undefined") return window.__sulikoLocal ?? [];
  return (process.env.OFFICE_LOCAL_MODULES ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
}

/** "/clients/2?x=1" (or an already prefixed path) -> "/ka/clients/2?x=1" or "/app/ka/...". */
export function officePath(href: string, locale: string): string {
  if (!href.startsWith("/")) return href; // absolute URL, mailto:, #anchor, relative
  // Already prefixed (a pathname read back from the address bar): take it apart.
  const prefixed = /^\/(?:app\/)?(ka|en)(?=\/|\?|#|$)/.exec(href);
  if (prefixed) {
    locale = prefixed[1];
    href = href.slice(prefixed[0].length) || "/";
  }
  const lang = LOCALES.includes(locale) ? locale : "ka";
  const name = href.split(/[/?#]/)[1] ?? "";
  const tail = href === "/" ? "" : href;
  return name && localModules().includes(name) ? `/${lang}${tail}` : `/app/${lang}${tail}`;
}
