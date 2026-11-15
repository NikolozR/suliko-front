"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { useLocale } from "next-intl";
import { useTransition } from "react";

import { usePathname, useRouter } from "@office/i18n/navigation";
import type { Locale } from "@office/i18n/routing";

/** Swap the interface language, staying on the same page with its filters. */
export function useLocaleSwitch() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === locale) return;
    // Swapping the locale re-renders the whole tree; a transition keeps the
    // current page interactive while it happens.
    startTransition(() => {
      // With the query string: switching language must not drop the filters
      // and page the user was looking at.
      router.replace(`${pathname}${window.location.search}`, { locale: next });
    });
  }

  return { locale, switchTo, isPending };
}
