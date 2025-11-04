"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useUserStore } from "@/features/auth/store/userStore";

/**
 * SessionRefreshProvider - Refreshes user session on app initialization
 * 
 * This component ensures that when users visit the website with existing tokens,
 * their session is automatically refreshed and user profile is fetched.
 * This fixes the issue where credentials weren't applied until manual refresh.
 * 
 * The getUserProfile service already handles token refresh automatically if needed (401 response).
 */
export default function SessionRefreshProvider() {
  const { token } = useAuthStore();
  const { fetchUserProfile } = useUserStore();
  const hasRefreshed = useRef(false);

  useEffect(() => {
    // Only run once on mount
    if (hasRefreshed.current) return;
    
    const refreshSession = async () => {
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

    return () => {
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps array ensures this only runs once on mount

  return null;
}

