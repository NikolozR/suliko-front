"use client";

import { useEffect, useState, type ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { Search } from "lucide-react";

import { OrganisationSwitcher } from "@office/shared/components/shell/organisation-switcher";
import { QuickSearch } from "@office/shared/components/shell/quick-search";
import { Toaster } from "@office/shared/components/ui/sonner";
import { planAllows } from "@office/shared/auth/plans";
import type { OfficeContext } from "@/shared/nav/officeNav";
import { officeHref } from "@/shared/nav/workspace";
import { OfficeScreenBell } from "@/features/notifications/components/OfficeScreenBell";

/**
 * Office's pieces of the top bar, drawn on Translate's screens so the bar is
 * the same everywhere (phase 3, one shell): the organisation switcher on the
 * left, search and notifications on the right. They are Office's own
 * components, so they get Office's messages here.
 */
function OfficeIntl({ office, children }: { office: OfficeContext; children: ReactNode }) {
  return (
    <NextIntlClientProvider locale={office.locale} messages={office.messages} timeZone={office.timeZone}>
      {children}
    </NextIntlClientProvider>
  );
}

export function OfficeSwitcherSlot({ office }: { office: OfficeContext }) {
  return (
    <OfficeIntl office={office}>
      <OrganisationSwitcher
        organizations={office.organizations}
        personal={office.personal}
        currentSlug={office.tenantSlug}
        currentName={office.tenantName}
      />
    </OfficeIntl>
  );
}

const BAR_BUTTON =
  "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md text-white transition-colors hover:bg-white/15";

export function OfficeActionsSlot({ office }: { office: OfficeContext }) {
  const [open, setOpen] = useState(false);

  // Ctrl+K / Cmd+K, as on Office's screens.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const searchLabel = office.locale === "ka" ? "ძებნა" : "Search";

  return (
    <OfficeIntl office={office}>
      {/* A wide box on desktop, where it shows the shortcut; just the icon on a phone. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={searchLabel}
        className={`${BAR_BUTTON} h-9 gap-2 px-2.5 text-sm pointer-coarse:h-11 md:mr-1 md:w-56 md:justify-start md:bg-white/10`}
      >
        <Search className="size-4" aria-hidden />
        <span className="hidden flex-1 text-left text-white/80 md:inline">{searchLabel}...</span>
        <kbd className="hidden rounded border border-white/30 px-1.5 text-xs text-white/80 md:inline">Ctrl K</kbd>
      </button>

      {/* The one bell: Translate's feed and, on a plan with notifications, Office's. */}
      <OfficeScreenBell
        texts={{ locale: office.notificationsLocale, messages: office.notificationsMessages }}
        office={planAllows(office.plan, "notifications") ? { unread: office.unread, href: officeHref(office.locale, "notifications") } : undefined}
      />

      <QuickSearch
        open={open}
        onOpenChange={setOpen}
        permissions={office.permissions}
        plan={office.plan}
        scope={office.tenantSlug}
        translate={office.searchTexts}
      />
      {/* The switcher reports through Office's toasts. */}
      <Toaster richColors closeButton position="top-center" />
    </OfficeIntl>
  );
}
