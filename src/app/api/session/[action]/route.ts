import { NextRequest, NextResponse } from "next/server";

import { API_BASE_URL } from "@/shared/constants/api";
import { SESSION_COOKIE_MARKER } from "@/features/auth/lib/webSession";

/**
 * Web sessions: the server's half (see `features/auth/lib/webSession.ts`).
 *
 * The only place the "stay signed in" token exists outside the backend: an
 * HttpOnly cookie on this site, scoped to these routes. The backend's
 * `api/web-session` endpoints answer only to this server (WEB_SESSION_KEY),
 * so a script in the page can neither read the token nor mint one.
 *
 *   login     email or phone, and password
 *   google    a Google ID token
 *   adopt     someone signed in the old way, moved over without signing out
 *   refresh   a new access token (and refresh token) from the cookie
 *   sign-out  end this sign-in and forget the cookie
 */

const COOKIE = "suliko_rt";
const COOKIE_PATH = "/api/session";

interface BackendSession {
  token: string;
  refreshToken: string;
  expiresIn: number;
  refreshTokenExpiresAt: string;
  hasSeenRegistrationBonus: boolean;
}

async function backend(
  path: string,
  body: unknown,
  headers: Record<string, string> = {},
): Promise<{ status: number; data: unknown }> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Web-Session-Key": process.env.WEB_SESSION_KEY ?? "",
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const text = await response.text();
  let data: unknown = text;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // A plain-text error message from the backend; passed on as it is.
  }
  return { status: response.status, data };
}

function withSession(session: BackendSession): NextResponse {
  const response = NextResponse.json({
    token: session.token,
    // The page learns only that a refresh is possible, never the token.
    refreshToken: SESSION_COOKIE_MARKER,
    expiresIn: session.expiresIn,
    hasSeenRegistrationBonus: session.hasSeenRegistrationBonus,
  });
  const expires = new Date(session.refreshTokenExpiresAt);
  response.cookies.set(COOKIE, session.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: COOKIE_PATH,
    expires: Number.isNaN(expires.getTime()) ? undefined : expires,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function withoutSession(status: number, data: unknown = null): NextResponse {
  const response = NextResponse.json(data, { status });
  response.cookies.set(COOKIE, "", { httpOnly: true, path: COOKIE_PATH, maxAge: 0 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

/** The backend's answer: a session, or its error passed on unchanged. */
function answer(result: { status: number; data: unknown }): NextResponse {
  if (result.status === 200) return withSession(result.data as BackendSession);
  return NextResponse.json(result.data, { status: result.status });
}

/** Only this site's own pages may call these: a cross-site POST gets nothing. */
function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  return origin !== null && origin === request.nextUrl.origin;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> },
): Promise<NextResponse> {
  const { action } = await params;
  if (!process.env.WEB_SESSION_KEY) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const refreshToken = request.cookies.get(COOKIE)?.value;

  switch (action) {
    case "login":
      return answer(
        await backend("/web-session/login", {
          phoneNumber: body.phoneNumber,
          password: body.password,
        }),
      );

    case "google":
      return answer(
        await backend("/web-session/google", {
          idToken: body.idToken,
          referralCode: body.referralCode ?? null,
        }),
      );

    case "adopt": {
      const accessToken = typeof body.accessToken === "string" ? body.accessToken : "";
      let result = await backend("/web-session/adopt", undefined, {
        Authorization: `Bearer ${accessToken}`,
      });
      // The old seven-day token has run out, but its refresh token may not have.
      if (result.status === 401 && typeof body.refreshToken === "string" && body.refreshToken) {
        const legacy = await backend("/Auth/refresh-token", { refreshToken: body.refreshToken });
        const renewed = (legacy.data as { token?: string } | null)?.token;
        if (legacy.status === 200 && renewed) {
          result = await backend("/web-session/adopt", undefined, { Authorization: `Bearer ${renewed}` });
        }
      }
      return answer(result);
    }

    case "refresh": {
      if (!refreshToken) return withoutSession(401, { error: "invalid_grant" });
      const result = await backend("/web-session/refresh", { refreshToken });
      if (result.status === 200) return withSession(result.data as BackendSession);
      // 409: another tab replaced the token a moment ago. Keep the cookie it set.
      if (result.status === 409) return NextResponse.json(result.data, { status: 409 });
      // Only a refusal ends the sign-in; an outage must not sign everyone out.
      if (result.status === 401) return withoutSession(401, result.data);
      return NextResponse.json({ error: "unavailable" }, { status: 502 });
    }

    case "sign-out":
      if (refreshToken) {
        await backend("/web-session/sign-out", { refreshToken }).catch(() => undefined);
      }
      return withoutSession(200, { ok: true });

    default:
      return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
