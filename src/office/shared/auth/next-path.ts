// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { routing } from "@office/i18n/routing";

/**
 * A "return here afterwards" path, made safe to redirect to.
 *
 * Accepts only a same-site path: it must start with a single "/", and must
 * not contain a scheme, a backslash or a protocol-relative "//" — any of which
 * would make this an open redirect to another site. The locale prefix is
 * stripped, because `redirectTo` adds the current one.
 *
 * Returns null when there is nothing usable, and the caller falls back to the
 * dashboard.
 */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.includes("\\") || value.includes("://")) return null;

  // Strip a leading "/ka" or "/en" (followed by "/", "?" or the end).
  const first = value.slice(1).split(/[/?]/, 1)[0];
  const path = (routing.locales as readonly string[]).includes(first)
    ? value.slice(first.length + 1) || "/"
    : value;
  // Never send someone back into the sign-in flow they just finished.
  if (/^\/(login|two-factor|signup|forgot-password|reset-password)(\/|$|\?)/.test(path)) {
    return null;
  }
  return path === "/" ? null : path;
}
