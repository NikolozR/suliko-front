"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Check, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import {
  analyseCombinedAction,
  commitCombinedAction,
  previewCombinedAction,
} from "@office/features/imports/actions";
import type {
  CombinedAnalysis,
  CombinedPreview,
  ImportBatch,
  ImportCreates,
  ImportKind,
  ImportSheet,
} from "@office/features/imports/api";
import {
  chosenOnly,
  ErrorBanner,
  MappingGrid,
  mappingFor,
  mappingProblems,
  RowTable,
  Stat,
  type Mapping,
} from "@office/features/imports/components/import-parts";
import { selectClass } from "@office/shared/components/form/fields";
import { Button } from "@office/shared/components/ui/button";
import { Label } from "@office/shared/components/ui/label";
import { cn } from "@office/shared/lib/utils";

const KINDS: ImportKind[] = ["orders", "clients", "translators", "notaries"];

type SheetKind = ImportKind | "skip";

/** What the person has decided about one sheet: what it holds, and which column is which. */
interface SheetChoice {
  kind: SheetKind;
  mapping: Mapping;
}

/**
 * Import a whole file in one go: a workbook with a sheet for each kind of record,
 * or one flat sheet that carries the client, the translator and the notary on
 * every order.
 *
 * The server works out what each sheet is and which column is which; this screen
 * shows that guess for each sheet, lets it be changed, and then shows what would
 * happen before anything is saved. Like the single-kind import, the file stays in
 * the browser and goes up with each step.
 */
export function CombinedImport() {
  const t = useTranslations("import");
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<CombinedAnalysis | null>(null);
  const [choices, setChoices] = useState<Record<number, SheetChoice>>({});
  const [preview, setPreview] = useState<CombinedPreview | null>(null);
  const [done, setDone] = useState<{
    batch: ImportBatch;
    creates: ImportCreates;
  } | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const reset = () => {
    setFile(null);
    setAnalysis(null);
    setChoices({});
    setPreview(null);
    setDone(null);
    setError("");
    if (fileInput.current) fileInput.current.value = "";
  };

  const body = (): FormData => {
    const data = new FormData();
    if (file) data.set("file", file, file.name);
    const sheets = (analysis?.sheets ?? []).map((sheet) => {
      const choice = choices[sheet.index];
      return !choice || choice.kind === "skip"
        ? { index: sheet.index, skip: true }
        : {
            index: sheet.index,
            kind: choice.kind,
            mapping: chosenOnly(choice.mapping),
          };
    });
    data.set("choices", JSON.stringify(sheets));
    return data;
  };

  const pick = (picked: File | null) => {
    reset();
    setFile(picked);
    if (!picked) return;
    const data = new FormData();
    data.set("file", picked, picked.name);
    start(async () => {
      const result = await analyseCombinedAction(data);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const { analysis: found } = result;
      setAnalysis(found);
      setChoices(
        Object.fromEntries(
          found.sheets.map((sheet) => [
            sheet.index,
            sheet.kind
              ? {
                  kind: sheet.kind,
                  mapping: mappingFor(found.fields[sheet.kind], sheet.mapping),
                }
              : { kind: "skip", mapping: {} },
          ]),
        ),
      );
    });
  };

  const setKind = (sheet: ImportSheet, kind: SheetKind) => {
    if (!analysis) return;
    setPreview(null);
    setChoices((current) => ({
      ...current,
      [sheet.index]:
        kind === "skip"
          ? { kind, mapping: {} }
          : {
              kind,
              mapping: mappingFor(analysis.fields[kind], sheet.suggested[kind]),
            },
    }));
  };

  const setColumn = (sheet: ImportSheet, key: string, index: number | "") => {
    setPreview(null);
    setChoices((current) => ({
      ...current,
      [sheet.index]: {
        ...current[sheet.index],
        mapping: { ...current[sheet.index].mapping, [key]: index },
      },
    }));
  };

  const problemsOf = (sheet: ImportSheet) => {
    const choice = choices[sheet.index];
    return !analysis || !choice || choice.kind === "skip"
      ? { missingRequired: false, clash: false }
      : mappingProblems(analysis.fields[choice.kind], choice.mapping);
  };

  const chosenSheets = (analysis?.sheets ?? []).filter(
    (sheet) => choices[sheet.index]?.kind !== "skip",
  );
  const blocked =
    chosenSheets.length === 0 ||
    chosenSheets.some((sheet) => {
      const p = problemsOf(sheet);
      return p.missingRequired || p.clash;
    });

  const check = () => {
    setError("");
    setPreview(null);
    start(async () => {
      const result = await previewCombinedAction(body());
      if (!result.ok) setError(result.error);
      else setPreview(result.preview);
    });
  };

  const run = () => {
    if (!preview) return;
    const { creates } = preview;
    setError("");
    start(async () => {
      const result = await commitCombinedAction(body());
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDone({ batch: result.batch, creates });
      setPreview(null);
      setAnalysis(null);
      setChoices({});
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
      router.refresh();
    });
  };

  const records = preview
    ? preview.creates.clients +
      preview.creates.translators +
      preview.creates.notaries +
      preview.creates.orders
    : 0;

  return (
    <>
      {/* 2. The file */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold">{t("step2")}</h3>
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInput}
            id="combined-file"
            type="file"
            accept=".xlsx,.xlsm,.xls,.csv,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            onChange={(e) => pick(e.target.files?.[0] ?? null)}
          />
          <Button asChild variant="outline" size="sm">
            <label htmlFor="combined-file" className="cursor-pointer">
              {pending && !analysis ? <Loader2 className="animate-spin" /> : <Upload />}
              {t("chooseFile")}
            </label>
          </Button>
          {file && (
            <span className="text-muted-foreground inline-flex items-center gap-1.5 text-sm">
              <FileSpreadsheet className="size-4" aria-hidden /> {file.name}
            </span>
          )}
        </div>
        <p className="text-muted-foreground text-xs">{t("combined.fileLimits")}</p>
      </section>

      {error && <ErrorBanner message={error} />}

      {/* 3. What each sheet holds */}
      {analysis && (
        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">{t("combined.step3")}</h3>
            <p className="text-muted-foreground text-xs">{t("combined.sheetsHint")}</p>
          </div>
          <div className="space-y-3">
            {analysis.sheets.map((sheet) => {
              const choice = choices[sheet.index];
              if (!choice) return null;
              return (
                <SheetCard
                  key={sheet.index}
                  sheet={sheet}
                  choice={choice}
                  fields={choice.kind === "skip" ? [] : analysis.fields[choice.kind]}
                  problems={problemsOf(sheet)}
                  onKind={(kind) => setKind(sheet, kind)}
                  onColumn={(key, index) => setColumn(sheet, key, index)}
                />
              );
            })}
          </div>
          {chosenSheets.length === 0 && (
            <p className="text-destructive text-sm">{t("combined.nothingChosen")}</p>
          )}
          <Button
            type="button"
            variant="brand"
            size="sm"
            disabled={pending || blocked}
            onClick={check}
          >
            {pending ? <Loader2 className="animate-spin" /> : <Check />}
            {t("check")}
          </Button>
        </section>
      )}

      {/* 4. What would happen */}
      {preview && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">{t("step4")}</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label={t("willCreate")} value={preview.will_create} tone="good" />
            <Stat label={t("duplicates")} value={preview.duplicates} tone="muted" />
            <Stat label={t("errorRows")} value={preview.errors} tone="bad" />
            <Stat label={t("warnings")} value={preview.with_warnings} tone="warn" />
          </div>
          <p className="text-sm">{t("combined.creates", { ...preview.creates })}</p>
          {preview.sheets.some((s) => s.kind === "orders") && (
            <p className="text-muted-foreground text-xs">{t("combined.ordersPeople")}</p>
          )}
          <p className="text-muted-foreground text-xs">{t("nothingSaved")}</p>

          {preview.sheets.map((sheet) => (
            <div key={sheet.index} className="space-y-2 rounded-lg border p-3">
              <div>
                <p className="font-medium">
                  {sheet.name} · {t(`kind.${sheet.kind}.title`)}
                </p>
                <p className="text-muted-foreground text-xs">
                  {t("combined.sheetCounts", {
                    created: sheet.will_create,
                    skipped: sheet.duplicates,
                    errors: sheet.errors,
                  })}
                  {sheet.skipped_count > 0 &&
                    ` · ${t("combined.ignored", { count: sheet.skipped_count })}`}
                </p>
              </div>
              {sheet.problems.length > 0 && (
                <RowTable title={t("problems")} rows={sheet.problems} t={t} showWhy />
              )}
              {sheet.problems_truncated && (
                <p className="text-muted-foreground text-xs">{t("moreProblems")}</p>
              )}
              <details>
                <summary className="cursor-pointer text-sm font-medium">
                  {t("combined.showRows")}
                </summary>
                <div className="pt-2">
                  <RowTable title={t("firstRows")} rows={sheet.sample} t={t} />
                </div>
              </details>
            </div>
          ))}

          {preview.will_create > 0 ? (
            <Button type="button" variant="brand" disabled={pending} onClick={run}>
              {pending ? <Loader2 className="animate-spin" /> : <Check />}
              {t("run", { count: records })}
            </Button>
          ) : (
            <p className="text-destructive text-sm">{t("nothingToImport")}</p>
          )}
        </section>
      )}

      {done && (
        <div
          role="status"
          className="border-status-success/30 bg-status-success/10 flex items-start gap-2 rounded-md border px-3 py-2 text-sm"
        >
          <Check className="text-status-success mt-0.5 size-4 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">{t("combined.done", { ...done.creates })}</p>
            <p className="text-muted-foreground text-xs">
              {t("doneBody", {
                skipped: done.batch.duplicate_count,
                errors: done.batch.error_count,
              })}
            </p>
            <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={reset}>
              {t("importAnother")}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function SheetCard({
  sheet,
  choice,
  fields,
  problems,
  onKind,
  onColumn,
}: {
  sheet: ImportSheet;
  choice: SheetChoice;
  fields: { key: string; required: boolean }[];
  problems: { missingRequired: boolean; clash: boolean };
  onKind: (kind: SheetKind) => void;
  onColumn: (key: string, index: number | "") => void;
}) {
  const t = useTranslations("import");
  const guessed = (sheet.kind ?? "skip") === choice.kind;
  const records = sheet.total_rows - sheet.skipped_count;
  return (
    <div className={cn("space-y-3 rounded-lg border p-3", choice.kind === "skip" && "bg-muted/30")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-medium">
            <FileSpreadsheet className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{sheet.name}</span>
          </p>
          <p className="text-muted-foreground text-xs">{t("combined.rows", { count: records })}</p>
        </div>
        <div className="w-full space-y-1.5 sm:w-64">
          <Label htmlFor={`sheet-${sheet.index}-kind`}>{t("combined.holds")}</Label>
          <select
            id={`sheet-${sheet.index}-kind`}
            className={selectClass}
            value={choice.kind}
            onChange={(e) => onKind(e.target.value as SheetKind)}
          >
            <option value="skip">{t("combined.skip")}</option>
            {KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {t(`kind.${kind}.title`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p
        className={cn(
          "text-xs",
          guessed && sheet.why === "unsure" ? "text-status-warning" : "text-muted-foreground",
        )}
      >
        {t(`combined.why.${guessed ? sheet.why : "chosen"}`)}
      </p>
      {sheet.skipped_count > 0 && choice.kind !== "skip" && (
        <p className="text-muted-foreground text-xs">
          {t("combined.ignored", { count: sheet.skipped_count })}
        </p>
      )}

      {choice.kind !== "skip" && (
        <details open={(guessed && sheet.why === "unsure") || problems.missingRequired}>
          <summary className="cursor-pointer text-sm font-medium">{t("combined.columns")}</summary>
          <div className="pt-3">
            <MappingGrid
              idPrefix={`sheet-${sheet.index}`}
              fields={fields}
              columns={sheet.columns}
              mapping={choice.mapping}
              onChange={onColumn}
            />
          </div>
        </details>
      )}
      {problems.clash && <p className="text-destructive text-sm">{t("clash")}</p>}
      {problems.missingRequired && (
        <p className="text-destructive text-sm">{t("combined.missing")}</p>
      )}
    </div>
  );
}
