import { NextRequest, NextResponse } from "next/server";

import { CLEAN_NAMES } from "./office/i18n/office-path";

/**
 * Suliko Office's addresses on this site (/app/...), during phase 3 of making
 * Suliko Translate and Suliko Office one system: its modules move into this app
 * one by one (scripts/sync-office.mjs).
 *
 * A module this app has code for answers here only when it is listed in
 * OFFICE_LOCAL_MODULES (comma-separated, e.g. "calculator"); unlisted, it is
 * passed on to the Office deployment like every module that has not moved, so
 * a move goes live, and can be undone, with one environment variable.
 */

/** Modules whose pages are in src/app/app/[locale]/(office). Add one per move. */
const MOVED_MODULES = ["calculator", "clients", "notaries", "translators", "finances", "reports", "settings", "billing", "users", "dashboard", "notifications", "account", "translations"] as const;

const OFFICE_LOCALES = ["ka", "en"];
const SESSION_COOKIE = "suliko_session";

function enabledModules(): Set<string> {
  return new Set(
    (process.env.OFFICE_LOCAL_MODULES ?? "")
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean),
  );
}

/** /app/ka/calculator/x -> { locale: "ka", module: "calculator" } */
function parse(pathname: string): { locale: string | null; module: string | null } {
  const [, , locale, module] = pathname.split("/");
  return OFFICE_LOCALES.includes(locale) ? { locale, module: module ?? null } : { locale: null, module: null };
}

export function isOfficePath(pathname: string): boolean {
  return pathname === "/app" || pathname.startsWith("/app/");
}

/**
 * Office's content security policy, the same as on its own deployment
 * (app.suliko.ge middleware.ts), with a fresh nonce per request.
 */
function buildCsp(nonce: string, isDev: boolean): string {
  const apiOrigin = process.env.NEXT_PUBLIC_OFFICE_API_ORIGIN ?? "";
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `frame-src 'self' blob:`,
    `font-src 'self' data:`,
    `connect-src 'self' ${apiOrigin}`.trim(),
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `worker-src 'self'`,
    `manifest-src 'self'`,
    `object-src 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");
}

/** /ka/clients/2 -> { locale: "ka", module: "clients" }; also pl, which Office lacks. */
/** Clean address segment -> Office module: "orders" -> "translations". */
const MODULE_OF_CLEAN: Record<string, string> = Object.fromEntries(
  Object.entries(CLEAN_NAMES).map(([module, clean]) => [clean, module]),
);
/** Office module -> its clean segment: "translations" -> "orders", else itself. */
const cleanName = (module: string) => CLEAN_NAMES[module] ?? module;

/** /ka/clients/2 -> { locale: "ka", module: "clients" }; /ka/orders -> "translations". Also pl. */
function parseClean(pathname: string): { locale: string | null; module: string | null } {
  const [, locale, segment] = pathname.split("/");
  if (!["ka", "en", "pl"].includes(locale)) return { locale: null, module: null };
  // An Office module's own name is no clean address when it has another one:
  // /ka/translations/<id> is Translate's result page.
  if (segment && CLEAN_NAMES[segment]) return { locale, module: null };
  return { locale, module: segment ? (MODULE_OF_CLEAN[segment] ?? segment) : null };
}

/**
 * Translate's bureau assignments were /{locale}/orders until Office's orders
 * took that address; they are /{locale}/assignments now. An old assignment
 * address has a bureau's slug after /orders (/ka/orders/demo-bureau/117), an
 * Office order a number or "new".
 */
function oldAssignmentPath(pathname: string): string | null {
  const m = /^\/(ka|en|pl)\/orders\/([^/]+)(\/.*)?$/.exec(pathname);
  if (!m || /^\d+$/.test(m[2]) || m[2] === "new") return null;
  return `/${m[1]}/assignments/${m[2]}${m[3] ?? ""}`;
}

/** Whether this request might be an Office address: /app/..., or /{locale}/{moved module}. */
export function isOfficeRequest(pathname: string): boolean {
  if (isOfficePath(pathname)) return true;
  const { module } = parseClean(pathname);
  return module !== null && (MOVED_MODULES as readonly string[]).includes(module);
}

/**
 * Office's addresses on this site.
 *
 * A moved, switched-on module has a clean address, /ka/clients: served here by
 * an internal rewrite to its pages (src/app/app/[locale]/(office)), with what
 * Office's own middleware does (CSP with nonce, sign-in gate, Office's messages).
 * Its old address /app/ka/clients redirects there (bookmarks, emails, links in
 * pages still on the Office deployment).
 *
 * A moved module not switched on, and every module not moved, stays at
 * /app/... on the Office deployment.
 *
 * Returns the response, or null to let the request go on (to this site's
 * fallback rewrite, which passes /app/... to the Office deployment).
 */
export function officeZone(request: NextRequest): NextResponse | null {
  const { pathname, search } = request.nextUrl;
  const zone = (process.env.OFFICE_ZONE_URL ?? "").replace(/\/$/, "");
  const isMoved = (m: string | null): m is string => m !== null && (MOVED_MODULES as readonly string[]).includes(m);

  // ── Old address /app/{ka|en}/{module}/... ─────────────────────────────────
  if (isOfficePath(pathname)) {
    const { locale, module } = parse(pathname);
    // The bare /app and /app/ka: Office's home, the dashboard. (The bare /app
    // has answered 404 since a moved module gave this app an /app folder.)
    // Only the exact /app, /app/ka, /app/en: everything else without a locale
    // (/app/api/..., /app/_next/..., /app/manifest.webmanifest) is the Office
    // deployment's and must pass. (Matching on `!module` alone sent the sign-in
    // callback and file downloads to the dashboard.)
    if (/^\/app(?:\/(?:ka|en))?\/?$/.test(pathname)) {
      const lang = locale ?? "ka";
      if (enabledModules().has("dashboard")) return NextResponse.redirect(new URL(`/${lang}/dashboard${search}`, request.url), 307);
      if (!locale) return NextResponse.redirect(new URL(`/app/ka${search}`, request.url), 307);
      return null;
    }
    if (!locale || !isMoved(module)) return null;
    // /app/ka/translations/12 -> /ka/orders/12
    const rest = pathname.slice(`/app/${locale}/${module}`.length);
    const clean = `/${locale}/${cleanName(module)}${rest}${search}`;
    if (enabledModules().has(module)) {
      // A page load goes to the clean address. A page-data request or a form
      // post from an old tab is answered in place.
      const pageLoad = (request.method === "GET" || request.method === "HEAD") && request.headers.get("rsc") !== "1";
      if (pageLoad) return NextResponse.redirect(new URL(clean, request.url), 308);
      return serveHere(request, locale, clean, `${pathname}${search}`);
    }
    return zone ? NextResponse.rewrite(new URL(`${zone}${pathname}${search}`)) : null;
  }

  // ── Clean address /{ka|en|pl}/{moved module}/... ──────────────────────────
  const assignment = oldAssignmentPath(pathname);
  if (assignment) return NextResponse.redirect(new URL(`${assignment}${search}`, request.url), 308);

  const { locale, module } = parseClean(pathname);
  if (!locale || !isMoved(module)) return null;
  const segment = cleanName(module);
  const rest = pathname.slice(`/${locale}/${segment}`.length);
  if (!enabledModules().has(module)) {
    // Before Office's orders are switched on, /ka/orders is still what it was:
    // Translate's bureau assignments, at their new address.
    if (segment === "orders" && !rest) return NextResponse.redirect(new URL(`/${locale}/assignments${search}`, request.url), 307);
    // Not switched on yet: the Office deployment answers, at its own address.
    return NextResponse.redirect(new URL(`/app/${locale === "en" ? "en" : "ka"}/${module}${rest}${search}`, request.url), 307);
  }
  // Office has no Polish: its screens open in English.
  if (locale === "pl") return NextResponse.redirect(new URL(`/en/${segment}${rest}${search}`, request.url), 307);
  return serveHere(request, locale, `${pathname}${search}`, `/app/${locale}/${module}${rest}${search}`);
}

/** Serve a moved module's page from this app: Office's middleware, then the internal rewrite. */
function serveHere(request: NextRequest, locale: string, clean: string, internal = `/app${clean}`): NextResponse {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce, process.env.NODE_ENV === "development");

  if (!request.cookies.has(SESSION_COOKIE)) {
    // Sign-in is still the Office deployment's, under /app.
    const login = new URL(`/app/${locale}/login`, request.url);
    login.searchParams.set("from", clean);
    const redirect = NextResponse.redirect(login);
    redirect.headers.set("Content-Security-Policy", csp);
    return redirect;
  }

  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("content-security-policy", csp);
  // Office's code reads where the request is: the clean address.
  headers.set("x-pathname", clean);
  // Tells i18n/request.ts to load Office's messages.
  headers.set("x-suliko-zone", "office");
  headers.set("x-next-intl-locale", locale);

  // The pages live under src/app/app/[locale]/(office).
  // The pages live under src/app/app/[locale]/(office) and (editor), in their
  // Office folder names (orders: translations).
  const target = new URL(internal, request.url);
  const response = NextResponse.rewrite(target, { request: { headers } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}
