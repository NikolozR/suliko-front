"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useUserStore } from "@/features/auth/store/userStore";
import {
  WEB_SESSIONS,
  SESSION_COOKIE_MARKER,
  refreshWebSession,
  secondsLeft,
  sessionPost,
  type SessionTokens,
} from "@/features/auth/lib/webSession";

/** Renew the access token this long before it runs out. */
const RENEW_BEFORE_SECONDS = 120;
const CHECK_EVERY_MS = 60_000;

/**
 * SessionRefreshProvider - Refreshes user session on app initialization
 *
 * This component ensures that when users visit the website with existing tokens,
 * their session is automatically refreshed and user profile is fetched.
 * This fixes the issue where credentials weren't applied until manual refresh.
 *
 * The getUserProfile service already handles token refresh automatically if needed (401 response).
 *
 * With web sessions (see `features/auth/lib/webSession.ts`) it also:
 * - moves someone signed in the old way over to a web session, without
 *   signing them out (`adopt`);
 * - keeps the 30-minute access token fresh while the site is open, so code
 *   that has no 401 handling of its own never meets an expired one.
 */
export default function SessionRefreshProvider() {
  const { fetchUserProfile } = useUserStore();
  const hasRefreshed = useRef(false);

  useEffect(() => {
    // Only run once on mount
    if (hasRefreshed.current) return;

    const refreshSession = async () => {
      if (WEB_SESSIONS) await bringSessionUpToDate();

      // Get fresh token from store (in case it wasn't hydrated yet)
      const currentToken = useAuthStore.getState().token;

      // If we have a token, refresh the session to ensure credentials are applied
      if (currentToken) {
        try {
          await fetchUserProfile();
        } catch (error) {
          // Error is already handled in fetchUserProfile
          // It will clear user data if token is invalid
          console.error("Failed to refresh session:", error);
        }
      }

      hasRefreshed.current = true;
    };

    // Small delay to ensure Zustand persist has hydrated
    const timeoutId = setTimeout(() => {
      refreshSession();
    }, 100);

    if (!WEB_SESSIONS) {
      return () => clearTimeout(timeoutId);
    }

    const keepFresh = () => {
      const { token, refreshToken } = useAuthStore.getState();
      if (refreshToken !== SESSION_COOKIE_MARKER) return;
      const left = secondsLeft(token);
      if (left === null || left < RENEW_BEFORE_SECONDS) void renew();
    };
    const interval = setInterval(keepFresh, CHECK_EVERY_MS);
    // A tab left in the background may have slept through the interval.
    const onVisible = () => {
      if (document.visibilityState === "visible") keepFresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps array ensures this only runs once on mount

  return null;
}

function apply(tokens: SessionTokens) {
  const { setToken, setRefreshToken } = useAuthStore.getState();
  setToken(tokens.token);
  setRefreshToken(tokens.refreshToken);
}

/** A fresh access token; signed out if the sign-in itself is over. */
async function renew() {
  try {
    apply(await refreshWebSession());
  } catch (error) {
    if (error instanceof Error && error.message.includes("(401)")) {
      useAuthStore.getState().reset();
    }
  }
}

/** On arrival: move an old-style sign-in over, or renew a stale token. */
async function bringSessionUpToDate() {
  const { token, refreshToken, reset } = useAuthStore.getState();

  if (token && refreshToken && refreshToken !== SESSION_COOKIE_MARKER) {
    // Signed in before web sessions: the refresh token is still in this
    // browser's storage. Trade it in, and it leaves the browser for good.
    try {
      const result = await sessionPost("adopt", { accessToken: token, refreshToken });
      if (result.ok) {
        apply(result.data as SessionTokens);
      } else if (result.status === 401) {
        reset();
      }
      // Anything else (not configured, an outage): keep the old sign-in for now.
    } catch {
      // Unreachable: try again on the next visit.
    }
    return;
  }

  if (refreshToken === SESSION_COOKIE_MARKER) {
    const left = secondsLeft(token);
    if (left === null || left < RENEW_BEFORE_SECONDS) await renew();
  }
}
