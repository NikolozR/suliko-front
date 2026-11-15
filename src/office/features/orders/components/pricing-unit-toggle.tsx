"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { useTranslations } from "next-intl";
import { useId } from "react";

import { PRICING_UNITS, type PricingUnit } from "@office/features/orders/pricing-unit";
import { ToggleChip } from "@office/shared/components/form/toggle-chip";

/**
 * "Calculated by: Pages / Characters": the choice an order is priced on.
 *
 * Two tags rather than a dropdown, as for delivery speed: both choices are
 * seen at once, and it is the first thing to settle before the lines below
 * ask for pages or for characters.
 */
export function PricingUnitToggle({
  value,
  onChange,
  charactersPerPage,
  disabled = false,
}: {
  value: PricingUnit;
  onChange: (unit: PricingUnit) => void;
  /** What one standard page is, when counting by characters. */
  charactersPerPage: number;
  disabled?: boolean;
}) {
  const t = useTranslations("orders");
  const labelId = useId();

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span id={labelId} className="text-sm font-medium">
          {t("pricingUnit.label")}
        </span>
        <div role="group" aria-labelledby={labelId} className="flex gap-2">
          {PRICING_UNITS.map((unit) => (
            <ToggleChip
              key={unit}
              pressed={value === unit}
              disabled={disabled}
              className="px-3 py-1.5"
              onClick={() => onChange(unit)}
            >
              {t(`pricingUnit.${unit}`)}
            </ToggleChip>
          ))}
        </div>
      </div>
      <p className="text-muted-foreground text-xs">
        {value === "characters"
          ? t("charactersHint", { count: charactersPerPage })
          : t("pricingUnit.pagesHint")}
      </p>
    </div>
  );
}
