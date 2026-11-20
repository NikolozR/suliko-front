import "server-only";

import type { AbstractIntlMessages } from "next-intl";

import { getUnreadCount } from "@office/features/notifications/api";
import type { OrgChoice } from "@office/shared/auth/actions";
import type { Permission } from "@office/shared/auth/permissions";
import { planAllows, type Plan } from "@office/shared/auth/plans";
import { getSession } from "@office/shared/auth/session";
import { NAVIGATION } from "@office/shared/config/navigation";

import { translateSearchTexts } from "@/features/search/texts";
import type { TranslateSearchTexts } from "@/features/search/types";
import { translateMessages } from "@/shared/i18n/translateMessages";

import { officeLocaleOf } from "./workspace";

/** One Office item for Translate's sidebar: module and its label. Serialisable. */
export interface OfficeNavEntry {
  href: string;
  label: string;
}

/**
 * What Translate's screens need to draw Office's half of the one shell: the
 * sidebar's Office section, and the top bar's organisation switcher, search
 * and notifications. All serialisable, handed from the server layout to the
 * client shell.
 */
export interface OfficeContext {
  nav: OfficeNavEntry[];
  locale: "ka" | "en" | "hy";
  /** Office's messages the top bar's pieces use (they are Office components). */
  messages: AbstractIntlMessages;
  timeZone: string;
  permissions: readonly Permission[];
  plan: Plan;
  organizations: OrgChoice[];
  personal: OrgChoice | null;
  tenantSlug: string;
  tenantName: string;
  unread: number;
  /** Translate's "Notifications" texts, for the one bell (a Translate component on this bar). */
  notificationsMessages: AbstractIntlMessages;
  /** The language of those texts: Translate's own, which may be one Office has none of. */
  notificationsLocale: string;
  /** Translate's half of the search box, as words. */
  searchTexts: TranslateSearchTexts;
}

/** The namespaces Office ships to every page (its i18n/client-messages.tsx). */
const SHARED = [
  "account", "auth", "common", "confirm", "enums", "errors", "flash", "forms",
  "nav", "options", "shell", "states", "statuses", "tips", "unsaved",
];

/**
 * Read from the Office session (the `suliko_session` cookie, on this domain
 * since Office is served under /app). Null when there is no Office session or
 * the Office API cannot be reached: the shell then shows only Translate's
 * pieces and a single "Suliko Office" link, which signs in.
 */
export async function officeContext(locale: string): Promise<OfficeContext | null> {
  if (!process.env.OFFICE_API_BASE_URL) return null;
  try {
    const session = await getSession();
    if (!session || !session.mfaSatisfied) return null;
    const officeLocale = officeLocaleOf(locale);
    const all = (await import(`../../office/messages/${officeLocale}.json`)).default as Record<string, unknown>;
    const messages = Object.fromEntries(SHARED.filter((k) => k in all).map((k) => [k, all[k]])) as AbstractIntlMessages;
    const nav = (all.nav ?? {}) as Record<string, string>;

    const [main] = NAVIGATION;
    const items = main.items
      .filter(
        (item) =>
          (!item.permission || session.permissions.includes(item.permission)) &&
          (!item.feature || planAllows(session.plan, item.feature)),
      )
      .map((item) => ({ href: item.href, label: nav[item.labelKey] ?? item.href }));

    let unread = 0;
    if (planAllows(session.plan, "notifications")) {
      unread = await getUnreadCount().catch(() => 0);
    }

    return {
      nav: items,
      locale: officeLocale,
      messages,
      timeZone: session.timezone,
      permissions: session.permissions,
      plan: session.plan,
      organizations: session.organizations,
      personal: session.personal,
      tenantSlug: session.tenantSlug ?? "",
      tenantName: session.tenantName ?? session.tenantSlug ?? "",
      unread,
      notificationsMessages: await translateMessages(locale, ["Notifications"]),
      notificationsLocale: locale,
      searchTexts: await translateSearchTexts(locale),
    };
  } catch (error) {
    console.error("[office-context] could not read the Office session", error);
    return null;
  }
}
