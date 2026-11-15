"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import type { TooltipRenderProps } from "react-joyride";
import { useTranslations } from "next-intl";

import { useTips } from "@office/features/onboarding-tips/tips-provider";

const BRAND = "#3b59f3";

/** The card behind a hotspot: title, one line, how far along, and a way out. */
export function HotspotCard({ step, primaryProps, tooltipProps }: TooltipRenderProps) {
  const t = useTranslations("tips");
  const { seenCount, total } = useTips();
  return (
    <div
      {...tooltipProps}
      className="bg-popover text-popover-foreground border-border w-72 rounded-xl border p-3.5 text-[13px] leading-normal shadow-md"
    >
      {step.title && <p className="m-0 text-sm font-medium">{step.title}</p>}
      <p className="text-muted-foreground m-0 mt-0.5">{step.content}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-muted-foreground text-xs">
          {t("counter", { current: Math.min(seenCount + 1, total), total })}
        </span>
        <button
          type="button"
          {...primaryProps}
          className="rounded-md px-2.5 py-1 text-xs font-medium text-white"
          style={{ background: BRAND }}
        >
          {t("gotIt")}
        </button>
      </div>
    </div>
  );
}

/** The tour card: dark, with a thin progress line, so it reads as a different mode. */
export function TourCard({
  step,
  index,
  size,
  isLastStep,
  backProps,
  primaryProps,
  skipProps,
  tooltipProps,
}: TooltipRenderProps) {
  const t = useTranslations("tips");
  return (
    <div
      {...tooltipProps}
      className="w-72 rounded-xl p-3.5 text-[13px] leading-normal shadow-lg"
      style={{ background: "#161616", color: "#fafafa", border: "1px solid #2a2a2a" }}
    >
      {step.title && <p className="m-0 text-sm font-medium">{step.title}</p>}
      <p className="m-0 mt-0.5" style={{ color: "#a3a3a3" }}>
        {step.content}
      </p>
      <div className="mt-3 h-0.5 rounded-full" style={{ background: "#333" }}>
        <div
          className="h-0.5 rounded-full"
          style={{ background: BRAND, width: `${((index + 1) / size) * 100}%` }}
        />
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="text-xs" style={{ color: "#a3a3a3" }}>
          {t("counter", { current: index + 1, total: size })}
        </span>
        <span className="flex items-center gap-1">
          <button type="button" {...skipProps} className="px-1.5 py-1 text-xs" style={{ color: "#a3a3a3" }}>
            {t("skip")}
          </button>
          {index > 0 && (
            <button type="button" {...backProps} className="px-1.5 py-1 text-xs" style={{ color: "#fafafa" }}>
              {t("back")}
            </button>
          )}
          <button
            type="button"
            {...primaryProps}
            className="rounded-md px-2.5 py-1 text-xs font-medium text-white"
            style={{ background: BRAND }}
          >
            {isLastStep ? t("done") : t("next")}
          </button>
        </span>
      </div>
    </div>
  );
}
