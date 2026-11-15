"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Stamp } from "lucide-react";
import { useTranslations } from "next-intl";

import type { CopyType } from "@office/features/calculator/types";
import {
  NOTARISED_COPY_TYPES,
  UNNOTARISED_COPY_TYPES,
  copyTypeNotarises,
  withNotarisation,
} from "@office/features/orders/copy-types";
import { selectClass } from "@office/shared/components/form/fields";
import { Checkbox } from "@office/shared/components/ui/checkbox";
import { Label } from "@office/shared/components/ui/label";
import { cn } from "@office/shared/lib/utils";

/**
 * "Needs a notary?" then "which kind of copy?" — in that order, because the
 * first answer decides which copy types exist. A tick in a box the whole
 * width of the column rather than a toggle: it reads as a yes/no question.
 *
 * The box says "Notarisation" itself and has no label above it: with one, the
 * same thing was written twice, a line apart. `self-end` keeps it level with
 * the select beside it, which does have a label. Ticked, it takes the
 * notaries' plum, the colour a notary has everywhere else in the app.
 */
export function NotarisationFields({
  idPrefix,
  copyType,
  onChange,
  name,
}: {
  idPrefix: string;
  copyType: CopyType;
  onChange: (copyType: CopyType) => void;
  /** Set to post the copy type with a plain form (the document dialog). */
  name?: string;
}) {
  const t = useTranslations("orders");
  const te = useTranslations("enums.copyType");
  const notarised = copyTypeNotarises(copyType);
  const options = notarised ? NOTARISED_COPY_TYPES : UNNOTARISED_COPY_TYPES;

  return (
    <>
      <label
        htmlFor={`${idPrefix}-notary`}
        className={cn(
          "flex min-h-9 cursor-pointer items-center gap-2.5 self-end rounded-md border px-3 py-1.5 text-sm transition-colors",
          notarised ? "border-hue-plum-ink/50 bg-hue-plum-tint" : "border-input hover:bg-muted/60",
        )}
      >
        {/* Radix renders a button, which a wrapping <label> does not name:
            it was announced as an unlabelled checkbox (audit F21). */}
        <Checkbox
          id={`${idPrefix}-notary`}
          aria-labelledby={`${idPrefix}-notary-text`}
          className="size-5"
          checked={notarised}
          onCheckedChange={(checked) => onChange(withNotarisation(copyType, checked === true))}
        />
        <Stamp
          className={cn("size-4", notarised ? "text-hue-plum-ink" : "text-muted-foreground")}
          aria-hidden
        />
        <span id={`${idPrefix}-notary-text`} className="font-medium">
          {t("notarisation")}
        </span>
      </label>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-copy`}>{t("copyType")}</Label>
        <select
          id={`${idPrefix}-copy`}
          name={name}
          className={selectClass}
          value={copyType}
          onChange={(e) => onChange(e.target.value as CopyType)}
        >
          {options.map((value) => (
            <option key={value} value={value}>
              {te(value)}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
