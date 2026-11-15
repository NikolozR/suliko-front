// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { useTranslations } from "next-intl";

import { cn } from "@office/shared/lib/utils";

/**
 * Active / Off pill for reference rows.
 *
 * "Off" rather than "Inactive" because the distinction that matters is
 * whether the row is offered in the order builder, not whether it is
 * conceptually retired — an inactive language still appears on old orders.
 */
export function ActiveDot({ active }: { active: boolean }) {
  const t = useTranslations("settings");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        active ? "bg-status-success/15 text-status-success" : "bg-muted text-muted-foreground",
      )}
    >
      {active ? t("active") : t("off")}
    </span>
  );
}
