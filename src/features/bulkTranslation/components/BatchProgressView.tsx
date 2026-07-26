"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Loader2,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { Button } from "@/features/ui/components/ui/button";
import { ConfirmDialog } from "@/features/ui/components/ui/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/ui/components/ui/select";
import { useTranslatedSuffix } from "@/shared/utils/filenameUtils";
import { cn } from "@/shared/lib/utils";
import { Batch, BatchItem, BatchItemStatus } from "../types/types.Bulk";
import {
  BulkDownloadFormat,
  BulkDownloadProgress,
  downloadBatchAsZip,
  PDF_SLOW_THRESHOLD,
} from "../utils/downloadAll";
import { cancelBatch, retryFailedItems } from "../services/batchService";

interface BatchProgressViewProps {
  batch: Batch;
  projectName: string;
  onChanged: () => void;
}

const FORMAT_LABELS: Record<BulkDownloadFormat, string> = {
  docx: "Word (.docx)",
  pdf: "PDF (.pdf)",
  md: "Markdown (.md)",
  txt: "Plain text (.txt)",
};

export function BatchProgressView({
  batch,
  projectName,
  onChanged,
}: BatchProgressViewProps) {
  const [format, setFormat] = useState<BulkDownloadFormat>("docx");
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] =
    useState<BulkDownloadProgress | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmSlowPdf, setConfirmSlowPdf] = useState(false);
  const [busy, setBusy] = useState(false);
  const translatedSuffix = useTranslatedSuffix();

  const finished =
    batch.status === "Completed" ||
    batch.status === "CompletedWithErrors" ||
    batch.status === "Cancelled";

  const runDownload = async () => {
    setConfirmSlowPdf(false);
    setDownloading(true);
    setDownloadProgress(null);

    try {
      const result = await downloadBatchAsZip(
        batch.items,
        format,
        batch.name || projectName || "translations",
        translatedSuffix,
        setDownloadProgress
      );

      if (result.succeeded === 0) {
        toast.error("Nothing could be downloaded. Please try again.");
      } else if (result.failed.length > 0) {
        // Partial success is reported explicitly — a zip quietly missing three documents
        // is worse than one that says so.
        toast.success(
          `Downloaded ${result.succeeded} document${result.succeeded === 1 ? "" : "s"}. ${result.failed.length} could not be included — see _missing-documents.txt in the zip.`,
          { duration: 6000 }
        );
      } else {
        toast.success(
          `Downloaded ${result.succeeded} translation${result.succeeded === 1 ? "" : "s"}.`
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to build the download"
      );
    } finally {
      setDownloading(false);
      setDownloadProgress(null);
    }
  };

  const handleDownload = () => {
    if (format === "pdf" && batch.completedCount > PDF_SLOW_THRESHOLD) {
      setConfirmSlowPdf(true);
      return;
    }
    runDownload();
  };

  const handleRetry = async () => {
    setBusy(true);
    try {
      const result = await retryFailedItems(batch.id);
      toast.success(
        `Requeued ${result.requeuedCount} document${result.requeuedCount === 1 ? "" : "s"}.`
      );
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Retry failed");
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    setBusy(true);
    try {
      await cancelBatch(batch.id);
      toast.success("Batch cancelled.");
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cancel failed");
    } finally {
      setBusy(false);
      setConfirmCancel(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border/70 p-4 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {batch.name || "Bulk translation"}
            </p>
            <p className="text-xs text-muted-foreground">
              {batch.completedCount} of {batch.totalItems} done
              {batch.failedCount > 0 && ` · ${batch.failedCount} failed`}
              {batch.runningCount > 0 && ` · ${batch.runningCount} translating`}
            </p>
          </div>

          {!finished && (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => setConfirmCancel(true)}
            >
              Cancel
            </Button>
          )}
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-500",
              batch.failedCount > 0
                ? "bg-amber-500"
                : "bg-suliko-default-color"
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

      {batch.completedCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-muted/20 p-4">
          <Select
            value={format}
            onValueChange={(value) => setFormat(value as BulkDownloadFormat)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(
                Object.keys(FORMAT_LABELS) as BulkDownloadFormat[]
              ).map((value) => (
                <SelectItem key={value} value={value}>
                  {FORMAT_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleDownload} disabled={downloading} className="gap-2">
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {downloading
              ? downloadProgress
                ? `Preparing ${downloadProgress.completed + 1} of ${downloadProgress.total}…`
                : "Preparing…"
              : `Download all (${batch.completedCount})`}
          </Button>

          {batch.failedCount > 0 && (
            <Button
              variant="outline"
              onClick={handleRetry}
              disabled={busy}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Retry {batch.failedCount} failed
            </Button>
          )}
        </div>
      )}

      {batch.completedCount === 0 && batch.failedCount > 0 && (
        <Button
          variant="outline"
          onClick={handleRetry}
          disabled={busy}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Retry {batch.failedCount} failed
        </Button>
      )}

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel this batch?"
        description="Documents that have not started yet will be dropped. Anything already translating will finish, since it has already been charged."
        confirmLabel="Cancel batch"
        loading={busy}
        onConfirm={handleCancel}
      />

      <ConfirmDialog
        open={confirmSlowPdf}
        onOpenChange={setConfirmSlowPdf}
        title={`Build ${batch.completedCount} PDFs?`}
        description="PDFs are rendered one at a time in your browser, so this can take several minutes and will keep this tab busy. Word or Markdown are much faster."
        confirmLabel="Build PDFs"
        onConfirm={runDownload}
      />
    </div>
  );
}

const STATUS_META: Record<
  BatchItemStatus,
  { icon: typeof FileText; className: string; label: string }
> = {
  Pending: { icon: Clock, className: "text-muted-foreground", label: "Queued" },
  Running: {
    icon: Loader2,
    className: "text-suliko-default-color",
    label: "Translating",
  },
  Completed: {
    icon: CheckCircle2,
    className: "text-green-600 dark:text-green-400",
    label: "Done",
  },
  Failed: {
    icon: AlertCircle,
    className: "text-red-600 dark:text-red-400",
    label: "Failed",
  },
  Cancelled: { icon: XCircle, className: "text-muted-foreground", label: "Cancelled" },
};

function BatchItemRow({ item }: { item: BatchItem }) {
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
          <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">
            {item.errorMessage}
          </p>
        )}
      </div>

      <span className={cn("shrink-0 text-xs", meta.className)}>{meta.label}</span>
    </div>
  );
}
