// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import "server-only";

import { cookies, headers as requestHeaders } from "next/headers";
import { redirect } from "next/navigation";
import { withBasePath } from "@office/shared/lib/base-path";

import { SESSION_COOKIE } from "@office/shared/auth/cookies";

/**
 * Server-side client for the Suliko API.
 *
 * This module is `server-only` on purpose. It attaches two credentials that
 * must never reach a browser:
 *
 *   - `X-Suliko-Gateway`, the shared secret proving the caller is our BFF
 *   - `Authorization: Bearer <session token>`, read from the HttpOnly cookie
 *
 * Importing it from a Client Component is a build error, which is the point.
 */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string,
    readonly code?: string,
    readonly body?: unknown,
  ) {
    super(`${status}: ${detail}`);
    this.name = "ApiError";
  }

  /** No session, or it expired. */
  get isUnauthenticated() {
    return this.status === 401 && this.code !== "mfa_required";
  }

  /** Password accepted but the second factor is still owed. */
  get isMfaRequired() {
    return this.code === "mfa_required";
  }

  /** The action needs a fresh 2FA code, not a different permission. */
  get isStepUpRequired() {
    return this.code === "step_up_required";
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    // Fail loudly at the first call rather than sending an unauthenticated
    // request that comes back as a confusing 404 from the gateway.
    throw new Error(
      `${name} is not set. The frontend cannot reach the API without it. ` +
        `See docs/RUNBOOK-API-SULIKO-GE.md §7.`,
    );
  }
  return value;
}

/**
 * How long a call may take before the page stops waiting for it.
 *
 * Without a limit, an API that accepts the connection and then hangs holds
 * every server render that touches it until the platform kills the function
 * — a blank tab for the user, with no error to show. Uploads get longer.
 */
const DEFAULT_TIMEOUT_MS = 20_000;
const UPLOAD_TIMEOUT_MS = 120_000;

/**
 * The browser's address and user agent, for the API.
 *
 * Every call reaches the API from THIS server, so without these the API sees
 * one address for every user of every bureau: its per-IP login and sign-up
 * limits become platform-wide (20 failed logins anywhere lock everyone out),
 * and every session and login record shows the server's user agent. The API
 * believes these headers only when the gateway secret is also present.
 *
 * Outside a request (build time, a background job) there is nothing to
 * forward, and `headers()` throws; that is not an error here.
 */
async function forwardedClientHeaders(): Promise<Record<string, string>> {
  try {
    const incoming = await requestHeaders();
    const forwarded = incoming.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ip = incoming.get("x-real-ip")?.trim() || forwarded;
    const ua = incoming.get("user-agent");
    const out: Record<string, string> = {};
    if (ip) out["X-Suliko-Client-IP"] = ip;
    if (ua) out["X-Suliko-Client-UA"] = ua.slice(0, 255);
    return out;
  } catch {
    return {};
  }
}

async function redirectToStepUp(): Promise<void> {
  let current = "";
  try {
    // Set by middleware.ts on every page request.
    current = (await requestHeaders()).get("x-pathname") ?? "";
  } catch {
    return;
  }
  const locale = current.split("/")[1] || "ka";
  redirect(withBasePath(`/${locale}/two-factor?step_up=1&next=${encodeURIComponent(current)}`));
}

function withTimeout(signal: AbortSignal | undefined, ms: number): AbortSignal {
  const timeout = AbortSignal.timeout(ms);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

export interface ApiRequest {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Send the session cookie's token. Default true. */
  authenticated?: boolean;
  /** Use this token instead of the cookie — for the login → 2FA handoff. */
  token?: string;
  /** Next.js fetch caching. Defaults to no-store: this is live business data. */
  cache?: RequestCache;
  revalidate?: number | false;
  tags?: string[];
  signal?: AbortSignal;
}

/**
 * Call the API. Throws `ApiError` on any non-2xx.
 *
 * The API returns RFC 9457 problem+json, so `detail` and `code` come straight
 * from the body rather than being invented here.
 */
export async function api<T>(path: string, options: ApiRequest = {}): Promise<T> {
  const {
    method = "GET",
    body,
    authenticated = true,
    token,
    cache = "no-store",
    revalidate,
    tags,
    signal,
  } = options;

  const baseUrl = requireEnv("OFFICE_API_BASE_URL").replace(/\/$/, "");
  const gatewaySecret = process.env.BFF_SHARED_SECRET;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(await forwardedClientHeaders()),
  };

  // Only sent when configured. A loopback deployment has no gateway.
  if (gatewaySecret) headers["X-Suliko-Gateway"] = gatewaySecret;

  // A FormData body carries files, and fetch must set its own multipart
  // boundary — declaring the Content-Type here would drop it.
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";

  let bearer = token;
  if (!bearer && authenticated) {
    bearer = (await cookies()).get(SESSION_COOKIE)?.value;
  }
  if (bearer) headers.Authorization = `Bearer ${bearer}`;

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
    cache: revalidate === undefined ? cache : undefined,
    next: revalidate === undefined && !tags ? undefined : { revalidate, tags },
    signal: withTimeout(signal, isForm ? UPLOAD_TIMEOUT_MS : DEFAULT_TIMEOUT_MS),
  });

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    const problem = (parsed ?? {}) as { detail?: string; type?: string; title?: string };
    // The problem `type` is a URL ending in the error code.
    const code = problem.type?.split("/").pop();
    // A page load the API will only answer after a fresh 2FA code: send the
    // user to confirm, and back to this page afterwards. Only for reads —
    // a form submission reports it instead (`describeApiError`), so what was
    // typed is not thrown away by a navigation.
    if (response.status === 403 && code === "step_up_required" && method === "GET") {
      await redirectToStepUp();
    }
    throw new ApiError(
      response.status,
      problem.detail ?? problem.title ?? response.statusText,
      code,
      parsed,
    );
  }

  return parsed as T;
}

/**
 * Call the API and hand back the raw response, unread.
 *
 * For file downloads: the body is streamed straight through to the browser
 * rather than buffered here, so a 50 MB scan never sits in the BFF's memory.
 * Same credentials as `api` — the gateway secret and the session token — and
 * the same rule that they never reach the browser.
 */
export async function apiRaw(
  path: string,
  options: {
    signal?: AbortSignal;
    method?: "GET" | "POST";
    body?: BodyInit;
    contentType?: string;
  } = {},
): Promise<Response> {
  const baseUrl = requireEnv("OFFICE_API_BASE_URL").replace(/\/$/, "");
  const headers: Record<string, string> = { ...(await forwardedClientHeaders()) };
  if (options.contentType) headers["Content-Type"] = options.contentType;

  const gatewaySecret = process.env.BFF_SHARED_SECRET;
  if (gatewaySecret) headers["X-Suliko-Gateway"] = gatewaySecret;

  const bearer = (await cookies()).get(SESSION_COOKIE)?.value;
  if (bearer) headers.Authorization = `Bearer ${bearer}`;

  return fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body,
    // Streaming a request body through (uploads) needs half-duplex.
    ...(options.body ? { duplex: "half" } : {}),
    cache: "no-store",
    // A download or upload streams for as long as it takes; the timeout
    // covers getting the response started, via the caller's own signal.
    signal: options.signal,
  } as RequestInit);
}
