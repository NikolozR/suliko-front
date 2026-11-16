"use client";
// Owned by suliko-front: the bell is the one bell (Translate's feed and Office's).

import { PanelLeft, Search, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { OfficeScreenBell } from "@/features/notifications/components/OfficeScreenBell";

import { useTips } from "@office/features/onboarding-tips/tips-provider";
import { Link } from "@office/i18n/navigation";
import { SulikoLogo } from "@office/shared/components/brand/suliko-logo";
import type { OrgChoice } from "@office/shared/auth/actions";
import { type Plan, planAllows } from "@office/shared/auth/plans";
import { Button } from "@office/shared/components/ui/button";
import { OrganisationSwitcher } from "@office/shared/components/shell/organisation-switcher";
import { UserMenu } from "@office/shared/components/shell/user-menu";

interface TopbarProps {
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
  /** Hides the notifications bell on a plan that has no notifications. */
  plan: Plan;
  unreadCount?: number;
  userName: string;
  /** Email or phone they sign in with, under their name in the user menu. */
  userLogin: string;
  tenantName: string;
  organizations: OrgChoice[];
  personal: OrgChoice | null;
  tenantSlug: string;
}

/**
 * Top bar. Fixed, full-width, sits above the sidebar, and the whole bar
 * carries the Suliko gradient (docs/01-DESIGN-SYSTEM.md §1).
 *
 * Left: where you are, as the organisation switcher, so the name is shown
 * once and is also the way to somewhere else. Right: language, theme,
 * notifications, and the user menu with Account and Sign out.
 */
export function Topbar({
  onToggleSidebar,
  onOpenSearch,
  plan,
  unreadCount = 0,
  userName,
  userLogin,
  tenantName,
  organizations,
  personal,
  tenantSlug,
}: TopbarProps) {
  const t = useTranslations("shell");
  const locale = useLocale();
  const tTips = useTranslations("tips");
  const tips = useTips();

  return (
    <header className="suliko-default-bg fixed inset-x-0 top-0 z-50 flex h-14 items-center gap-2 px-3 text-white print:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        aria-label={t("toggleSidebar")}
        className="text-white hover:bg-white/15 hover:text-white"
      >
        <PanelLeft className="size-[1.1rem]" />
      </Button>

      {/* The product's own mark, home to the dashboard. Left off a phone,
          where the organisation's name needs the room. */}
      <Link
        href="/dashboard"
        aria-label={t("home")}
        className="hidden shrink-0 items-center rounded-md px-1.5 py-1 hover:bg-white/15 sm:flex"
      >
        <SulikoLogo className="h-5 w-auto" />
      </Link>

      <OrganisationSwitcher
        organizations={organizations}
        personal={personal}
        currentSlug={tenantSlug}
        currentName={tenantName}
      />

      {/* Never shrinks: the switcher on the left truncates instead, so the
          user menu stays on screen at 375px. */}
      <div className="ml-auto flex shrink-0 items-center gap-1">
        {/* A wide box on desktop, where it advertises the shortcut; just the
            icon on a phone, where there is no keyboard to press it on. */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenSearch}
          aria-label={t("search.title")}
          className="gap-2 text-white hover:bg-white/15 hover:text-white md:mr-1 md:w-56 md:justify-start md:bg-white/10 md:font-normal"
        >
          <Search className="size-4" />
          <span className="hidden flex-1 text-left text-white/80 md:inline">{t("search.button")}</span>
          <kbd className="hidden rounded border border-white/30 px-1.5 text-xs text-white/80 md:inline">
            Ctrl K
          </kbd>
        </Button>

        {tips.enabled && tips.unseen > 0 && !tips.tourRunning && (
          <Button
            variant="ghost"
            size="sm"
            onClick={tips.startTour}
            className="hidden gap-1.5 text-white hover:bg-white/15 hover:text-white lg:inline-flex"
          >
            <Sparkles className="size-4" />
            {tTips("startTour")}
          </Button>
        )}

        <OfficeScreenBell
          office={planAllows(plan, "notifications") ? { unread: unreadCount, href: `/${locale}/notifications` } : undefined}
        />

        <UserMenu name={userName} login={userLogin} />
      </div>
    </header>
  );
}
