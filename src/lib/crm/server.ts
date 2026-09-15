/**
 * suliko.ge ⇄ api.suliko.ge (the bureau CRM). SERVER ONLY — never import this
 * from a client component: it holds the portal signing secret.
 *
 * Translators sign in to suliko.ge, whose .NET backend knows nothing about the
 * CRM, and the CRM knows nothing about suliko.ge accounts. This module bridges
 * them for the Orders tab:
 *
 *   1. verify the caller's suliko.ge token with the .NET backend;
 *   2. sign a one-minute assertion "this is suliko.ge user X" with the secret
 *      shared with the CRM (PORTAL_SHARED_SECRET there);
 *   3. call the CRM's /api/v1/portal endpoints with it.
 *
 * Files do NOT pass through here. Vercel caps a function's request and response
 * bodies at 4.5 MB, so the browser gets a short-lived ticket bound to one
 * method and path and talks to the CRM directly (see `mintFileTicket`).
 *
 * Env (server-only, none of them NEXT_PUBLIC):
 *   SULIKO_CRM_API_URL            required — e.g. https://api.suliko.ge (no trailing /api)
 *   SULIKO_PORTAL_SECRET          required — the CRM's PORTAL_SHARED_SECRET, same value
 *   SULIKO_CRM_PUBLIC_URL         optional — CRM URL as browsers reach it; defaults to the above
 *   SULIKO_CRM_GATEWAY_SECRET     optional — the CRM's BFF_SHARED_SECRET, if it has one
 *   SULIKO_PORTAL_ADMIN_USER_IDS  optional — comma-separated suliko.ge user ids allowed into
 *                                 Admin → Translators / Organizations
 *
 * Admin rights come only from that allowlist, checked here on the server. The
 * role on a suliko.ge profile is not consulted.
 */

import { createHash, createHmac } from "node:crypto";
import { jwtDecode } from "jwt-decode";
import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/shared/constants/api";

const ASSERTION_HEADER = "X-Suliko-Portal-Assertion";
const GATEWAY_HEADER = "X-Suliko-Gateway";

/** Must not exceed the CRM's PORTAL_ASSERTION_MAX_AGE_SECONDS (60). */
const ASSERTION_TTL_SECONDS = 60;
/** Must not exceed the CRM's PORTAL_TICKET_MAX_AGE_SECONDS (300). */
const TICKET_TTL_SECONDS = 300;

/** A verified token is trusted this long before asking the .NET backend again. */
const CALLER_CACHE_MS = 60_000;
const CALLER_CACHE_LIMIT = 500;

const UPSTREAM_TIMEOUT_MS = 30_000;

export interface SulikoCaller {
  userId: string;
  isAdmin: boolean;
}

type TokenKind = "assertion" | "ticket";

function env(name: string): string | null {
  return process.env[name]?.trim() || null;
}

export function crmConfigured(): boolean {
  return Boolean(env("SULIKO_CRM_API_URL") && env("SULIKO_PORTAL_SECRET"));
}

function crmBase(publicFacing = false): string {
  const base = (publicFacing && env("SULIKO_CRM_PUBLIC_URL")) || env("SULIKO_CRM_API_URL") || "";
  return base.replace(/\/+$/, "");
}

function adminIds(): Set<string> {
  return new Set(
    (env("SULIKO_PORTAL_ADMIN_USER_IDS") ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );
}

/**
 * `v1.<base64url(claims)>.<base64url(HMAC-SHA256)>` — byte-compatible with
 * `suliko.security.portal_tokens` in api.suliko.ge.
 */
function signPortalToken(options: {
  kind: TokenKind;
  userId: string;
  ttlSeconds: number;
  isAdmin?: boolean;
  method?: string;
  path?: string;
}): string {
  const secret = env("SULIKO_PORTAL_SECRET");
  if (!secret) throw new Error("SULIKO_PORTAL_SECRET is not set");

  const issuedAt = Math.floor(Date.now() / 1000);
  const claims: Record<string, unknown> = {
    typ: options.kind,
    sub: options.userId,
    adm: options.isAdmin ?? false,
    iat: issuedAt,
    exp: issuedAt + options.ttlSeconds,
  };
  if (options.kind === "ticket") {
    claims.mth = (options.method ?? "").toUpperCase();
    claims.pth = options.path;
  }

  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signingInput = `v1.${payload}`;
  const signature = createHmac("sha256", secret).update(signingInput).digest("base64url");
  return `${signingInput}.${signature}`;
}

// ── Who is calling ──────────────────────────────────────────────────────────

const callerCache = new Map<string, { caller: SulikoCaller; expiresAt: number }>();

function bearerToken(request: NextRequest): string | null {
  const [scheme, token] = (request.headers.get("authorization") ?? "").split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token.trim() : null;
}

/**
 * The verified suliko.ge user behind this request, or null.
 *
 * Only the Authorization header is accepted — never the `token` cookie. A
 * header cannot be attached by another site, so these routes need no CSRF
 * defence of their own.
 *
 * The user id is read from the token and then proven by asking the .NET backend
 * for that same user WITH that token: the backend checks the signature, and the
 * signature covers the id. A 200 therefore means both "valid token" and "this id".
 */
export async function getSulikoCaller(request: NextRequest): Promise<SulikoCaller | null> {
  const token = bearerToken(request);
  if (!token) return null;

  let userId: string | undefined;
  try {
    userId = jwtDecode<{ sub?: string }>(token).sub;
  } catch {
    return null;
  }
  if (!userId) return null;

  const cacheKey = createHash("sha256").update(token).digest("hex");
  const cached = callerCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.caller;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/User/${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch {
    return null;
  }
  if (response.status !== 200) return null;

  const profile = (await response.json().catch(() => null)) as { id?: string } | null;
  if (profile?.id !== userId) return null;

  const caller = { userId, isAdmin: adminIds().has(userId) };
  if (callerCache.size >= CALLER_CACHE_LIMIT) callerCache.clear();
  callerCache.set(cacheKey, { caller, expiresAt: Date.now() + CALLER_CACHE_MS });
  return caller;
}

// ── Calling the CRM ─────────────────────────────────────────────────────────

function problem(status: number, detail: string): NextResponse {
  return NextResponse.json({ status, detail }, { status });
}

const SAFE_SEGMENT = /^[A-Za-z0-9_.-]+$/;

/** Rebuild a catch-all path, refusing anything that could step outside it. */
export function joinSegments(segments: string[] | undefined): string | null {
  if (!segments?.length) return null;
  for (const segment of segments) {
    if (!SAFE_SEGMENT.test(segment) || segment === "." || segment === "..") return null;
  }
  return segments.join("/");
}

/**
 * Forward one request to the CRM as the verified caller.
 *
 * Status and body come back unchanged, so the CRM's own 401/403/404/422
 * messages reach the UI as written.
 */
export async function proxyToCrm(
  request: NextRequest,
  upstreamPath: string,
  { requireAdmin = false }: { requireAdmin?: boolean } = {},
): Promise<NextResponse> {
  if (!crmConfigured()) {
    console.error("[crm] SULIKO_CRM_API_URL or SULIKO_PORTAL_SECRET is not set");
    return problem(503, "Orders are not available right now.");
  }

  const caller = await getSulikoCaller(request);
  if (!caller) return problem(401, "Please sign in again.");
  if (requireAdmin && !caller.isAdmin) return problem(403, "This page is for suliko.ge admins.");

  const headers = new Headers({
    Accept: "application/json",
    [ASSERTION_HEADER]: signPortalToken({
      kind: "assertion",
      userId: caller.userId,
      isAdmin: caller.isAdmin,
      ttlSeconds: ASSERTION_TTL_SECONDS,
    }),
  });
  const gateway = env("SULIKO_CRM_GATEWAY_SECRET");
  if (gateway) headers.set(GATEWAY_HEADER, gateway);

  let body: string | undefined;
  if (request.method !== "GET" && request.method !== "DELETE") {
    body = await request.text();
    headers.set("Content-Type", request.headers.get("content-type") ?? "application/json");
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${crmBase()}/api/v1${upstreamPath}${request.nextUrl.search}`, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (error) {
    console.error(`[crm] ${request.method} ${upstreamPath} failed:`, error);
    return problem(502, "Orders are not available right now. Please try again.");
  }

  if (upstream.status === 204) return new NextResponse(null, { status: 204 });
  return new NextResponse(await upstream.text(), {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
  });
}

// ── File tickets ────────────────────────────────────────────────────────────

const TICKET_PATHS: Array<{ pattern: RegExp; method: "GET" | "POST" }> = [
  {
    pattern:
      /^\/portal\/organizations\/[a-z0-9][a-z0-9-]{1,62}\/orders\/\d+\/documents\/\d+\/files$/,
    method: "POST",
  },
  {
    pattern:
      /^\/portal\/organizations\/[a-z0-9][a-z0-9-]{1,62}\/orders\/\d+\/documents\/\d+\/files\/[A-Za-z0-9_-]{8,100}$/,
    method: "GET",
  },
  { pattern: /^\/portal\/personal-orders\/\d+\/files$/, method: "POST" },
  { pattern: /^\/portal\/personal-orders\/\d+\/files\/\d+$/, method: "GET" },
];

/**
 * A URL the browser can use once, within five minutes, for one file transfer.
 *
 * Only the four file routes are ticketable, each with its one method. The CRM
 * still checks that the user may reach that order and file — a ticket carries
 * identity, not permission.
 */
export async function mintFileTicket(request: NextRequest): Promise<NextResponse> {
  if (!crmConfigured()) return problem(503, "Orders are not available right now.");

  const caller = await getSulikoCaller(request);
  if (!caller) return problem(401, "Please sign in again.");

  const input = (await request.json().catch(() => null)) as {
    method?: string;
    path?: string;
    query?: Record<string, string>;
  } | null;
  const method = input?.method?.toUpperCase();
  const path = input?.path ?? "";
  const allowed = TICKET_PATHS.some((entry) => entry.pattern.test(path) && entry.method === method);
  if (!method || !allowed) return problem(400, "That file action is not allowed.");

  const apiPath = `/api/v1${path}`;
  const ticket = signPortalToken({
    kind: "ticket",
    userId: caller.userId,
    ttlSeconds: TICKET_TTL_SECONDS,
    method,
    path: apiPath,
  });

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(input?.query ?? {})) {
    if (key === "kind" && (value === "source" || value === "translation")) query.set(key, value);
  }
  query.set("ticket", ticket);

  return NextResponse.json({ url: `${crmBase(true)}${apiPath}?${query.toString()}` });
}
