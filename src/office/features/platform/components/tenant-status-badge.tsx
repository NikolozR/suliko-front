// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { useTranslations } from "next-intl";

import type { TenantStatus } from "@office/features/platform/api";
import { HUE_CLASSES, type Hue } from "@office/shared/lib/hues";
import { cn } from "@office/shared/lib/utils";

/**
 * Trial / Active / Suspended.
 *
 * Suspended is the only one rendered as an alarm: it means everyone in that
 * bureau is locked out right now, on their very next request.
 *
 * Hue tokens, not `/15` opacity tints of the status colours: those were
 * never checked for contrast on a dark card.
 */
const HUES: Record<TenantStatus, Hue> = {
  trial: "blue",
  active: "green",
  suspended: "red",
};

export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  const t = useTranslations("platform.status");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        HUE_CLASSES[HUES[status] ?? "grey"].soft,
      )}
    >
      {t.has(status) ? t(status) : status}
    </span>
  );
}
