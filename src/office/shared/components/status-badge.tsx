// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { useTranslations } from "next-intl";

import { HUE_CLASSES } from "@office/shared/lib/hues";
import { getStatusHue, getStatusLabel, statusMessageKey } from "@office/shared/lib/statuses";
import { cn } from "@office/shared/lib/utils";

/**
 * The single way an order status is rendered anywhere in the app.
 *
 * The PHP keeps this guarantee with `includes/statuses.php`; this component is
 * its counterpart. If you find yourself writing a status colour inline, stop —
 * add it to `STATUS_DEFINITIONS` instead.
 *
 * Pills, not Bootstrap squares (docs/01-DESIGN-SYSTEM.md §7).
 *
 * Two looks. `soft` (the default) is a tinted pill with a dot in the
 * status's hue: twenty of them down a table stay readable, and Confirmed
 * (teal) no longer looks like Delivered (green). `solid` is the saturated
 * pill, kept for where one order's CURRENT status is the subject: the order
 * page, and the chosen chip of a filter. The word is always there; the
 * colour only backs it up.
 *
 * Both looks take the status's hue, so a status is one colour wherever it
 * shows. The solid pill used to take the older tone colours instead, and
 * Sent to Translator was violet in a list and sky blue on its own order.
 */

interface StatusBadgeProps {
  status: string | null | undefined;
  variant?: "soft" | "solid";
  /** How many orders are in this status, shown after the label (filter chips). */
  count?: number;
  className?: string;
}

/** A status's label in the current language, falling back to the English one. */
export function useStatusLabel(): (status: string | null | undefined) => string {
  const t = useTranslations("statuses");
  return (status) => {
    const key = statusMessageKey(status);
    return t.has(key) ? t(key) : getStatusLabel(status);
  };
}

export function StatusBadge({ status, variant = "soft", count, className }: StatusBadgeProps) {
  const label = useStatusLabel();
  const soft = variant === "soft";
  const hue = HUE_CLASSES[getStatusHue(status)];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        soft ? hue.soft : hue.solid,
        className,
      )}
    >
      {soft && <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", hue.dot)} />}
      {label(status)}
      {count !== undefined && <span className="font-semibold tabular-nums">{count}</span>}
    </span>
  );
}

/** Client-type pill (B2B / B2C), shown next to client names in lists. */
export function ClientTypeBadge({
  clientType,
  className,
}: {
  clientType: string | null | undefined;
  className?: string;
}) {
  const t = useTranslations("enums.clientType");
  const type = (clientType ?? "").toUpperCase();

  return (
    <span
      // The pill says B2B / B2C; the filters and forms say Company /
      // Individual. The full name on hover ties the two together.
      title={t.has(type) ? t(type) : undefined}
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
        // Violet and teal, as Translators and Clients are in the sidebar;
        // the brand blue is kept for actions.
        HUE_CLASSES[type === "B2B" ? "violet" : type === "B2C" ? "teal" : "grey"].soft,
        className,
      )}
    >
      {type || "–"}
    </span>
  );
}
