// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import {
  BarChart3,
  Calculator,
  Bell,
  CreditCard,
  Globe,
  LayoutDashboard,
  FileStack,
  Settings,
  ShieldCheck,
  Users,
  UsersRound,
  UserCog,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type { Permission } from "@office/shared/auth/permissions";
import type { Feature } from "@office/shared/auth/plans";
import type { Hue } from "@office/shared/lib/hues";

/**
 * Sidebar navigation.
 *
 * Order and grouping match the production app (docs/02-PRODUCT-SPEC.md §3),
 * including the admin-only "Website" section at the bottom.
 *
 * `permission` gates visibility in the UI only — the route itself is also
 * guarded server-side.
 */

export interface NavItem {
  /** Route segment under /[locale], without a leading slash. */
  href: string;
  /** i18n key under the `nav` namespace. */
  labelKey: string;
  icon: LucideIcon;
  /**
   * The module's colour: its sidebar icon, the chip beside its page titles,
   * its empty states. Grey for the utility screens. The palette and what
   * each hue stands for are in globals.css.
   */
  hue: Hue;
  permission?: Permission;
  /**
   * Plan feature this item needs, for the handful of screens no permission
   * guards. Everything else is hidden by `permission` alone — the API has
   * already intersected the role with the plan by the time the session
   * arrives, so a withheld tab simply has no permission to match.
   */
  feature?: Feature;
  /** Show an unread-activity dot next to the label. */
  hasActivityDot?: boolean;
}

export interface NavSection {
  /** i18n key under `nav.sections`, or null for the unlabelled first group. */
  titleKey: string | null;
  items: NavItem[];
}

export const NAVIGATION: NavSection[] = [
  {
    titleKey: null,
    items: [
      { href: "dashboard", labelKey: "dashboard", icon: LayoutDashboard, hue: "blue" },
      {
        href: "translations",
        labelKey: "translations",
        // Orders: a stack of documents. The 文A icon means Suliko Translate.
        icon: FileStack,
        hue: "blue",
        permission: "orders.read",
        hasActivityDot: true,
      },
      {
        href: "clients",
        labelKey: "clients",
        icon: UsersRound,
        hue: "teal",
        permission: "clients.read",
      },
      {
        href: "translators",
        labelKey: "translators",
        icon: UserCog,
        hue: "violet",
        permission: "translators.read",
      },
      {
        href: "notaries",
        labelKey: "notaries",
        icon: ShieldCheck,
        hue: "plum",
        permission: "notaries.read",
      },
      {
        href: "notifications",
        labelKey: "notifications",
        icon: Bell,
        hue: "amber",
        // No permission of its own — every role may read their own notes.
        // A freelancer has no colleagues to be notified by, so the plan is
        // what withholds it.
        feature: "notifications",
        hasActivityDot: true,
      },
      // `reports.profit`, not `reports.read`: the Reports screen is margins
      // and profit, and the page guards on that. With `reports.read` staff saw
      // the tab and were silently bounced back to the dashboard by the page.
      {
        href: "reports",
        labelKey: "reports",
        icon: BarChart3,
        hue: "amber",
        permission: "reports.profit",
      },
      {
        href: "finances",
        labelKey: "finances",
        icon: Wallet,
        hue: "green",
        permission: "finance.read",
      },
      { href: "calculator", labelKey: "calculator", icon: Calculator, hue: "grey" },
      { href: "users", labelKey: "users", icon: Users, hue: "grey", permission: "users.invite" },
      {
        href: "billing",
        labelKey: "billing",
        icon: CreditCard,
        hue: "grey",
        permission: "tenant.billing",
      },
      {
        href: "settings",
        labelKey: "settings",
        icon: Settings,
        hue: "grey",
        permission: "settings.manage",
      },
    ],
  },
  {
    // The first labelled section. `platform.tenants` is in no tenant role's
    // bundle, so for everyone except a superuser this whole group filters to
    // empty and the header is not rendered at all. The console lives at
    // /admin, which is also the address a superuser signs in through.
    titleKey: "platform",
    items: [
      {
        href: "admin",
        labelKey: "platform",
        icon: Globe,
        hue: "grey",
        permission: "platform.tenants",
      },
    ],
  },
];

// The "Website" section — Website Translations and Service Pages — is
// deliberately absent. The marketing-site CMS is not part of what a bureau
// does day to day, and it was the only reason the sidebar needed section
// headers at all. The routes still exist and still work if visited directly;
// only the navigation entries are gone.

/**
 * Maps a detail/edit route back to the list section that should highlight,
 * so /translations/1145 keeps "Translations" active. The PHP does this with an
 * explicit page-name map; route-segment matching gives it to us for free, but
 * these aliases cover the cases where the segment differs from the nav href.
 */
export const SECTION_ALIASES: Record<string, string> = {
  orders: "translations",
  order: "translations",
};

/**
 * A section's icon and hue, for the header of each of its pages:
 * `<PageHeader {...sectionMark("clients")} title=… />`. Looked up here by
 * href, so a page title can never drift from the sidebar. Empty for a route
 * with no sidebar entry (Account), which then gets no chip.
 */
export function sectionMark(href: string): { icon?: LucideIcon; hue?: Hue } {
  for (const section of NAVIGATION) {
    const item = section.items.find((candidate) => candidate.href === href);
    if (item) return { icon: item.icon, hue: item.hue };
  }
  return {};
}

/** Resolve the active nav href from a pathname like `/ka/translations/1145`. */
export function activeSection(pathname: string, locale: string): string {
  const withoutLocale = pathname.replace(new RegExp(`^/${locale}(?=/|$)`), "");
  const segment = withoutLocale.split("/").filter(Boolean)[0] ?? "dashboard";
  return SECTION_ALIASES[segment] ?? segment;
}
