"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/features/ui/components/ui/dialog";
import { Label } from "@/features/ui/components/ui/label";
import { useUserStore } from "@/features/auth/store/userStore";
import type { DocumentFormData } from "@/features/translation/components/DocumentTranslationCard";
import { DeliverableSelect, QuoteBlock } from "@/features/translation/components/JobPanel";
import { MAX_DOCUMENT_UPLOAD_BYTES, formatBytes } from "@/features/translation/constants/uploadLimits";
import { getAllLanguages, type Language } from "@/features/translation/services/languageService";
import { prepareDocumentUpload } from "@/features/translation/services/prepareUploadService";
import { DocumentTranslateError } from "@/features/translation/services/translationService";
import {
  DEFAULT_DOCUMENT_OUTPUT_FORMAT,
  type PrepareUploadResponse,
} from "@/features/translation/types/types.Translation";
import { startTranslationProject } from "@/features/translation/utils/startTranslationProject";
import { estimateMinutes } from "@/features/translation/utils/translationEta";
import { fetchOrderFile } from "../services/ordersService";
import {
  targetKey,
  useOrderTranslationsStore,
  watchOrderTranslation,
} from "../store/orderTranslations";
import type { FileTarget } from "../types/types.Orders";
import { sulikoLanguageFor } from "../utils/translationFile";
import type { ListedFile } from "./OrderFiles";

const selectClass =
  "h-12 w-full rounded-md border border-input bg-transparent px-3 text-base md:text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30";

let languagesRequest: Promise<Language[]> | null = null;

function loadLanguages(): Promise<Language[]> {
  languagesRequest ??= getAllLanguages().catch((error: unknown) => {
    languagesRequest = null;
    throw error;
  });
  return languagesRequest;
}

interface TranslateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: FileTarget;
  file: ListedFile | null;
  /** ISO codes the order translates into; the first that suliko.ge knows is pre-selected. */
  targetLanguages: string[];
}

/**
 * Suliko's document translation, started from an order.
 *
 * Same steps as the translation screen — the file is uploaded and measured
 * first so the page cost is known before the click — but the job is then
 * handed to the order's translation watcher, which attaches the result to
 * "Translated versions" when it is ready.
 */
export function TranslateDialog({ open, onOpenChange, target, file, targetLanguages }: TranslateDialogProps) {
  const t = useTranslations("Orders");
  const tCard = useTranslations("DocumentTranslationCard");
  const locale = useLocale();
  const balance = useUserStore((state) => state.userProfile?.balance ?? 0);
  const addJob = useOrderTranslationsStore((state) => state.add);

  const [languages, setLanguages] = useState<Language[] | null>(null);
  const [languageId, setLanguageId] = useState<number | null>(null);
  const [outputFormat, setOutputFormat] = useState<number>(DEFAULT_DOCUMENT_OUTPUT_FORMAT);
  const [source, setSource] = useState<File | null>(null);
  const [prepared, setPrepared] = useState<PrepareUploadResponse | null>(null);
  const [preparePercent, setPreparePercent] = useState(0);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parents rebuild these on every render; the effect below keys on stable
  // strings and reads the latest values from here.
  const latest = useRef({ target, file, targetLanguages });
  latest.current = { target, file, targetLanguages };
  const fileId = file?.id ?? null;
  const targetId = targetKey(target);
  const languageCodes = targetLanguages.join(",");

  useEffect(() => {
    if (!open || fileId === null) return;
    let cancelled = false;
    const { target: currentTarget, file: currentFile, targetLanguages: codes } = latest.current;
    if (!currentFile) return;

    setSource(null);
    setPrepared(null);
    setPreparePercent(0);
    setStarting(false);
    setError(null);

    (async () => {
      try {
        const list = await loadLanguages();
        if (cancelled) return;
        setLanguages(list);
        const suggested = codes.map((code) => sulikoLanguageFor(code, list)).find(Boolean);
        setLanguageId(suggested?.id ?? null);

        if (currentFile.name.toLowerCase().endsWith(".srt")) {
          setError(t("subtitleNotSupported"));
          return;
        }

        const fetched = await fetchOrderFile(currentTarget, currentFile.id, currentFile.name);
        if (cancelled) return;
        if (fetched.size > MAX_DOCUMENT_UPLOAD_BYTES) {
          setError(t("fileTooLarge", { size: formatBytes(MAX_DOCUMENT_UPLOAD_BYTES) }));
          return;
        }
        setSource(fetched);

        const measured = await prepareDocumentUpload(fetched, {
          onProgress: (fraction) => {
            if (!cancelled) setPreparePercent(Math.round(fraction * 100));
          },
        });
        if (!cancelled) setPrepared(measured);
      } catch (loadError) {
        if (!cancelled) setError((loadError as Error).message);
      }
    })();

    return () => {
      cancelled = true;
    };
    // `t` is stable for a locale; the rest is read through `latest`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fileId, targetId, languageCodes]);

  const options = useMemo(
    () =>
      (languages ?? [])
        .map((language) => ({
          id: language.id,
          label: locale === "ka" && language.nameGeo ? language.nameGeo : language.name,
        }))
        .sort((a, b) => a.label.localeCompare(b.label, locale)),
    [languages, locale],
  );

  const suggestions = useMemo(() => {
    const found = (languages ? targetLanguages.map((code) => sulikoLanguageFor(code, languages)) : [])
      .filter((language): language is Language => language !== null);
    return found.filter((language, index) => found.findIndex((l) => l.id === language.id) === index);
  }, [languages, targetLanguages]);

  const pageCount = prepared?.pageCount ?? null;
  const etaMin = pageCount ? Math.max(1, estimateMinutes(pageCount)) : 0;
  const etaMax = pageCount ? Math.max(2, Math.round(etaMin * 1.35)) : 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const language = languages?.find((entry) => entry.id === languageId);
    if (!file || !source || !prepared || !language) return;

    setStarting(true);
    setError(null);
    try {
      const transfer = new DataTransfer();
      transfer.items.add(source);
      const form = {
        currentFile: transfer.files,
        currentTargetLanguageId: language.id,
        currentSourceLanguageId: 0,
        isSrt: false,
      } as DocumentFormData;

      const { jobId, chatId } = await startTranslationProject(
        form,
        prepared.pageCount,
        undefined,
        outputFormat,
        { prepared },
      );

      addJob({
        jobId,
        chatId,
        target,
        sourceFileName: file.name,
        targetLanguageName: language.name,
        targetLanguageLabel: options.find((option) => option.id === language.id)?.label ?? language.name,
        startedAt: Date.now(),
        phase: "translating",
        progress: 0,
        error: null,
      });
      watchOrderTranslation(jobId);
      toast.success(t("translationStarted"));
      onOpenChange(false);
    } catch (startError) {
      if (startError instanceof DocumentTranslateError && startError.reason !== "unknown") {
        setError(tCard(`translateError.${startError.reason}`));
      } else {
        setError((startError as Error).message);
      }
    } finally {
      setStarting(false);
    }
  };

  const preparing = !prepared && !error;

  return (
    <Dialog open={open} onOpenChange={(next) => !starting && onOpenChange(next)}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("translateTitle")}</DialogTitle>
          <DialogDescription className="break-all">{file?.name}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="translate-target">{t("translateInto")}</Label>
            <select
              id="translate-target"
              className={selectClass}
              value={languageId ?? ""}
              disabled={!languages || starting}
              onChange={(event) => setLanguageId(Number(event.target.value))}
            >
              <option value="" disabled>
                {languages ? t("chooseLanguage") : t("loadingLanguages")}
              </option>
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            {suggestions.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((language) => (
                  <button
                    key={language.id}
                    type="button"
                    onClick={() => setLanguageId(language.id)}
                    className={`rounded-md border px-2 py-0.5 text-xs font-medium transition-colors ${
                      languageId === language.id
                        ? "suliko-default-bg border-transparent text-primary-foreground dark:text-white"
                        : "border-border/60 bg-muted/40 text-foreground hover:bg-muted"
                    }`}
                  >
                    {options.find((option) => option.id === language.id)?.label ?? language.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <DeliverableSelect value={outputFormat} onChange={setOutputFormat} />

          <QuoteBlock
            pageCount={pageCount}
            balance={balance}
            submitLabel={
              starting
                ? tCard("submitStage.starting")
                : tCard("quote.translateCta", { count: pageCount ?? 0 })
            }
            onSubmitDisabled={!prepared || languageId === null || starting}
            etaMin={etaMin}
            etaMax={etaMax}
            busy={starting}
            pendingLabel={
              preparing
                ? preparePercent > 0
                  ? tCard("submitStage.uploading", { percent: preparePercent })
                  : tCard("submitStage.uploadingNoPercent")
                : null
            }
          />

          {error ? (
            <p className="rounded-lg border border-red-200/60 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">{t("translateAttachNote")}</p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
