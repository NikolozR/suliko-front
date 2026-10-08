/**
 * Suliko Office (app.suliko.ge), as suliko.ge links to it.
 *
 * suliko.ge is the one sign-in for both: Office sends people here to sign in
 * (`/sso/office`) and to sign out (`/sso/signout`), and suliko.ge's own sign-out
 * passes through Office's, so leaving either leaves both.
 */
export const OFFICE_URL = "https://app.suliko.ge";

/** Where a sign-out may send the browser on to afterwards. */
export const OFFICE_ORIGINS: readonly string[] =
  process.env.NODE_ENV === "development" ? [OFFICE_URL, "http://localhost:3000"] : [OFFICE_URL];

/** Office's locales; anything else (pl) opens it in Georgian. */
export function officeLocale(locale: string): "en" | "ka" {
  return locale === "en" ? "en" : "ka";
}

/**
 * Office's sign-out, which ends the Office session (if any) and comes back to
 * `returnTo` — a suliko.ge address, checked against Office's own list.
 */
export function officeSignOutUrl(returnTo: string): string {
  return `${OFFICE_URL}/api/auth/sso/signout?return_to=${encodeURIComponent(returnTo)}`;
}

/** `value` if it is an address on one of Office's origins, else null. */
export function officeAddress(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return OFFICE_ORIGINS.includes(url.origin) ? url.toString() : null;
  } catch {
    return null;
  }
}
