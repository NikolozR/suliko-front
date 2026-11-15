// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import "server-only";

import { revalidatePath } from "next/cache";

import { routing } from "@office/i18n/routing";

/**
 * Revalidate an app route in every locale.
 *
 * Every page lives under `/[locale]/…`, so `revalidatePath("/users")` matches
 * nothing — the real paths are `/ka/users` and `/en/users`. After a server
 * action that stays on its page (a settings row, an access change), that left
 * the screen showing the data from before the save until the next navigation.
 * Pass the path WITHOUT a locale, exactly as the old calls did.
 */
export function revalidateRoute(path: string, type?: "page" | "layout"): void {
  for (const locale of routing.locales) {
    const localised = path === "/" ? `/${locale}` : `/${locale}${path}`;
    if (type) revalidatePath(localised, type);
    else revalidatePath(localised);
  }
}
