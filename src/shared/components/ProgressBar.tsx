"use client";

import { cn } from "@/shared/lib/utils";

type ProgressBarSize = "xs" | "sm" | "md";
type ProgressBarTone = "brand" | "primary";

interface ProgressBarProps {
  /** 0–100. Ignored (and not required) when `indeterminate` is set. */
  value?: number;
  /**
   * Show a travelling shimmer instead of a filled track, for the phases where
   * we genuinely don't know how far along we are (e.g. a queued job). Honest
   * about uncertainty rather than parking a fake number on screen.
   */
  indeterminate?: boolean;
  size?: ProgressBarSize;
  tone?: ProgressBarTone;
  /**
   * Accessible name. Omit to render the bar as pure decoration
   * (`aria-hidden`) — do that when a nearby live region already announces
   * progress, so screen readers aren't read a value that changes every tick.
   */
  label?: string;
  className?: string;
  /** Extra classes for the moving fill (used by the route bar's glow). */
  fillClassName?: string;
}

const sizeClasses: Record<ProgressBarSize, string> = {
  xs: "h-[3px]",
  sm: "h-1.5",
  md: "h-2",
};

const toneClasses: Record<ProgressBarTone, string> = {
  brand: "bg-suliko-default-color",
  primary: "bg-primary",
};

/**
 * The one progress bar in the app.
 *
 * Five call sites previously hand-rolled their own track markup with four
 * different heights, two different colour tokens and three different transition
 * durations, so the same "loading" concept looked different on every screen.
 */
export default function ProgressBar({
  value = 0,
  indeterminate = false,
  size = "md",
  tone = "brand",
  label,
  className,
  fillClassName,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));

  const a11yProps = label
    ? ({
        role: "progressbar",
        "aria-label": label,
        "aria-valuemin": 0,
        "aria-valuemax": 100,
        ...(indeterminate ? {} : { "aria-valuenow": Math.round(clamped) }),
      } as const)
    : ({ "aria-hidden": true } as const);

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-full bg-muted",
        sizeClasses[size],
        className
      )}
      {...a11yProps}
    >
      {indeterminate ? (
        <div
          className={cn(
            "h-full w-2/5 rounded-full suliko-progress-indeterminate",
            toneClasses[tone],
            fillClassName
          )}
        />
      ) : (
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500 ease-out",
            toneClasses[tone],
            fillClassName
          )}
          style={{ width: `${clamped}%` }}
        />
      )}
    </div>
  );
}
