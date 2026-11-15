"use client";
// Moved from Suliko Office (app.suliko.ge), then changed here for the one
// sidebar (shared/nav/workspace.ts). Owned by suliko-front: scripts/sync-office.mjs
// leaves it alone.

import {
  officeLocaleOf,
  TRANSLATE_NAV,
  WORKSPACE_SECTIONS,
  workspaceLocale,
} from "@/shared/nav/workspace";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useEffect, useState, useSyncExternalStore } from "react";

import { Link, usePathname } from "@office/i18n/navigation";
import type { Permission } from "@office/shared/auth/permissions";
import { type Plan, planAllows } from "@office/shared/auth/plans";
import type { ShellUsage } from "@office/shared/components/shell/usage-banner";
import { activeSection, NAVIGATION } from "@office/shared/config/navigation";
import { HUE_CLASSES } from "@office/shared/lib/hues";
import { cn } from "@office/shared/lib/utils";

interface SidebarProps {
  permissions: readonly Permission[];
  /** Gates the items no permission covers. See `NavItem.feature`. */
  plan: Plan;
  collapsed: boolean;
  /** Unread counts keyed by nav href, for the activity dots. */
  activity?: Record<string, number>;
  /** This month's orders against the package: a small figure at the foot, linking to Billing. */
  usage?: ShellUsage | null;
  /** Below `md` the panel is off-canvas; this is whether it is slid in. */
  open?: boolean;
  /** Close after navigating on a phone, where the panel covers the page. */
  onNavigate?: () => void;
  /**
   * suliko.ge's translator. The same account signs in there, so this is a
   * plain link from one product to the other.
   */
  translateUrl: string;
  /**
   * suliko.ge's Orders page: the documents bureaus assigned to this person
   * as a translator. Given on a personal account only.
   */
  assignedOrdersUrl?: string;
}

const NARROW = "(max-width: 767px)";

/** Below `md`, where the panel is an off-canvas drawer. False on the server. */
function useNarrow(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(NARROW);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(NARROW).matches,
    () => false,
  );
}

/**
 * Sidebar.
 *
 * Width is 4rem collapsed / 14rem at md / 16rem at lg, driven by the
 * --sidebar-width* tokens (docs/01-DESIGN-SYSTEM.md §5). The `sidebar-main`
 * and `sidebar-item` classes carry deliberate !important overrides in
 * globals.css that stop the panel repainting when next-themes resolves —
 * do not replace them with plain Tailwind colour utilities.
 */
export function Sidebar({
  permissions,
  plan,
  collapsed,
  activity = {},
  usage = null,
  open = false,
  onNavigate,
}: SidebarProps) {
  const t = useTranslations("nav");
  const tShell = useTranslations("shell");
  const pathname = usePathname();
  const locale = useLocale();
  const [mounted, setMounted] = useState(false);
  // A drawer slid off-screen was only moved, not hidden: Tab still walked
  // through every link in it, unseen (audit F34). `inert` takes it out of
  // the Tab order and the accessibility tree until it is opened.
  const hidden = useNarrow() && !open;

  useEffect(() => setMounted(true), []);

  // usePathname() from next-intl is already locale-stripped, but activeSection
  // handles the raw form too, so this is safe either way.
  const active = activeSection(pathname, locale);

  return (
    <aside
      className={cn(
        "sidebar-main fixed inset-y-0 left-0 z-40 flex flex-col border-r pt-14 print:hidden",
        "transition-[width,transform] duration-300 ease-out",
        collapsed ? "w-16" : "w-56 lg:w-64",
        // Below `md` the panel floats over the page instead of reserving
        // space for itself — at 375px a 14rem gutter leaves nothing to read.
        open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      )}
      aria-label={t("mainNavigation")}
      inert={hidden}
    >
      <nav className="custom_scroll flex-1 overflow-y-auto px-2 py-4">
        {/* The one sidebar: Translate's section first (other root layout, so
            plain links), then Office's. */}
        <div className="mb-6">
          {!collapsed && (
            <h2 className="text-muted-foreground px-3 pb-2 text-xs font-semibold tracking-wide uppercase">
              {WORKSPACE_SECTIONS.translate[workspaceLocale(locale)]}
            </h2>
          )}
          <ul className="space-y-0.5">
            {TRANSLATE_NAV.map((item) => {
              const Icon = item.icon;
              const label = item.label[workspaceLocale(locale)];
              return (
                <li key={item.href}>
                  <a
                    href={`/${officeLocaleOf(locale)}${item.href}`}
                    title={collapsed ? label : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-md px-3 py-2 pointer-coarse:py-3.5 text-sm font-medium",
                      "transition-colors duration-150",
                      item.primary
                        ? "suliko-default-bg text-white shadow-sm hover:opacity-90"
                        : "sidebar-item",
                      collapsed && "justify-center px-0",
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    {!collapsed && <span className="truncate">{label}</span>}
                    {collapsed && <span className="sr-only">{label}</span>}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
        {!collapsed ? (
          <h2 className="text-muted-foreground px-3 pb-2 text-xs font-semibold tracking-wide uppercase">
            {WORKSPACE_SECTIONS.office[workspaceLocale(locale)]}
          </h2>
        ) : (
          <div className="border-sidebar-border mx-2 mb-2 border-t" />
        )}
        {NAVIGATION.map((section, sectionIndex) => {
          const visible = section.items.filter(
            (item) =>
              (!item.permission || permissions.includes(item.permission)) &&
              (!item.feature || planAllows(plan, item.feature)),
          );
          if (visible.length === 0) return null;

          return (
            <div key={section.titleKey ?? "main"} className={cn(sectionIndex > 0 && "mt-6")}>
              {section.titleKey && !collapsed && (
                <h2 className="text-muted-foreground px-3 pb-2 text-xs font-semibold tracking-wide uppercase">
                  {t(`sections.${section.titleKey}`)}
                </h2>
              )}
              {section.titleKey && collapsed && (
                <div className="border-sidebar-border mx-2 mb-2 border-t" />
              )}

              <ul className="space-y-0.5">
                {visible.map((item) => {
                  const isActive = active === item.href;
                  const Icon = item.icon;
                  const unread = activity[item.href] ?? 0;

                  return (
                    <li key={item.href}>
                      <Link
                        href={`/${item.href}`}
                        data-tip={`nav-${item.href}`}
                        onClick={onNavigate}
                        aria-current={isActive ? "page" : undefined}
                        title={collapsed ? t(item.labelKey) : undefined}
                        className={cn(
                          "sidebar-item group relative flex items-center gap-3 rounded-md px-3 py-2 pointer-coarse:py-3.5 text-sm font-medium",
                          "transition-colors duration-150",
                          "focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]",
                          collapsed && "justify-center px-0",
                          isActive &&
                            "suliko-default-bg !text-white hover:!text-white",
                        )}
                      >
                        {/* Each module's icon in its own hue, collapsed or not;
                            the label stays the sidebar's text colour. The
                            class sits on the icon, so the anti-flash rule on
                            the link (globals.css) is left alone. The active
                            item keeps a white icon on the brand gradient. */}
                        <Icon
                          className={cn("size-4 shrink-0", !isActive && HUE_CLASSES[item.hue].ink)}
                          aria-hidden
                        />
                        {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}

                        {/* Unread dot. Rendered only after mount so a server-rendered
                            zero never flashes into a count. */}
                        {/* The dot is decoration; the count is said in words,
                            translated. An aria-label on a bare span is not
                            read by most screen readers, and it was English
                            only (audit F37). */}
                        {mounted && item.hasActivityDot && unread > 0 && (
                          <>
                            <span
                              aria-hidden
                              className={cn(
                                "bg-destructive size-2 shrink-0 rounded-full",
                                collapsed ? "absolute top-1.5 right-1.5" : "ml-auto",
                              )}
                            />
                            <span className="sr-only">{tShell("unread", { count: unread })}</span>
                          </>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-sidebar-border space-y-1 border-t px-2 py-3">
        {usage && (
          <Link
            href="/billing"
            onClick={onNavigate}
            title={tShell("usage.title")}
            className={cn(
              "sidebar-item group flex flex-col gap-1.5 rounded-md px-3 py-2 text-xs",
              "transition-colors duration-150",
              "focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]",
              collapsed && "min-h-8 items-center justify-center px-0",
            )}
          >
            {/* The figure and a bar of how much of the package is used: brand
                blue, amber from 80 percent, red when all of it is. */}
            {collapsed ? (
              <span className="sr-only">
                {tShell("usage.figure", { orders: usage.orders, included: usage.included })}
              </span>
            ) : (
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-muted-foreground truncate">{tShell("usage.label")}</span>
                <span className="font-medium tabular-nums">
                  {usage.orders} / {usage.included}
                </span>
              </span>
            )}
            {usage.included > 0 && (
              <span
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={usage.included}
                aria-valuenow={Math.min(usage.orders, usage.included)}
                aria-label={tShell("usage.figure", { orders: usage.orders, included: usage.included })}
                className={cn("bg-border block h-1 overflow-hidden rounded-full", collapsed ? "w-8" : "w-full")}
              >
                <span
                  className={cn(
                    "block h-full rounded-full transition-[width] duration-500",
                    usage.level === "ok" && "bg-suliko-default-color",
                    usage.level === "near" && "bg-status-warning",
                    usage.level === "limit" && "bg-destructive",
                  )}
                  style={{ width: `${Math.min(100, Math.max(usage.orders > 0 ? 3 : 0, (usage.orders / usage.included) * 100))}%` }}
                />
              </span>
            )}
          </Link>
        )}
      </div>
    </aside>
  );
}
