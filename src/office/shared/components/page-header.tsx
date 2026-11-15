// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { IconChip } from "@office/shared/components/icon-chip";
import type { Hue } from "@office/shared/lib/hues";
import { cn } from "@office/shared/lib/utils";

/**
 * Standard page header: title on the left, actions on the right, hairline
 * underneath. Every screen in Suliko Office opens with this.
 *
 * `icon` and `hue` put the section's chip beside the title. Pass them as
 * `{...sectionMark("clients")}` (shared/config/navigation) rather than by
 * hand, so they stay the sidebar's.
 */
export function PageHeader({
  title,
  description,
  icon,
  hue = "grey",
  actions,
  className,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  hue?: Hue;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border mb-6 flex flex-wrap items-center justify-between gap-3 border-b pb-4",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon && <IconChip icon={icon} hue={hue} />}
        <div className="min-w-0">
          {/* Two lines, then an ellipsis, with the whole title on hover. One
              line cut a long company name to a few words with no way to read
              the rest (audit F28). */}
          <h1 className="line-clamp-2 text-2xl font-semibold break-words" title={title}>
            {title}
          </h1>
          {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
        </div>
      </div>
      {/* No wider than the header: on a phone four buttons do not fit one
          row, and a row that could not shrink never wrapped them. It pushed
          the order page 140px off the side of a 390px screen instead. */}
      {actions && <div className="flex max-w-full flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
