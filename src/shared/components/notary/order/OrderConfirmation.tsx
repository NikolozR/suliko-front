"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, CheckCircle2, Loader2, RotateCw } from "lucide-react";
import { SUPPORT_EMAIL } from "@/shared/utils/notaryOrderConfig";
import type { OrderResult, UploadFailure } from "@/shared/utils/notaryOrderApi";
import { formatMoney } from "@/shared/utils/notaryEstimate";

export type UploadPhase =
  | "idle"
  | "uploading"
  /** Attached to the partner order directly. */
  | "complete"
  /** Sent to the office inbox tagged with the order id — the partner's own
   *  documented route when their order response carries no document ids. */
  | "emailed"
  | "partial";

export interface UploadProgress {
  done: number;
  total: number;
  currentFileName: string;
}

interface Props {
  order: OrderResult;
  externalReference: string;
  /**
   * True on the email fallback path: the order reached the office but no
   * partner-side total exists yet, so the figure shown is our estimate and must
   * not be labelled "confirmed".
   */
  estimateOnly?: boolean;
  phase: UploadPhase;
  progress: UploadProgress;
  failures: UploadFailure[];
  onRetryUploads: () => void;
  onStartNew: () => void;
}

/**
 * Shown once the order is accepted — handoff §5.5.
 *
 * An upload failure can never make a placed order look failed, so the order
 * confirmation is rendered first and unconditionally, and every upload outcome
 * is reported next to it.
 */
export default function OrderConfirmation({
  order,
  externalReference,
  estimateOnly = false,
  phase,
  progress,
  failures,
  onRetryUploads,
  onStartNew,
}: Props) {
  const t = useTranslations("NotaryPage.order");
  const retryable = failures.some((f) => f.retryable);

  return (
    <div className="space-y-4">
      {/* Order accepted */}
      <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-5 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-600 dark:text-green-400" />
        <h3 className="text-lg font-bold text-foreground">{t("successTitle")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {estimateOnly ? t("successBodyEmail") : t("successBody")}
        </p>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {estimateOnly ? t("reference") : t("orderNumber")}
            </p>
            <p
              className={`mt-0.5 font-bold text-foreground ${
                estimateOnly ? "font-mono text-xs break-all" : "text-base"
              }`}
            >
              {estimateOnly ? order.order_id : `#${order.order_id}`}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-3">
            {/* The partner's total is authoritative; our estimate is not, and
                the two are never labelled the same way. */}
            <p className="text-xs text-muted-foreground">
              {estimateOnly ? t("estimatedTotal") : t("confirmedTotal")}
            </p>
            <p className="mt-0.5 text-base font-bold text-suliko-default-color">
              {formatMoney(Number(order.total), order.currency)}
            </p>
          </div>
        </div>

        {order.due_date && (
          <p className="mt-3 text-xs text-muted-foreground">
            {t("dueDate", { date: order.due_date })}
          </p>
        )}

        {!estimateOnly && (
          <p className="mt-3 text-[11px] text-muted-foreground/80">
            {t("reference")}: <span className="font-mono">{externalReference}</span>
          </p>
        )}
      </div>

      {/* Upload state */}
      {phase === "uploading" && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-suliko-default-color" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              {t("uploadingCount", { done: progress.done + 1, total: progress.total })}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {progress.currentFileName}
            </p>
          </div>
        </div>
      )}

      {phase === "complete" && progress.total > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
          <p className="text-sm text-foreground">
            {t("uploadComplete", { count: progress.total })}
          </p>
        </div>
      )}

      {phase === "emailed" && progress.total > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
          <p className="text-sm text-foreground">
            {t("uploadEmailed", { count: progress.total, order: String(order.order_id) })}
          </p>
        </div>
      )}

      {phase === "partial" && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                {t("uploadPartialTitle")}
              </p>
              <ul className="mt-1.5 space-y-0.5">
                {failures.map((failure) => (
                  <li key={failure.key} className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{failure.fileName}</span>
                    {" — "}
                    {failure.message}
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {retryable && (
                  <button
                    type="button"
                    onClick={onRetryUploads}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-suliko-default-color px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-suliko-default-hover-color"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    {t("retryUploads")}
                  </button>
                )}
                <a
                  href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                    `Order #${order.order_id} — files`
                  )}`}
                  className="text-xs font-medium text-suliko-default-color underline underline-offset-2"
                >
                  {t("emailFilesInstead", {
                    email: SUPPORT_EMAIL,
                    order: String(order.order_id),
                  })}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onStartNew}
        className="w-full rounded-xl border border-border bg-card py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
      >
        {t("startNewOrder")}
      </button>
    </div>
  );
}
