"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { useTranslations } from "next-intl";
import { Suspense, useCallback, useEffect, useState, type ReactNode } from "react";

import { TipsProvider, type TipsInitial } from "@office/features/onboarding-tips/tips-provider";
import type { OrgChoice } from "@office/shared/auth/actions";
import type { Permission } from "@office/shared/auth/permissions";
import type { Plan } from "@office/shared/auth/plans";
import { BottomBar } from "@office/shared/components/shell/bottom-bar";
import { EmailVerificationBanner } from "@office/shared/components/shell/email-verification-banner";
import { NavigationProgress } from "@office/shared/components/shell/navigation-progress";
import { QuickSearch } from "@office/shared/components/shell/quick-search";
import { Sidebar } from "@office/shared/components/shell/sidebar";
import { TimezoneProvider } from "@office/shared/components/timezone-context";
import { Topbar } from "@office/shared/components/shell/topbar";
import { UsageBanner, type ShellUsage } from "@office/shared/components/shell/usage-banner";
import { cn } from "@office/shared/lib/utils";

const COLLAPSE_KEY = "sidebarCollapsed";

interface AppShellProps {
  children: ReactNode;
  permissions: readonly Permission[];
  plan: Plan;
  userName: string;
  userLogin: string;
  tenantName: string;
  unreadCount?: number;
  activity?: Record<string, number>;
  /** This month's orders against the bureau's package, for those who can see Billing. */
  usage?: ShellUsage | null;
  /** The bureau's IANA timezone, provided to every client component below. */
  timeZone: string;
  /** Whether the signed-in user's address is confirmed — shows the banner. */
  emailVerified: boolean;
  /** For the organisation switcher in the top bar. */
  organizations: OrgChoice[];
  personal: OrgChoice | null;
  tenantSlug: string;
  /** First-run tips from the session; null from an API that predates them. */
  tips: TipsInitial | null;
  /** suliko.ge's translator, linked from the foot of the sidebar. */
  translateUrl: string;
  /** suliko.ge's list of orders bureaus assigned to this person; freelancers only. */
  assignedOrdersUrl?: string;
}

/**
 * Authenticated app shell: fixed topbar, collapsible sidebar, scrolling main.
 *
 * Collapse state persists to localStorage under the same key the PHP app used
 * (`sidebarCollapsed`), so a user's preference carries across the migration.
 *
 * It is read in a layout effect rather than during render because reading
 * localStorage during SSR is impossible — rendering expanded and then
 * collapsing would be a visible jump, so the sidebar is hidden until the
 * preference is known.
 *
 * ## Two different things called "the sidebar toggle"
 *
 * On a desktop the button narrows the panel to icons and `main` gives up the
 * width. On a phone there is no width to give up — a 14rem gutter on a 375px
 * screen leaves nothing readable — so the panel slides over the page instead
 * and `main` keeps the full width. Same button, two behaviours, which is why
 * `collapsed` (persisted) and `drawerOpen` (never persisted) are separate:
 * a drawer left open would otherwise cover the page on the next visit.
 *
 * Below `md` there is also a bottom bar with the everyday screens and New
 * order; the drawer is still how the rest of the navigation is reached.
 */
export function AppShell({
  children,
  permissions,
  plan,
  userName,
  userLogin,
  tenantName,
  unreadCount = 0,
  activity,
  usage = null,
  timeZone,
  emailVerified,
  organizations,
  personal,
  tenantSlug,
  tips,
  translateUrl,
  assignedOrdersUrl,
}: AppShellProps) {
  const tShell = useTranslations("shell");
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Someone who has chosen keeps their choice. Without one, a laptop or
    // tablet-width window (under 1280px) starts on the icon rail: the full
    // panel took a quarter of it and pushed table columns off the screen.
    const narrow = window.matchMedia("(max-width: 1279px)").matches;
    try {
      const stored = window.localStorage.getItem(COLLAPSE_KEY);
      setCollapsed(stored === null ? narrow : stored === "1");
    } catch {
      // Private mode / blocked storage: the width decides.
      setCollapsed(narrow);
    }
    setHydrated(true);
  }, []);

  const toggle = useCallback(() => {
    // `md` is where the sidebar stops overlaying and starts reserving space.
    // Matched to the Tailwind breakpoint the panel itself uses.
    if (window.matchMedia("(max-width: 767px)").matches) {
      setDrawerOpen((prev) => !prev);
      return;
    }

    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        // Preference simply won't persist; not worth surfacing.
      }
      return next;
    });
  }, []);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // Ctrl+K / Cmd+K opens quick search from anywhere, the shortcut most web
  // apps use for it. It works inside text fields too, which is the point:
  // it is a chord, so it cannot be typed by accident.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Escape closes the drawer, as it would any overlay.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <TimezoneProvider timeZone={timeZone}>
    <TipsProvider initial={tips}>
    <div className="bg-canvas-tint min-h-screen">
      {/* First thing a keyboard reaches: past the top bar and the sidebar,
          16 stops on Orders, straight to the page (audit F14). Hidden until
          focused. */}
      <a
        href="#content"
        className="bg-background text-foreground sr-only z-[100] rounded-md px-4 py-2 text-sm font-medium shadow-md focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        {tShell("skipToContent")}
      </a>

      {/* Reads the search params, which needs a boundary of its own. */}
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>

      <Topbar
        plan={plan}
        onToggleSidebar={toggle}
        onOpenSearch={() => setSearchOpen(true)}
        unreadCount={unreadCount}
        userName={userName}
        userLogin={userLogin}
        tenantName={tenantName}
        organizations={organizations}
        personal={personal}
        tenantSlug={tenantSlug}
      />

      <QuickSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        permissions={permissions}
        plan={plan}
        scope={tenantSlug}
      />

      {/* Scrim. Only below `md`, where the panel covers the page. */}
      {drawerOpen && (
        <button
          type="button"
          aria-label={tShell("closeNavigation")}
          onClick={closeDrawer}
          className="fixed inset-0 top-14 z-30 bg-black/50 md:hidden"
        />
      )}

      <div className={cn(!hydrated && "invisible")}>
        <Sidebar
          plan={plan}
          permissions={permissions}
          collapsed={collapsed}
          activity={activity}
          usage={usage}
          open={drawerOpen}
          onNavigate={closeDrawer}
          translateUrl={translateUrl}
          assignedOrdersUrl={assignedOrdersUrl}
        />
      </div>

      <main
        id="content"
        // Focusable by the skip link only, so focus really moves past the
        // navigation rather than just the scroll position.
        tabIndex={-1}
        className={cn(
          "min-h-screen pt-14 outline-none transition-[padding] duration-300 ease-out",
          // Room for the phone's bottom bar, so the end of a page is not
          // hidden behind it. Zero from `md` up.
          "pb-[var(--bottom-bar)]",
          // No left padding below `md`: the panel is off-canvas there, so
          // reserving space for it would push the page off the screen.
          collapsed ? "md:pl-16" : "md:pl-56 lg:pl-64",
          // On paper there is no chrome to make room for.
          "print:min-h-0 print:p-0",
        )}
      >
        <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6 print:max-w-none print:p-0">
          {!emailVerified && <EmailVerificationBanner />}
          {usage && <UsageBanner usage={usage} />}
          {children}
        </div>
      </main>

      {/* The phone's navigation. After `main` in the document, as it is on
          the screen, so the skip link and the reading order stay put. */}
      <BottomBar
        permissions={permissions}
        plan={plan}
        unreadCount={unreadCount}
        hidden={drawerOpen}
      />
    </div>
    </TipsProvider>
    </TimezoneProvider>
  );
}
