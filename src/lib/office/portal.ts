import { createHmac } from "node:crypto";
import { jwtDecode } from "jwt-decode";
import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/shared/constants/api";

/**
 * The translator portal of Suliko Office, seen from suliko.ge.
 *
 * Suliko Office (the bureau CRM) keeps the orders a bureau assigns to a
 * translator. A translator has no login there: they sign in here, and this
 * server tells the Office API, in a signed statement, which suliko.ge user is
 * asking. The statement is an HMAC over a small JSON document, in the format
 * api.suliko.ge/src/suliko/security/portal_tokens.py verifies. The two ends
 * share OFFICE_PORTAL_SECRET (PORTAL_SHARED_SECRET on the Office API).
 *
 * Nothing here runs in the browser: the secret must never reach it. Browsers
 * only get a one-file, five-minute ticket for a download (see `fileTicketUrl`).
 */

const VERSION = "v1";
/** The Office API's portal lives under this path. */
const PORTAL_PREFIX = "/api/v1/portal";
/** A statement is good for about a minute on the Office side. */
const ASSERTION_TTL_SECONDS = 60;
const TICKET_TTL_SECONDS = 300;

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

export function portalConfig(): { apiUrl: string; secret: string } | null {
  const apiUrl = process.env.OFFICE_API_URL?.replace(/\/+$/, "");
  const secret = process.env.OFFICE_PORTAL_SECRET;
  return apiUrl && secret ? { apiUrl, secret } : null;
}

type Claims = {
  typ: "assertion" | "ticket";
  sub: string;
  adm: boolean;
  iat: number;
  exp: number;
  mth?: string;
  pth?: string;
};

function signToken(secret: string, claims: Claims): string {
  // Keys in alphabetical order, as the Python side writes them. The verifier
  // checks the signature over the bytes it receives, so this is tidiness only.
  const ordered = Object.fromEntries(Object.entries(claims).sort(([a], [b]) => (a < b ? -1 : 1)));
  const signingInput = `${VERSION}.${base64url(JSON.stringify(ordered))}`;
  const signature = createHmac("sha256", secret).update(signingInput).digest("base64url");
  return `${signingInput}.${signature}`;
}

function claimsFor(
  type: Claims["typ"],
  userId: string,
  ttl: number,
  extra: Partial<Claims> = {}
): Claims {
  const now = Math.floor(Date.now() / 1000);
  return { typ: type, sub: userId, adm: false, iat: now, exp: now + ttl, ...extra };
}

/**
 * The suliko.ge user behind this request, or null.
 *
 * The `token` cookie is a JWT from the .NET backend. Decoding it proves
 * nothing, so it is spent on a real call first: the backend answers 200 for
 * the user's own profile only when the token is valid and unexpired.
 */
export async function currentUserId(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get("token")?.value;
  if (!token) return null;

  let userId: string | undefined;
  try {
    userId = jwtDecode(token).sub;
  } catch {
    return null;
  }
  if (!userId) return null;

  const response = await fetch(`${API_BASE_URL}/User/${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  }).catch(() => null);
  return response?.status === 200 ? userId : null;
}

type Outcome = { userId: string; apiUrl: string; secret: string } | NextResponse;

/** Who is asking and where the Office API is, or the response to send instead. */
export async function requirePortalUser(request: NextRequest): Promise<Outcome> {
  const config = portalConfig();
  if (!config) {
    // Not an error worth a stack trace: the portal is simply not switched on.
    return NextResponse.json({ error: "portal_disabled" }, { status: 503 });
  }
  const userId = await currentUserId(request);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return { userId, ...config };
}

/** GET one portal path on the Office API as `userId`, passing its answer through. */
export function portalGet(outcome: Exclude<Outcome, NextResponse>, path: string) {
  return portalCall(outcome, path);
}

/** POST a JSON body to one portal path as `userId`, passing the answer through. */
export function portalPost(outcome: Exclude<Outcome, NextResponse>, path: string, body: unknown) {
  return portalCall(outcome, path, body);
}

async function portalCall(outcome: Exclude<Outcome, NextResponse>, path: string, body?: unknown) {
  const assertion = signToken(outcome.secret, claimsFor("assertion", outcome.userId, ASSERTION_TTL_SECONDS));
  const headers: Record<string, string> = {
    "X-Suliko-Portal-Assertion": assertion,
    Accept: "application/json",
  };
  // The Office API answers 404 to anyone without its gateway secret (core/gateway.py),
  // the same one app.suliko.ge sends. File tickets are exempt, so only these calls need it.
  const gatewaySecret = process.env.BFF_SHARED_SECRET;
  if (gatewaySecret) headers["X-Suliko-Gateway"] = gatewaySecret;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(`${outcome.apiUrl}${PORTAL_PREFIX}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  }).catch(() => null);

  if (!response) return NextResponse.json({ error: "office_unreachable" }, { status: 502 });
  const answer = await response.text();
  return new NextResponse(answer, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" },
  });
}

/**
 * Where a browser can fetch ONE file from the Office API directly.
 *
 * Scans are too big to pass through this server (Vercel caps bodies at 4.5 MB),
 * so the browser is sent to the Office API with a ticket good for this one
 * GET on this one path, for five minutes.
 */
export function fileTicketUrl(outcome: Exclude<Outcome, NextResponse>, path: string): string {
  const fullPath = `${PORTAL_PREFIX}${path}`;
  const ticket = signToken(
    outcome.secret,
    claimsFor("ticket", outcome.userId, TICKET_TTL_SECONDS, { mth: "GET", pth: fullPath })
  );
  return `${outcome.apiUrl}${fullPath}?ticket=${encodeURIComponent(ticket)}`;
}

export function isResponse(outcome: Outcome): outcome is NextResponse {
  return outcome instanceof NextResponse;
}
