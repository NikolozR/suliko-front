"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import {
  Check,
  FileSpreadsheet,
  FileText,
  Layers,
  Loader2,
  Stamp,
  Undo2,
  Upload,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import {
  analyseImportAction,
  commitImportAction,
  previewImportAction,
  undoImportAction,
} from "@office/features/imports/actions";
import type { BatchKind, ImportAnalysis, ImportBatch, ImportPreview } from "@office/features/imports/api";
import { CombinedImport } from "@office/features/imports/components/combined-import";
import {
  chosenOnly,
  ErrorBanner,
  MappingGrid,
  mappingProblems,
  RowTable,
  Stat,
  type Mapping,
} from "@office/features/imports/components/import-parts";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@office/shared/components/ui/card";
import { cn } from "@office/shared/lib/utils";

const KINDS: { kind: BatchKind; icon: typeof UsersRound }[] = [
  { kind: "combined", icon: Layers },
  { kind: "clients", icon: UserRound },
  { kind: "translators", icon: UsersRound },
  { kind: "notaries", icon: Stamp },
  { kind: "orders", icon: FileText },
];

/**
 * Import a bureau's own spreadsheet.
 *
 * Four steps on one screen: pick what to import, pick the file, check which
 * column is which (guessed from the headers), then look at what would happen
 * before anything is saved. The file stays in the browser and goes up with each
 * step, so the server keeps nothing in between.
 *
 * "Everything in one file" is the first choice and has steps of its own (a file
 * can hold several sheets, each a different kind): see `CombinedImport`. The
 * rest import one kind from the first sheet.
 */
export function ImportWizard({ history }: { history: ImportBatch[] }) {
  const t = useTranslations("import");
  const router = useRouter();
  const locale = useLocale();
  const fileInput = useRef<HTMLInputElement>(null);

  const [kind, setKind] = useState<BatchKind>("combined");
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<ImportAnalysis | null>(null);
  const [mapping, setMapping] = useState<Mapping>({});
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [done, setDone] = useState<ImportBatch | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const [confirmUndo, setConfirmUndo] = useState<number | null>(null);

  const reset = (keepKind = true) => {
    setFile(null);
    setAnalysis(null);
    setMapping({});
    setPreview(null);
    setDone(null);
    setError("");
    if (!keepKind) setKind("combined");
    if (fileInput.current) fileInput.current.value = "";
  };

  const body = (withMapping: boolean): FormData => {
    const data = new FormData();
    data.set("kind", kind);
    if (file) data.set("file", file, file.name);
    if (withMapping) data.set("mapping", JSON.stringify(chosenOnly(mapping)));
    return data;
  };

  const choose = (picked: File | null) => {
    setAnalysis(null);
    setPreview(null);
    setDone(null);
    setError("");
    setFile(picked);
    if (!picked) return;
    const data = new FormData();
    data.set("kind", kind);
    data.set("file", picked, picked.name);
    start(async () => {
      const result = await analyseImportAction(data);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setAnalysis(result.analysis);
      setMapping(
        Object.fromEntries(result.analysis.fields.map((f) => [f.key, result.analysis.suggested[f.key] ?? ""])),
      );
    });
  };

  const check = () => {
    setError("");
    setPreview(null);
    start(async () => {
      const result = await previewImportAction(body(true));
      if (!result.ok) setError(result.error);
      else setPreview(result.preview);
    });
  };

  const run = () => {
    setError("");
    start(async () => {
      const result = await commitImportAction(body(true));
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDone(result.batch);
      setPreview(null);
      setAnalysis(null);
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
      router.refresh();
    });
  };

  const undo = (id: number) => {
    setError("");
    start(async () => {
      const result = await undoImportAction(id);
      setConfirmUndo(null);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  };

  const { missingRequired, clash } = analysis
    ? mappingProblems(analysis.fields, mapping)
    : { missingRequired: false, clash: false };
  const when = (iso: string) =>
    new Date(iso).toLocaleString(locale === "ka" ? "ka-GE" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("title")}</CardTitle>
          <p className="text-muted-foreground text-sm">{t("intro")}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 1. What */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">{t("step1")}</h3>
            <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label={t("step1")}>
              {KINDS.map(({ kind: option, icon: Icon }) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={kind === option}
                  onClick={() => {
                    if (kind !== option) {
                      reset();
                      setKind(option);
                    }
                  }}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                    kind === option
                      ? "border-primary bg-primary/5 ring-primary/30 ring-2"
                      : "hover:bg-muted/50",
                  )}
                >
                  <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
                  <span>
                    <span className="block font-medium">{t(`kind.${option}.title`)}</span>
                    <span className="text-muted-foreground block text-xs">
                      {t(`kind.${option}.hint`)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
            {kind === "combined" && (
              <p className="text-muted-foreground text-xs">{t("combined.note")}</p>
            )}
            {kind === "translators" && (
              <p className="text-muted-foreground text-xs">{t("languagesFirst")}</p>
            )}
            {kind === "orders" && (
              <p className="text-muted-foreground text-xs">{t("ordersNote")}</p>
            )}
          </section>

          {kind === "combined" ? (
            <CombinedImport />
          ) : (
            <>
              {/* 2. The file */}
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">{t("step2")}</h3>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    ref={fileInput}
                    id="import-file"
                    type="file"
                    accept=".xlsx,.xlsm,.xls,.csv,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="sr-only"
                    onChange={(e) => choose(e.target.files?.[0] ?? null)}
                  />
                  <Button asChild variant="outline" size="sm">
                    <label htmlFor="import-file" className="cursor-pointer">
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
                <p className="text-muted-foreground text-xs">{t("fileLimits")}</p>
              </section>

              {error && <ErrorBanner message={error} />}

              {/* 3. The columns */}
              {analysis && (
                <section className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold">{t("step3")}</h3>
                    <p className="text-muted-foreground text-xs">
                      {t("rowsFound", { count: analysis.total_rows })} {t("mapHint")}
                    </p>
                  </div>
                  <MappingGrid
                    idPrefix="map"
                    fields={analysis.fields}
                    columns={analysis.columns}
                    mapping={mapping}
                    onChange={(key, index) => {
                      setPreview(null);
                      setMapping((current) => ({ ...current, [key]: index }));
                    }}
                  />
                  {clash && <p className="text-destructive text-sm">{t("clash")}</p>}
                  {missingRequired && <p className="text-destructive text-sm">{t("needName")}</p>}
                  <Button
                    type="button"
                    variant="brand"
                    size="sm"
                    disabled={pending || missingRequired || clash}
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
                  <p className="text-muted-foreground text-xs">{t("nothingSaved")}</p>

                  {preview.problems.length > 0 && (
                    <RowTable title={t("problems")} rows={preview.problems} t={t} showWhy />
                  )}
                  {preview.problems_truncated && (
                    <p className="text-muted-foreground text-xs">{t("moreProblems")}</p>
                  )}
                  <RowTable title={t("firstRows")} rows={preview.sample} t={t} />

                  {preview.will_create > 0 ? (
                    <Button type="button" variant="brand" disabled={pending} onClick={run}>
                      {pending ? <Loader2 className="animate-spin" /> : <Check />}
                      {t("run", { count: preview.will_create })}
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
                    <p className="font-medium">
                      {t("doneTitle", { count: done.created_count })}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {t("doneBody", { skipped: done.duplicate_count, errors: done.error_count })}
                    </p>
                    <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={() => reset()}>
                      {t("importAnother")}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("history")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-border divide-y text-sm">
              {history.map((batch) => (
                <li key={batch.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {t(`kind.${batch.kind}.title`)} · {batch.file_name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {when(batch.created_at)} ·{" "}
                      {t("historyCounts", {
                        created: batch.created_count,
                        skipped: batch.duplicate_count,
                        errors: batch.error_count,
                      })}
                      {batch.undone_at && ` · ${t("undone")}`}
                    </p>
                  </div>
                  {batch.can_undo &&
                    (confirmUndo === batch.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs">
                          {t("undoConfirm", { count: batch.created_count })}
                        </span>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={pending}
                          onClick={() => undo(batch.id)}
                        >
                          {pending ? <Loader2 className="animate-spin" /> : <Undo2 />}
                          {t("undoYes")}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmUndo(null)}
                        >
                          {t("cancel")}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmUndo(batch.id)}
                      >
                        <Undo2 /> {t("undo")}
                      </Button>
                    ))}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
