import { useAuthStore } from "@/features/auth/store/authStore";
import { officeSignOutUrl } from "@/features/sulikoOffice/lib/officeLinks";
import { WEB_SESSIONS, sessionPost } from "@/features/auth/lib/webSession";

/**
 * Sign out of suliko.ge AND Suliko Office: they share one sign-in, so leaving
 * one must leave the other. The tokens here are dropped first, so suliko.ge
 * is signed out even if Office cannot be reached; then the browser passes
 * through Office's sign-out and comes back to the sign-in page.
 */
export function signOutEverywhere(locale: string): void {
  // Ends the sign-in on the backend too, not just here. keepalive: the page
  // is about to navigate away.
  if (WEB_SESSIONS) void sessionPost("sign-out", undefined, { keepalive: true }).catch(() => undefined);
  useAuthStore.getState().reset();
  const back = `${window.location.origin}/${locale}/sign-in`;
  window.location.assign(officeSignOutUrl(back));
}
