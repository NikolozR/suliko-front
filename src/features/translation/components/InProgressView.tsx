"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, FileText, Loader2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import ProgressBar from "@/shared/components/ProgressBar";
import TranslationStageList from "./TranslationStageList";
import type { JobStage } from "../types/types.Translation";
import { computeProgress, isRunningLong } from "../utils/jobProgress";
import { estimateDurationMs } from "../utils/translationEta";

/**
 * What /document shows while a job runs, instead of pushing the user to
 * /translations/[chatId] the moment it starts.
 *
 * The redirect used to fire at a scripted 12%, so people were moved off the
 * screen they were working on before anything had actually happened. The job
 * now runs in place and the URL is rewritten underneath, so it stays linkable
 * and survives a reload — a refresh lands on the wait page, which renders the
 * same stages.
 *
 * The bar is real where the job gives us something to follow. A long document
 * is translated in sections and the backend says how many are back, so the bar
 * and the line under the active step follow that. A document sent as one
 * request has no signal until it finishes, so the bar follows elapsed time
 * against the expected duration, says "estimate", and never reaches the end on
 * its own. If a job runs well past the estimate the page says so, rather than
 * leaving a bar that looks frozen.
 */
interface Props {
  fileName: string;
  pageCount: number | null;
  stage: JobStage | null;
  sectionsDone?: number | null;
  sectionsTotal?: number | null;
  chatId: string;
  failedMessage?: string | null;
}

export default function InProgressView({
  fileName,
  pageCount,
  stage,
  sectionsDone = null,
  sectionsTotal = null,
  chatId,
  failedMessage,
}: Props) {
  const t = useTranslations("DocumentTranslationCard.inProgress");

  // Elapsed time since this view appeared, which is when the job started. A
  // reload restarts it, and the wait page takes over from there.
  const startedAt = useRef(Date.now());
  const [elapsedMs, setElapsedMs] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsedMs(Date.now() - startedAt.current), 1000);
    return () => clearInterval(id);
  }, []);

  const expectedMs = pageCount ? estimateDurationMs(pageCount) : 0;
  const progress = computeProgress({ stage, sectionsDone, sectionsTotal, elapsedMs, expectedMs });
  // The bar only ever moves forward, even when an estimate and a real count disagree.
  const highest = useRef(0);
  highest.current = Math.max(highest.current, progress.percent);
  const percent = highest.current;
  const hasSections = !!sectionsTotal && sectionsDone !== null;
  const runningLong = stage === "translating" && isRunningLong(elapsedMs, expectedMs);
  const minutes = Math.max(1, Math.round(expectedMs / 60_000));
  const detail = hasSections
    ? t("sectionsDone", { done: sectionsDone ?? 0, total: sectionsTotal ?? 0 })
    : null;
  const headline =
    stage === "rebuilding" ? t("workingBuilding") : stage === "translating" ? t("working") : t("workingStarting");
  const failed = stage === "failed" || !!failedMessage;
  // The job is done and the page is about to move on: say so rather than
  // leaving a spinner and a travelling bar on screen.
  const ready = stage === "ready" && !failed;

  return (
    <div className="flex flex-col items-start gap-6 lg:flex-row">
      <div className="w-full min-w-0 lg:flex-1">
        <div className={`relative rounded-xl border border-border bg-background p-6 ${!failed && !ready ? "border-beam" : ""}`}>
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-[9px] bg-suliko-default-color/10">
              <FileText className="size-5 text-accent-text" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[15px] font-semibold">{fileName}</h2>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                {pageCount !== null ? t("pages", { count: pageCount }) : " "}
              </p>
            </div>
            {ready && <Check className="size-5 shrink-0 text-emerald-600" strokeWidth={3} aria-hidden />}
            {!failed && !ready && (
              <Loader2 className="size-5 shrink-0 animate-spin text-accent-text" aria-hidden />
            )}
          </div>

          {/* No bar on failure or when done — there is no progress to show, and
              the message below carries the outcome. */}
          {!failed && !ready && (
            <>
              <ProgressBar value={percent} size="md" tone="brand" className="mt-5" label={headline} />
              <p className="mt-2 text-[13px] text-muted-foreground" aria-live="polite">
                {runningLong
                  ? t("runningLong")
                  : hasSections
                    ? detail
                    : progress.estimated && minutes > 0
                      ? t("estimate", { minutes })
                      : headline}
              </p>
            </>
          )}

          {failed ? (
            <p className="mt-5 text-sm text-destructive">{failedMessage || t("failed")}</p>
          ) : ready ? (
            <p className="mt-5 text-sm text-muted-foreground" aria-live="polite">{t("openingResult")}</p>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">{t("leaveHint")}</p>
          )}
        </div>
      </div>

      <aside className="flex w-full flex-col gap-4 lg:w-[392px] lg:shrink-0">
        <div className="rounded-xl border border-border bg-background p-5">
          <span className="mb-4 block text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">
            {t("stagesLabel")}
          </span>
          <TranslationStageList stage={stage} detail={detail} />
          {!stage && (
            // Pre-stage backends, or the gap before the first poll answers.
            <p className="text-sm text-muted-foreground">{t("startingUp")}</p>
          )}
        </div>

        <Link
          href={`/translations/${chatId}`}
          className="flex h-11 w-full items-center justify-center rounded-[10px] border border-border text-sm font-semibold transition-colors hover:bg-muted"
        >
          {t("openFullView")}
        </Link>
      </aside>
    </div>
  );
}
