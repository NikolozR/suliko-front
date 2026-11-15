import { NextRequest, NextResponse } from "next/server";

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
const MOVED_MODULES = ["calculator", "clients", "notaries", "translators", "finances", "reports", "settings", "billing", "users", "dashboard", "notifications", "account"] as const;

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
function parseClean(pathname: string): { locale: string | null; module: string | null } {
  const [, locale, module] = pathname.split("/");
  return ["ka", "en", "pl"].includes(locale) ? { locale, module: module ?? null } : { locale: null, module: null };
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
    if (!module) {
      const lang = locale ?? "ka";
      if (enabledModules().has("dashboard")) return NextResponse.redirect(new URL(`/${lang}/dashboard${search}`, request.url), 307);
      if (!locale) return NextResponse.redirect(new URL(`/app/ka${search}`, request.url), 307);
      return null;
    }
    if (!locale || !isMoved(module)) return null;
    const clean = `${pathname.slice("/app".length)}${search}`;
    if (enabledModules().has(module)) {
      // A page load goes to the clean address. A page-data request or a form
      // post from an old tab is answered in place.
      const pageLoad = (request.method === "GET" || request.method === "HEAD") && request.headers.get("rsc") !== "1";
      if (pageLoad) return NextResponse.redirect(new URL(clean, request.url), 308);
      return serveHere(request, locale, clean);
    }
    return zone ? NextResponse.rewrite(new URL(`${zone}${pathname}${search}`)) : null;
  }

  // ── Clean address /{ka|en|pl}/{moved module}/... ──────────────────────────
  const { locale, module } = parseClean(pathname);
  if (!locale || !isMoved(module)) return null;
  if (!enabledModules().has(module)) {
    // Not switched on yet: the Office deployment answers, at its own address.
    return NextResponse.redirect(new URL(`/app/${locale === "en" ? "en" : "ka"}${pathname.slice(locale.length + 1)}${search}`, request.url), 307);
  }
  // Office has no Polish: its screens open in English.
  if (locale === "pl") return NextResponse.redirect(new URL(`/en${pathname.slice(3)}${search}`, request.url), 307);
  return serveHere(request, locale, `${pathname}${search}`);
}

/** Serve a moved module's page from this app: Office's middleware, then the internal rewrite. */
function serveHere(request: NextRequest, locale: string, clean: string): NextResponse {
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
  const target = new URL(`/app${clean}`, request.url);
  const response = NextResponse.rewrite(target, { request: { headers } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}
