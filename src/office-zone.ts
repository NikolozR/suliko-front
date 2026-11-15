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
const MOVED_MODULES = ["calculator", "clients", "notaries", "translators", "finances", "reports", "settings", "billing", "users"] as const;

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

/**
 * Handle a request under /app. Returns the response, or null to let it go on
 * to this site's rewrites (which pass it to the Office deployment).
 */
export function officeZone(request: NextRequest): NextResponse | null {
  const { pathname, search } = request.nextUrl;
  const { locale, module } = parse(pathname);
  const moved = module !== null && (MOVED_MODULES as readonly string[]).includes(module);

  if (!moved || !locale) return null;

  if (!enabledModules().has(module)) {
    // Moved here but not switched on: still the Office deployment's.
    const zone = (process.env.OFFICE_ZONE_URL ?? "").replace(/\/$/, "");
    return zone ? NextResponse.rewrite(new URL(`${zone}${pathname}${search}`)) : null;
  }

  // ── Served by this app: what Office's own middleware does ────────────────
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce, process.env.NODE_ENV === "development");

  if (!request.cookies.has(SESSION_COOKIE)) {
    // Sign-in is still the Office deployment's: its login page is under /app too.
    const login = new URL(`/app/${locale}/login`, request.url);
    login.searchParams.set("from", `${pathname.slice("/app".length)}${search}`);
    const redirect = NextResponse.redirect(login);
    redirect.headers.set("Content-Security-Policy", csp);
    return redirect;
  }

  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("content-security-policy", csp);
  // Office's code reads where the request is without the /app.
  headers.set("x-pathname", `${pathname.slice("/app".length)}${search}`);
  // Tells i18n/request.ts to load Office's messages.
  headers.set("x-suliko-zone", "office");
  headers.set("x-next-intl-locale", locale);

  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}
