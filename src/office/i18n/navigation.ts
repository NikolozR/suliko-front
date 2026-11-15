// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/** Locale-aware replacements for next/link and next/navigation. Always use these. */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

/**
 * `redirect` that TypeScript knows terminates.
 *
 * Next.js implements redirects by throwing a special NEXT_REDIRECT error, so
 * nothing after the call ever runs — but next-intl types it as returning
 * `void`, which leaves TypeScript believing execution continues. That produces
 * spurious "possibly null" errors after a guard clause, and tempts people into
 * silencing them with `!`.
 *
 * The throw below is genuinely unreachable; it exists only to give this
 * function the `never` return type the runtime behaviour deserves.
 */
export function redirectTo(href: string, locale: string): never {
  redirect({ href, locale });
  throw new Error(`unreachable: redirect to ${href} did not throw`);
}
