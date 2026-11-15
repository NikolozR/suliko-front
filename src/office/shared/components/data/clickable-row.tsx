"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { useLocale } from "next-intl";
import type { MouseEvent, ReactNode } from "react";

import { useRouter } from "@office/i18n/navigation";
import { startNavigationProgress } from "@office/shared/components/shell/navigation-progress";
import { TableRow } from "@office/shared/components/ui/table";
import { cn } from "@office/shared/lib/utils";
import { withBasePath } from "@office/shared/lib/base-path";

/**
 * Anything inside a row that does its own thing on click. A click on one of
 * these is left alone, so the status dropdown, the client link and the edit
 * button keep working inside a clickable row.
 */
const INTERACTIVE =
  "a, button, input, select, textarea, label, [role='combobox'], [role='menuitem'], [data-row-ignore]";

/**
 * A table row that opens its record when clicked anywhere.
 *
 * The record's own link (the order number, the client's name) stays in the
 * row, so keyboard and screen-reader users still have a real link to tab to;
 * this only widens the target for the mouse. Ctrl/Cmd-click and middle-click
 * open a new tab, as they would on a link. A click that ends a text selection
 * does nothing, so a phone number or IBAN can still be copied out of a row.
 */
export function ClickableRow({
  href,
  className,
  children,
}: {
  /** Without the locale, as for `<Link>`. */
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const locale = useLocale();

  const open = (event: MouseEvent<HTMLTableRowElement>) => {
    if ((event.target as Element).closest(INTERACTIVE)) return;
    if (window.getSelection()?.toString()) return;

    if (event.button === 1 || event.metaKey || event.ctrlKey) {
      window.open(withBasePath(`/${locale}${href}`), "_blank", "noopener");
      return;
    }
    if (event.button !== 0) return;

    startNavigationProgress();
    router.push(href);
  };

  return (
    <TableRow
      onClick={open}
      onAuxClick={open}
      onMouseEnter={() => router.prefetch(href)}
      // A faint blue rather than the table's grey hover: blue is what a
      // link looks like here, and the whole row is one. A caller's own
      // hover (the dashboard's late rows) still wins.
      className={cn("hover:bg-hue-blue-tint/50 cursor-pointer", className)}
    >
      {children}
    </TableRow>
  );
}
