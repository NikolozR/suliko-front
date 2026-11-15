import "server-only";

import { getSession } from "@office/shared/auth/session";
import { planAllows } from "@office/shared/auth/plans";
import { NAVIGATION } from "@office/shared/config/navigation";

import { officeLocaleOf } from "./workspace";

/** One Office item for Translate's sidebar: module and its label. Serialisable. */
export interface OfficeNavEntry {
  href: string;
  label: string;
}

/**
 * The Office half of the one sidebar, for Translate's screens: the modules this
 * person may open in their current organisation, in Office's order and with
 * Office's labels. Read from the Office session (the `suliko_session` cookie,
 * on this domain since Office is served under /app).
 *
 * Null when there is no Office session or the Office API cannot be reached:
 * the sidebar then shows its single "Suliko Office" link, which signs in.
 */
export async function officeNav(locale: string): Promise<OfficeNavEntry[] | null> {
  if (!process.env.OFFICE_API_BASE_URL) return null;
  try {
    const session = await getSession();
    if (!session || !session.mfaSatisfied) return null;
    const messages = (await import(`../../office/messages/${officeLocaleOf(locale)}.json`)).default as {
      nav: Record<string, string>;
    };
    const [main] = NAVIGATION;
    return main.items
      .filter(
        (item) =>
          (!item.permission || session.permissions.includes(item.permission)) &&
          (!item.feature || planAllows(session.plan, item.feature)),
      )
      .map((item) => ({ href: item.href, label: messages.nav[item.labelKey] ?? item.href }));
  } catch (error) {
    console.error("[office-nav] could not read the Office session", error);
    return null;
  }
}
