"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { Button } from "@/features/ui/components/ui/button";
import { ConfirmDialog } from "@/features/ui/components/ui/confirm-dialog";
import { cn } from "@/shared/lib/utils";
import { Batch, BatchItem, BatchItemStatus } from "../types/types.Bulk";
import { DownloadableDocument } from "../utils/downloadAll";
import { cancelBatch, retryFailedItems } from "../services/batchService";
import { DownloadAllButton } from "./DownloadAllButton";

interface BatchProgressViewProps {
  batch: Batch;
  projectName: string;
  onChanged: () => void;
}

export function BatchProgressView({
  batch,
  projectName,
  onChanged,
}: BatchProgressViewProps) {
  const t = useTranslations("BulkTranslation");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [busy, setBusy] = useState(false);

  const finished =
    batch.status === "Completed" ||
    batch.status === "CompletedWithErrors" ||
    batch.status === "Cancelled";

  const completedDocuments: DownloadableDocument[] = batch.items
    .filter((item) => item.status === "Completed" && item.chatId)
    .map((item) => ({
      chatId: item.chatId!,
      fileName: item.fileName,
      relativePath: item.relativePath,
    }));

  const handleRetry = async () => {
    setBusy(true);
    try {
      const result = await retryFailedItems(batch.id);
      toast.success(t("requeuedToast", { count: result.requeuedCount }));
      onChanged();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("retryFailedToast")
      );
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    setBusy(true);
    try {
      await cancelBatch(batch.id);
      toast.success(t("cancelledToast"));
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("cancelFailed"));
    } finally {
      setBusy(false);
      setConfirmCancel(false);
    }
  };

  const retryButton = batch.failedCount > 0 && (
    <Button
      variant="outline"
      onClick={handleRetry}
      disabled={busy}
      className="gap-2"
    >
      <RotateCcw className="h-4 w-4" />
      {t("retryFailed", { count: batch.failedCount })}
    </Button>
  );

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border/70 p-4 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {batch.name || t("title")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("doneOfTotal", {
                completed: batch.completedCount,
                total: batch.totalItems,
              })}
              {batch.failedCount > 0 &&
                ` · ${t("failedCount", { count: batch.failedCount })}`}
              {batch.runningCount > 0 &&
                ` · ${t("translatingCount", { count: batch.runningCount })}`}
            </p>
          </div>

          {!finished && (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => setConfirmCancel(true)}
            >
              {t("cancel")}
            </Button>
          )}
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-500",
              batch.failedCount > 0 ? "bg-amber-500" : "bg-suliko-default-color"
            )}
            style={{ width: `${batch.progressPercent}%` }}
          />
        </div>
      </div>

      <div className="divide-y divide-border/60 rounded-lg border border-border/70 overflow-hidden">
        {batch.items.map((item) => (
          <BatchItemRow key={item.id} item={item} />
        ))}
      </div>

      {completedDocuments.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-muted/20 p-4">
          <DownloadAllButton
            documents={completedDocuments}
            zipName={batch.name || projectName || "translations"}
          />
          {retryButton}
        </div>
      ) : (
        retryButton
      )}

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title={t("cancelTitle")}
        description={t("cancelDescription")}
        confirmLabel={t("cancelConfirm")}
        loading={busy}
        onConfirm={handleCancel}
      />
    </div>
  );
}

const STATUS_META: Record<
  BatchItemStatus,
  { icon: typeof FileText; className: string; labelKey: string }
> = {
  Pending: {
    icon: Clock,
    className: "text-muted-foreground",
    labelKey: "statusPending",
  },
  Running: {
    icon: Loader2,
    className: "text-suliko-default-color",
    labelKey: "statusRunning",
  },
  Completed: {
    icon: CheckCircle2,
    className: "text-green-600 dark:text-green-400",
    labelKey: "statusCompleted",
  },
  Failed: {
    icon: AlertCircle,
    className: "text-red-600 dark:text-red-400",
    labelKey: "statusFailed",
  },
  Cancelled: {
    icon: XCircle,
    className: "text-muted-foreground",
    labelKey: "statusCancelled",
  },
};

function BatchItemRow({ item }: { item: BatchItem }) {
  const t = useTranslations("BulkTranslation");
  const meta = STATUS_META[item.status];
  const Icon = meta.icon;

  const folder = item.relativePath?.includes("/")
    ? item.relativePath.slice(0, item.relativePath.lastIndexOf("/"))
    : null;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          meta.className,
          item.status === "Running" && "animate-spin"
        )}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{item.fileName}</p>
        {folder && (
          <p className="truncate text-xs text-muted-foreground">{folder}/</p>
        )}
        {item.status === "Failed" && item.errorMessage && (
          // Server-provided, so not localised — but showing it beats hiding the reason.
          <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">
            {item.errorMessage}
          </p>
        )}
      </div>

      <span className={cn("shrink-0 text-xs", meta.className)}>
        {t(meta.labelKey)}
      </span>
    </div>
  );
}
