"use client";

import { useTranslations } from "next-intl";
import { FileText, Loader2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import ProgressBar from "@/shared/components/ProgressBar";
import TranslationStageList from "./TranslationStageList";
import type { JobStage } from "../types/types.Translation";

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
 * The bar is always indeterminate. The backend reports three coarse
 * checkpoints and no per-page completion, so a percentage here would be
 * invented; the stage list is what carries real information.
 */
interface Props {
  fileName: string;
  pageCount: number | null;
  stage: JobStage | null;
  chatId: string;
  failedMessage?: string | null;
}

export default function InProgressView({
  fileName,
  pageCount,
  stage,
  chatId,
  failedMessage,
}: Props) {
  const t = useTranslations("DocumentTranslationCard.inProgress");
  const failed = stage === "failed" || !!failedMessage;

  return (
    <div className="flex flex-col items-start gap-6 lg:flex-row">
      <div className="w-full min-w-0 lg:flex-1">
        <div className="rounded-xl border border-border bg-background p-6">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-[9px] bg-suliko-default-color/10">
              <FileText className="size-5 text-suliko-default-color" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[15px] font-semibold">{fileName}</h2>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                {pageCount !== null ? t("pages", { count: pageCount }) : " "}
              </p>
            </div>
            {!failed && (
              <Loader2 className="size-5 shrink-0 animate-spin text-suliko-default-color" aria-hidden />
            )}
          </div>

          {/* No bar on failure — there is no progress to show, and the
              message below carries the outcome. */}
          {!failed && (
            <ProgressBar
              indeterminate
              value={0}
              size="md"
              tone="brand"
              className="mt-5"
              label={t("working")}
            />
          )}

          {failed ? (
            <p className="mt-5 text-sm text-destructive">{failedMessage || t("failed")}</p>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">{t("leaveHint")}</p>
          )}
        </div>
      </div>

      <aside className="flex w-full flex-col gap-4 lg:w-[392px] lg:shrink-0">
        <div className="rounded-xl border border-border bg-background p-5">
          <span className="mb-4 block text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
            {t("stagesLabel")}
          </span>
          <TranslationStageList stage={stage} />
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
