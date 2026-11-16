// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { ChevronRight } from "lucide-react";

import { RowLink } from "@office/shared/components/data/row-link";
import { useStatusLabel } from "@office/shared/components/status-badge";
import { HUE_CLASSES } from "@office/shared/lib/hues";
import { DASHBOARD_STATUS_ORDER, getStatusHue } from "@office/shared/lib/statuses";
import { cn } from "@office/shared/lib/utils";

/**
 * The dashboard's status board: the six working statuses as a pipeline, left
 * to right in the order an order moves through them.
 *
 * Every column is always there, at 0 too, so the board keeps its shape from
 * one day to the next and an empty stage shows as clearly as a full one.
 * Each column links to the orders in that status.
 *
 * Three layouts, so the board never scrolls sideways on a laptop:
 *   below md   one row that scrolls, rather than squeezing a Georgian label
 *              into 60 pixels on a phone;
 *   md to xl   two rows of three. Beside the open sidebar a 1280px window
 *              leaves the board some 870px, too little for six in a row;
 *   xl and up  six in a row with the flow arrows, labels wrapping inside
 *              their column.
 */
export function StatusPipeline({ countOf }: { countOf: (status: string) => number }) {
  const label = useStatusLabel();

  return (
    // The padding, cancelled by the margin, is room for a column's focus
    // ring: a scroll container clips whatever pokes out of it.
    <ol className="custom_scroll -m-1 flex gap-2 p-1 pr-8 [mask-image:linear-gradient(to_right,black_calc(100%-2.5rem),transparent)] md:mask-none md:pr-1 md:grid md:grid-cols-3 md:gap-3 xl:grid-cols-6 xl:gap-4">
      {DASHBOARD_STATUS_ORDER.map((status, index) => {
        const hue = HUE_CLASSES[getStatusHue(status)];
        const count = countOf(status);

        return (
          <li key={status} className="relative min-w-36 flex-1 basis-0 md:min-w-0">
            {/* Sits in the gap before the column, to show the flow. Only in
                the single row: in two rows of three it would point from the
                end of one row at nothing. */}
            {index > 0 && (
              <ChevronRight
                aria-hidden
                className="text-muted-foreground absolute top-1/2 -left-4 hidden size-4 -translate-y-1/2 xl:block"
              />
            )}
            <RowLink
              href={`/translations?status=${encodeURIComponent(status)}`}
              className={cn(
                "relative flex h-full flex-col justify-between gap-2 overflow-hidden rounded-lg px-3 pt-3.5 pb-2.5",
                "transition-[filter] hover:brightness-95 dark:hover:brightness-125",
                hue.tint,
              )}
            >
              <span aria-hidden className={cn("absolute inset-x-0 top-0 h-[3px]", hue.dot)} />
              <span className={cn("text-sm leading-snug font-medium", hue.ink)}>
                {label(status)}
              </span>
              <span
                className={cn(
                  "text-2xl font-semibold tabular-nums",
                  count === 0 ? "text-muted-foreground" : "text-foreground",
                )}
              >
                {count}
              </span>
            </RowLink>
          </li>
        );
      })}
    </ol>
  );
}
