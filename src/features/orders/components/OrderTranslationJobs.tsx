"use client";

import { AlertCircle, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/features/ui/components/ui/button";
import {
  retryOrderTranslation,
  useOrderTranslationJobs,
  useOrderTranslationsStore,
} from "../store/orderTranslations";
import type { FileTarget } from "../types/types.Orders";

/** Suliko translations on their way into this target's "Translated versions". */
export function OrderTranslationJobs({ target }: { target: FileTarget }) {
  const t = useTranslations("Orders");
  const jobs = useOrderTranslationJobs(target);
  const remove = useOrderTranslationsStore((state) => state.remove);

  if (jobs.length === 0) return null;

  return (
    <ul className="space-y-2">
      {jobs.map((job) => {
        const failed = job.phase === "failed";
        return (
          <li
            key={job.jobId}
            className={
              failed
                ? "rounded-lg border border-red-200/60 bg-red-50/60 px-3 py-2.5 dark:border-red-800/40 dark:bg-red-950/20"
                : "rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5"
            }
          >
            <div className="flex flex-wrap items-center gap-3">
              {failed ? (
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
              ) : (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">
                  {failed
                    ? t("translationFailed")
                    : job.phase === "attaching"
                      ? t("attachingTranslation")
                      : t("translatingFile", {
                          name: job.sourceFileName,
                          language: job.targetLanguageLabel,
                        })}
                </p>
                {failed ? (
                  <p className="text-xs text-red-700 dark:text-red-400 break-words">{job.error}</p>
                ) : (
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="suliko-default-bg h-full rounded-full transition-[width] duration-500"
                      style={{ width: `${Math.max(4, job.progress)}%` }}
                    />
                  </div>
                )}
              </div>
              <Link
                href={`/translations/${job.chatId}`}
                className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {t("reviewInEditor")}
              </Link>
              {failed && (
                <>
                  <Button variant="outline" size="sm" onClick={() => retryOrderTranslation(job.jobId)}>
                    {t("retry")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("dismiss")}
                    title={t("dismiss")}
                    onClick={() => remove(job.jobId)}
                  >
                    <X />
                  </Button>
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
