/**
 * Suliko Office (office.suliko.ge), as suliko.ge links to it.
 *
 * suliko.ge is the one sign-in for both: Office sends people here to sign in
 * (`/sso/office`) and to sign out (`/sso/signout`), and suliko.ge's own sign-out
 * passes through Office's, so leaving either leaves both.
 */
/**
 * The path Suliko Office is served under on this site ("/app"), when it is: see
 * next.config.ts. Empty while Office has its own address.
 */
const OFFICE_PATH = (process.env.NEXT_PUBLIC_OFFICE_PATH ?? "").replace(/\/$/, "");

/** Office's own address, from before it was served here. */
const OWN_OFFICE_URL = "https://office.suliko.ge";

/**
 * Where Office is: a path on this site, or its own address. Use it in a plain
 * `<a href>` or `window.location`, never in next-intl's `Link`, which would put
 * this site's locale in front of the path.
 */
export const OFFICE_URL = OFFICE_PATH || OWN_OFFICE_URL;

/**
 * Where Office lived before it moved to office.suliko.ge. Still recognised, so a
 * sign-out that starts from an old tab, bookmark or email is not refused.
 */
const FORMER_OFFICE_URL = "https://app.suliko.ge";

/** Where a sign-out may send the browser on to afterwards. */
export const OFFICE_ORIGINS: readonly string[] = [
  OWN_OFFICE_URL,
  FORMER_OFFICE_URL,
  // Served here, Office's addresses are this site's own.
  ...(OFFICE_PATH
    ? ["https://suliko.ge", "https://www.suliko.ge", "https://suliko.io", "https://www.suliko.io"]
    : []),
  ...(process.env.NODE_ENV === "development"
    ? ["http://localhost:3000", ...(OFFICE_PATH && typeof window !== "undefined" ? [window.location.origin] : [])]
    : []),
];

/** Office's locales; anything else (pl) opens it in Georgian. */
export function officeLocale(locale: string): "en" | "ka" {
  return locale === "en" ? "en" : "ka";
}

/**
 * Where the landing page's "Sign in" goes: Office in the visitor's language,
 * which sends anyone who is signed out through suliko.ge's sign-in.
 */
export function officeSignInUrl(locale: string): string {
  return `${OFFICE_URL}/${officeLocale(locale)}`;
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
