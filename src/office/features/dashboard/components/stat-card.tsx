// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { IconChip } from "@office/shared/components/icon-chip";
import { Card, CardContent } from "@office/shared/components/ui/card";
import { HUE_CLASSES, type Hue } from "@office/shared/lib/hues";
import { formatPercent } from "@office/shared/lib/money";
import { cn } from "@office/shared/lib/utils";

/**
 * Dashboard KPI card.
 *
 * The comparison line is deliberately like-for-like: month-to-date against the
 * SAME number of days of the previous month, with the previous month's full
 * total shown alongside. Comparing a partial month against a full one is the
 * easy mistake here and it makes every early-month figure look catastrophic.
 * See docs/02-PRODUCT-SPEC.md §4.1.
 */

export interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  /** The icon chip's colour, so four cards in a row can be told apart at a glance. */
  hue?: Hue;
  /** Ratio, e.g. 0.37 for +37%. Null renders no comparison row. */
  delta?: number | null;
  /** The "vs first N days of last month" clause. */
  deltaLabel?: string;
  /** The "Last month: X by day N · Y in full" clause. */
  footnote?: string;
  /** A pill beside the value, e.g. "53% margin". */
  pill?: string;
  /** Extra rows rendered under a divider — used by the All Time card. */
  children?: ReactNode;
}

export function StatCard({
  label,
  value,
  icon,
  hue = "grey",
  delta,
  deltaLabel,
  footnote,
  pill,
  children,
}: StatCardProps) {
  const hasDelta = delta !== null && delta !== undefined && Number.isFinite(delta);
  const positive = hasDelta && delta >= 0;
  const DeltaIcon = positive ? ArrowUpRight : ArrowDownRight;

  return (
    // py-0: the Card's own 24px on top of the content's 20px put 44px of
    // air above every label.
    <Card className="h-full py-0">
      {/* A column as tall as the row's tallest card, so the footnote can sit
          on the bottom edge instead of leaving the spare height under it. */}
      <CardContent className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          {/* A label, not a heading: "Revenue" as an h2 put eight stat
              names above the page's real sections in the outline (F19).
              One line, so the values of a row share a baseline; the title
              has the whole of a label that is cut. */}
          <p className="text-muted-foreground line-clamp-1 text-sm font-medium" title={label}>
            {label}
          </p>
          <IconChip icon={icon} hue={hue} size="sm" />
        </div>

        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          <span className="text-2xl font-semibold tabular-nums">{value}</span>
          {pill && (
            <span
              className={cn("rounded-full px-2 py-0.5 text-xs font-medium", HUE_CLASSES.green.soft)}
            >
              {pill}
            </span>
          )}
        </div>

        {hasDelta && (
          <p
            className={cn(
              "mt-2 flex items-center gap-1 text-xs",
              positive ? "text-hue-green-ink" : "text-hue-red-ink",
            )}
          >
            <DeltaIcon className="size-3.5 shrink-0" aria-hidden />
            <span className="font-medium">{formatPercent(Math.abs(delta))}</span>
            {deltaLabel && <span className="text-muted-foreground">{deltaLabel}</span>}
          </p>
        )}

        {footnote && <p className="text-muted-foreground mt-auto pt-3 text-xs">{footnote}</p>}

        {children && <div className="border-border mt-4 space-y-1.5 border-t pt-3">{children}</div>}
      </CardContent>
    </Card>
  );
}

/** A label/value row inside a StatCard's footer block. */
export function StatRow({
  label,
  value,
  sublabel,
  tone = "default",
}: {
  label: string;
  value: string;
  sublabel?: string;
  tone?: "default" | "danger";
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-muted-foreground">
        {label}
        {sublabel && <span className="text-muted-foreground/70 block text-xs">{sublabel}</span>}
      </span>
      <span
        className={cn(
          "shrink-0 font-medium tabular-nums",
          tone === "danger" && "text-destructive",
        )}
      >
        {value}
      </span>
    </div>
  );
}
