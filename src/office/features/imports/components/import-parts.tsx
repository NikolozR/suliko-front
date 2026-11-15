"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

import type { ImportColumn, ImportFieldDef, ImportRow } from "@office/features/imports/api";
import { selectClass } from "@office/shared/components/form/fields";
import { Label } from "@office/shared/components/ui/label";
import { cn } from "@office/shared/lib/utils";

/** The column chosen for each field: an index into the file's columns, or none. */
export type Mapping = Record<string, number | "">;

/** Only the fields that have a column, as the API wants them. */
export function chosenOnly(mapping: Mapping): Record<string, number> {
  const chosen: Record<string, number> = {};
  for (const [key, index] of Object.entries(mapping)) {
    if (index !== "") chosen[key] = index;
  }
  return chosen;
}

/** A mapping with every field of the kind present: the guess where there is one, else none. */
export function mappingFor(fields: ImportFieldDef[], guess: Record<string, number>): Mapping {
  return Object.fromEntries(fields.map((f) => [f.key, guess[f.key] ?? ""]));
}

/** What stops a mapping being used: a required field with no column, or a column used twice. */
export function mappingProblems(fields: ImportFieldDef[], mapping: Mapping) {
  const used = Object.values(mapping).filter((v) => v !== "");
  return {
    missingRequired: fields.some((f) => f.required && mapping[f.key] === ""),
    clash: new Set(used).size !== used.length,
  };
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 rounded-md border px-3 py-2 text-sm"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}

/** Which column of the file holds which field, as one select per field. */
export function MappingGrid({
  idPrefix,
  fields,
  columns,
  mapping,
  onChange,
}: {
  idPrefix: string;
  fields: ImportFieldDef[];
  columns: ImportColumn[];
  mapping: Mapping;
  onChange: (key: string, index: number | "") => void;
}) {
  const t = useTranslations("import");
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {fields.map((fieldDef) => {
        const chosen = mapping[fieldDef.key];
        const column = chosen === "" || chosen === undefined ? undefined : columns[chosen];
        const id = `${idPrefix}-${fieldDef.key}`;
        return (
          <div key={fieldDef.key} className="min-w-0 space-y-1.5">
            <Label htmlFor={id}>
              {t(`field.${fieldDef.key}`)}
              {fieldDef.required && (
                <span className="text-destructive ml-0.5" aria-hidden>
                  *
                </span>
              )}
            </Label>
            <select
              id={id}
              className={selectClass}
              value={chosen === "" || chosen === undefined ? "" : String(chosen)}
              onChange={(e) =>
                onChange(fieldDef.key, e.target.value === "" ? "" : Number(e.target.value))
              }
            >
              <option value="">{t("notInFile")}</option>
              {columns.map((c) => (
                <option key={c.index} value={c.index}>
                  {c.header}
                </option>
              ))}
            </select>
            {column && column.sample.length > 0 && (
              <p className="text-muted-foreground truncate text-xs">
                {t("example")}: {column.sample.join(" · ")}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "good" | "bad" | "warn" | "muted";
}) {
  const colour = {
    good: "text-status-success",
    bad: "text-destructive",
    warn: "text-status-warning",
    muted: "text-muted-foreground",
  }[tone];
  return (
    <div className="rounded-md border px-3 py-2">
      <p className={cn("text-xl font-semibold tabular-nums", colour)}>{value}</p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  );
}

export function RowTable({
  title,
  rows,
  t,
  showWhy = false,
}: {
  title: string;
  rows: ImportRow[];
  t: (key: string) => string;
  showWhy?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-semibold tracking-wide uppercase">{title}</h4>
      <div className="max-h-72 overflow-auto rounded-md border">
        <table className="w-full text-xs">
          <thead className="bg-muted/50 sticky top-0 text-left">
            <tr>
              <th className="w-14 px-2 py-1.5">{t("rowCol")}</th>
              <th className="px-2 py-1.5">{t("nameCol")}</th>
              <th className="px-2 py-1.5">{showWhy ? t("whyCol") : t("savedCol")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.row} className="border-t align-top">
                <td className="text-muted-foreground px-2 py-1.5 tabular-nums">{row.row}</td>
                <td className="px-2 py-1.5">{row.name || "–"}</td>
                <td
                  className={cn(
                    "px-2 py-1.5",
                    row.status === "error" && "text-destructive",
                    row.status === "duplicate" && "text-muted-foreground",
                  )}
                >
                  {showWhy || row.status !== "ok"
                    ? [...row.messages, ...row.warnings].join(" ") || "–"
                    : row.summary.join(" · ") || "–"}
                  {!showWhy && row.status === "ok" && row.warnings.length > 0 && (
                    <span className="text-status-warning block">{row.warnings.join(" ")}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
