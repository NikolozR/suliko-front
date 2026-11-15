// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import type { ReactNode } from "react";

import { cn } from "@office/shared/lib/utils";

/**
 * A row of linked choices that read as ONE control: a quiet track with the
 * chosen one lifted out of it. For filters and views that change the URL
 * (Orders quick filters, Reports period, Notifications), where each choice used
 * to be its own bordered chip and the chosen one a loud solid blue.
 *
 *   <SegmentedNav label="...">
 *     <RowLink className={segmentedItem(selected)} ...>Label <SegmentedCount .../></RowLink>
 *   </SegmentedNav>
 *
 * Wider than the screen, it scrolls sideways inside its track rather than
 * wrapping into a second ragged row.
 */
export function SegmentedNav({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <nav
      aria-label={label}
      className={cn(
        "scroll-fade-x bg-muted/70 border-border/70 inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-lg border p-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {children}
    </nav>
  );
}

/** The class of one choice. `selected` lifts it out of the track. */
export function segmentedItem(selected: boolean, className?: string) {
  return cn(
    "inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 pointer-coarse:py-3 text-sm font-medium whitespace-nowrap transition-colors outline-none",
    "focus-visible:ring-ring/50 focus-visible:ring-[3px]",
    selected
      ? "bg-background text-foreground shadow-[0_0_0_1px_var(--border)]"
      : "text-muted-foreground hover:text-foreground",
    className,
  );
}

/** A number after a label: muted, brand blue on the chosen one, or an urgency colour. */
export function SegmentedCount({
  selected,
  tone,
  children,
}: {
  selected: boolean;
  /** "danger" or "warning" colours a non-zero count that someone should act on. */
  tone?: "danger" | "warning";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        tone === "danger"
          ? "text-hue-red-ink"
          : tone === "warning"
            ? "text-hue-amber-ink"
            : selected
              ? "text-suliko-default-color"
              : "text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}
