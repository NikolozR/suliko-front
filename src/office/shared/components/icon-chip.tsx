// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import type { LucideIcon } from "lucide-react";

import { HUE_CLASSES, type Hue } from "@office/shared/lib/hues";
import { cn } from "@office/shared/lib/utils";

const SIZES = {
  sm: { chip: "size-6", icon: "size-3.5" },
  md: { chip: "size-8", icon: "size-4" },
  lg: { chip: "size-12", icon: "size-6" },
} as const;

/**
 * An icon on a tinted square, in a module's hue: beside a page title, on a
 * figure card, over an empty state.
 *
 * Decoration only, so it is hidden from assistive technology: the title or
 * label beside it says what the thing is, the chip just lets the eye find
 * it by colour.
 */
export function IconChip({
  icon: Icon,
  hue,
  size = "md",
  className,
}: {
  icon: LucideIcon;
  hue: Hue;
  /** sm 24px with a 14px icon, md 32px / 16px, lg 48px / 24px. */
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md",
        SIZES[size].chip,
        HUE_CLASSES[hue].soft,
        className,
      )}
    >
      <Icon className={SIZES[size].icon} />
    </span>
  );
}
