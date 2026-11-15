"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { ArrowLeftRight, ArrowRight, Plus, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState } from "react";

import type { PairRow } from "@office/features/translators/pairs";
import { selectClass } from "@office/shared/components/form/fields";
import { Button } from "@office/shared/components/ui/button";
import { Checkbox } from "@office/shared/components/ui/checkbox";
import { Input } from "@office/shared/components/ui/input";
import { Label } from "@office/shared/components/ui/label";
import { cn } from "@office/shared/lib/utils";

export interface PairLanguage {
  code: string;
  name_en: string;
  name_ka: string;
}

interface Row extends PairRow {
  key: number;
}

let nextKey = 1;
const toRow = (pair: Partial<PairRow>): Row => ({
  key: nextKey++,
  source_language: pair.source_language ?? "",
  target_language: pair.target_language ?? "",
  rate_per_page: pair.rate_per_page ?? "",
  reverse_rate_per_page: pair.reverse_rate_per_page ?? "",
  one_way: pair.one_way ?? false,
});

/**
 * The languages a translator works in: from, into, and an optional own rate.
 *
 * A pair works both ways (KA <-> EN), which is what almost every translator
 * does; "One way only" is for the rare one who does not. Rates stay per
 * direction: the second box is the other direction's own rate, and left empty
 * it is the same as the first.
 *
 * The rows travel to the server action as JSON in one hidden field, so the
 * form stays a plain form. The dropdowns offer the bureau's active languages;
 * a code the profile already holds but the list no longer offers (a language
 * switched off since) stays selectable under its code, so saving the form
 * never drops it silently.
 */
export function LanguagePairsField({
  name,
  languages,
  initial,
  invalid = false,
  defaultRate,
  showRate = true,
}: {
  name: string;
  languages: readonly PairLanguage[];
  initial: readonly Partial<PairRow>[];
  invalid?: boolean;
  /** Shown as the rate box's placeholder: what applies when it is left blank. */
  defaultRate?: string | null;
  /**
   * False in the quick-add pop-up, which has the default rate and no more: no
   * rate boxes and no "One way only", so the pair simply works both ways.
   */
  showRate?: boolean;
}) {
  const tt = useTranslations("translators.form");
  const locale = useLocale();
  // Row keys come from a module counter, which differs between the server's
  // render and the browser's: ids must not be built from them.
  const uid = useId();
  const [rows, setRows] = useState<Row[]>(() => initial.map(toRow));

  const known = new Set(languages.map((l) => l.code));
  const extra = [
    ...new Set(rows.flatMap((r) => [r.source_language, r.target_language])),
  ].filter((code) => code && !known.has(code));
  const options = [
    ...languages.map((l) => ({ code: l.code, label: locale === "ka" ? l.name_ka : l.name_en })),
    ...extra.map((code) => ({ code, label: code.toUpperCase() })),
  ];
  const labelOf = (code: string) => options.find((o) => o.code === code)?.label ?? code;

  const update = (key: number, patch: Partial<Row>) =>
    setRows((current) => current.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  // A new row starts from the last one's source: a translator's pairs are
  // most often one language into several, or several into Georgian.
  const add = () =>
    setRows((current) => [
      ...current,
      toRow({ source_language: current.at(-1)?.source_language ?? "" }),
    ]);

  const value = JSON.stringify(
    rows.map(
      ({ source_language, target_language, rate_per_page, reverse_rate_per_page, one_way }) => ({
        source_language,
        target_language,
        rate_per_page,
        reverse_rate_per_page: one_way ? "" : reverse_rate_per_page,
        one_way,
      }),
    ),
  );

  const rateName = (from: string, to: string) =>
    from && to ? tt("rateFor", { from: labelOf(from), to: labelOf(to) }) : tt("rateLabel");

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={value} />

      {rows.length === 0 && <p className="text-muted-foreground text-sm">{tt("noPairs")}</p>}

      {rows.map((row, index) => {
        const Arrow = row.one_way ? ArrowRight : ArrowLeftRight;
        const forwardHint = row.rate_per_page.trim() || defaultRate;
        return (
          <div
            key={row.key}
            className="animate-in fade-in-0 slide-in-from-top-1 space-y-2 duration-200"
          >
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex min-w-0 flex-[3_1_18rem] items-center gap-2">
                <select
                  aria-label={tt("from")}
                  className={cn(selectClass, invalid && !row.source_language && "border-destructive")}
                  value={row.source_language}
                  onChange={(e) => update(row.key, { source_language: e.target.value })}
                >
                  <option value="">{tt("from")}</option>
                  {options.map((o) => (
                    <option key={o.code} value={o.code}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <Arrow className="text-muted-foreground size-4 shrink-0" aria-hidden />
                <select
                  aria-label={tt("to")}
                  className={cn(selectClass, invalid && !row.target_language && "border-destructive")}
                  value={row.target_language}
                  onChange={(e) => update(row.key, { target_language: e.target.value })}
                >
                  <option value="">{tt("to")}</option>
                  {options
                    .filter((o) => o.code !== row.source_language || o.code === row.target_language)
                    .map((o) => (
                      <option key={o.code} value={o.code}>
                        {o.label}
                      </option>
                    ))}
                </select>
              </div>
              <div className={cn("flex items-center gap-2", showRate && "flex-[1_1_9rem]")}>
                {showRate && (
                  <Input
                    aria-label={rateName(row.source_language, row.target_language)}
                    inputMode="decimal"
                    placeholder={defaultRate ? `${defaultRate} ₾` : tt("ratePlaceholder")}
                    value={row.rate_per_page}
                    onChange={(e) => update(row.key, { rate_per_page: e.target.value })}
                  />
                )}
                {showRate && !row.one_way && (
                  <Input
                    aria-label={rateName(row.target_language, row.source_language)}
                    inputMode="decimal"
                    placeholder={forwardHint ? `${forwardHint} ₾` : tt("ratePlaceholder")}
                    value={row.reverse_rate_per_page}
                    onChange={(e) => update(row.key, { reverse_rate_per_page: e.target.value })}
                  />
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  aria-label={tt("removePair", { number: index + 1 })}
                  onClick={() => setRows((current) => current.filter((r) => r.key !== row.key))}
                >
                  <X />
                </Button>
              </div>
            </div>
            {showRate && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`${uid}-one-way-${index}`}
                  checked={row.one_way}
                  onCheckedChange={(checked) => update(row.key, { one_way: checked === true })}
                />
                <Label
                  htmlFor={`${uid}-one-way-${index}`}
                  className="text-muted-foreground font-normal"
                >
                  {tt("oneWay")}
                </Label>
              </div>
            )}
          </div>
        );
      })}

      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus /> {tt("addPair")}
      </Button>
    </div>
  );
}
