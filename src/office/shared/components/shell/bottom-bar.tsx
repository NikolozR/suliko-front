"use client";
// Moved from Suliko Office (app.suliko.ge), then changed here for the one phone
// bar (Translate's slot). Owned by suliko-front: scripts/sync-office.mjs leaves it alone.

import { Languages, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Link, usePathname } from "@office/i18n/navigation";
import type { Permission } from "@office/shared/auth/permissions";
import { type Plan, planAllows } from "@office/shared/auth/plans";
import { Button } from "@office/shared/components/ui/button";
import { activeSection, NAVIGATION, type NavItem } from "@office/shared/config/navigation";
import { HUE_CLASSES } from "@office/shared/lib/hues";
import { cn } from "@office/shared/lib/utils";
import { officeLocaleOf, WORKSPACE_SECTIONS, workspaceLocale } from "@/shared/nav/workspace";

/**
 * The sidebar entries a thumb reaches for most, in bar order. Everything
 * else stays in the drawer, one tap away behind the top bar's button.
 */
// The one phone bar, the same on Translate's screens: Dashboard and Translate,
// New order in the middle, Orders and Clients. Notifications have the bell in
// the top bar on every screen.
const BAR_ITEMS = ["dashboard", "translations", "clients"];

interface BottomBarProps {
  permissions: readonly Permission[];
  /** Gates Notifications, as in the sidebar. See `NavItem.feature`. */
  plan: Plan;
  /** Unread notifications, for the dot on the bell. */
  unreadCount?: number;
  /** The drawer is open over the page, so the bar is out of reach under its scrim. */
  hidden?: boolean;
}

/**
 * Bottom bar: the phone's navigation. Below `md` only.
 *
 * On a phone the sidebar is a drawer, so getting from an order to the client
 * list took two taps and a reach to the top corner. This keeps the four
 * everyday screens and New order under the thumb. Icons, labels, hues and
 * who may see what all come from NAVIGATION, so the bar cannot drift from
 * the sidebar.
 *
 * It takes `--bottom-bar` (globals.css) off the bottom of the screen: 56px
 * plus the home-indicator inset. `main` pads itself by the same variable.
 */
export function BottomBar({ permissions, plan, unreadCount = 0, hidden = false }: BottomBarProps) {
  const t = useTranslations("nav");
  const tShell = useTranslations("shell");
  const pathname = usePathname();
  const locale = useLocale();
  const active = activeSection(pathname, locale);

  const all = NAVIGATION.flatMap((section) => section.items);
  const items = BAR_ITEMS.map((href) => all.find((item) => item.href === href)).filter(
    (item): item is NavItem =>
      item !== undefined &&
      (!item.permission || permissions.includes(item.permission)) &&
      (!item.feature || planAllows(plan, item.feature)),
  );
  const canCreate = permissions.includes("orders.write");
  // New order sits in the middle: after the second of four entries.
  // Translate's slot, second: another root layout, so a plain link.
  const translateLabel = WORKSPACE_SECTIONS.translate[workspaceLocale(locale)];
  const translateEntry = (
    <li key="translate" className="min-w-0 flex-1 basis-0">
      <a
        href={`/${officeLocaleOf(locale)}/text`}
        className="text-muted-foreground relative flex h-full flex-col items-center justify-center gap-0.5 rounded-lg text-[0.625rem] leading-tight transition-colors"
      >
        <Languages className="text-suliko-default-color size-5" aria-hidden />
        <span className="max-w-full truncate">{translateLabel}</span>
      </a>
    </li>
  );

  const entry = (item: NavItem) => {
    const isActive = active === item.href;
    const Icon = item.icon;
    const unread = item.href === "notifications" ? unreadCount : 0;

    return (
      // Equal shares of what New order leaves. 10px labels: at 11px the
      // Georgian for Notifications does not fit a fifth of a 360px screen.
      <li key={item.href} className="min-w-0 flex-1 basis-0">
        <Link
          href={`/${item.href}`}
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "relative flex h-full flex-col items-center justify-center gap-0.5 rounded-lg",
            "text-[0.625rem] leading-tight transition-colors",
            isActive ? "text-link font-semibold" : "text-muted-foreground",
          )}
        >
          {/* The current screen: a bar over it as well as the blue, so it
              is not told apart by colour alone. */}
          {isActive && (
            <span
              aria-hidden
              className="bg-suliko-default-color absolute top-0 h-0.5 w-8 rounded-full"
            />
          )}
          <span className="relative">
            <Icon className={cn("size-5", !isActive && HUE_CLASSES[item.hue].ink)} aria-hidden />
            {unread > 0 && (
              <span
                aria-hidden
                className="bg-destructive ring-card absolute -top-0.5 -right-1 size-2 rounded-full ring-2"
              />
            )}
          </span>
          <span className="max-w-full truncate">{t(item.labelKey)}</span>
          {unread > 0 && <span className="sr-only">{tShell("unread", { count: unread })}</span>}
        </Link>
      </li>
    );
  };

  return (
    <nav
      aria-label={tShell("quickNavigation")}
      data-bottom-bar
      inert={hidden}
      className="bg-card border-border fixed inset-x-0 bottom-0 z-20 h-[var(--bottom-bar)] border-t pb-[env(safe-area-inset-bottom)] md:hidden print:hidden"
    >
      {/* The padding is room for an entry's focus ring, which the edge of
          the screen would otherwise cut off. */}
      <ul className="mx-auto flex h-full max-w-lg p-1">
        {items.slice(0, 1).map(entry)}
        {translateEntry}
        {canCreate && (
          <li className="flex flex-none items-center">
            <Button
              variant="brand"
              size="icon"
              asChild
              className="size-11 rounded-full shadow-md [&_svg:not([class*='size-'])]:size-5"
            >
              <Link href="/translations/new" aria-label={tShell("newOrder")}>
                <Plus aria-hidden />
              </Link>
            </Button>
          </li>
        )}
        {items.slice(1).map(entry)}
      </ul>
    </nav>
  );
}
