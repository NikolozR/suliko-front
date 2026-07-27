"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Download, Loader2 } from "lucide-react";
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
import {
  BulkDownloadFormat,
  BulkDownloadProgress,
  DownloadableDocument,
  downloadDocumentsAsZip,
  PDF_SLOW_THRESHOLD,
} from "../utils/downloadAll";

interface DownloadAllButtonProps {
  /** Finished translations to include. An empty list disables the control. */
  documents: DownloadableDocument[];
  /** Base name for the zip, without extension. */
  zipName: string;
  disabled?: boolean;
  className?: string;
}

const FORMAT_KEYS: Record<BulkDownloadFormat, string> = {
  docx: "formatDocx",
  pdf: "formatPdf",
  md: "formatMd",
  txt: "formatTxt",
};

/**
 * Format picker plus a download button that zips a set of translations.
 *
 * Shared by the batch progress view and the project page so both offer the same formats
 * and the same warning before a slow PDF run.
 */
export function DownloadAllButton({
  documents,
  zipName,
  disabled,
  className,
}: DownloadAllButtonProps) {
  const t = useTranslations("BulkTranslation");
  const translatedSuffix = useTranslatedSuffix();

  const [format, setFormat] = useState<BulkDownloadFormat>("docx");
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<BulkDownloadProgress | null>(null);
  const [confirmSlowPdf, setConfirmSlowPdf] = useState(false);

  const runDownload = async () => {
    setConfirmSlowPdf(false);
    setDownloading(true);
    setProgress(null);

    try {
      const result = await downloadDocumentsAsZip(
        documents,
        format,
        zipName,
        translatedSuffix,
        setProgress
      );

      if (result.succeeded === 0) {
        toast.error(t("downloadNothing"));
      } else if (result.failed.length > 0) {
        // Partial success is stated explicitly — a zip quietly missing documents is worse
        // than one that says which are absent.
        toast.success(
          t("downloadPartial", {
            succeeded: result.succeeded,
            total: documents.length,
            failed: result.failed.length,
          }),
          { duration: 6000 }
        );
      } else {
        toast.success(t("downloadSuccess", { count: result.succeeded }));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("downloadFailed"));
    } finally {
      setDownloading(false);
      setProgress(null);
    }
  };

  const handleClick = () => {
    // Each PDF is rendered through html2canvas in this tab; past a certain count that is
    // minutes of unresponsiveness, so say so rather than appearing to hang.
    if (format === "pdf" && documents.length > PDF_SLOW_THRESHOLD) {
      setConfirmSlowPdf(true);
      return;
    }
    runDownload();
  };

  const label = downloading
    ? progress
      ? t("preparingProgress", {
          current: progress.completed + 1,
          total: progress.total,
        })
      : t("preparing")
    : t("downloadAll", { count: documents.length });

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={format}
          onValueChange={(value) => setFormat(value as BulkDownloadFormat)}
          disabled={downloading || disabled}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(FORMAT_KEYS) as BulkDownloadFormat[]).map((value) => (
              <SelectItem key={value} value={value}>
                {t(FORMAT_KEYS[value])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={handleClick}
          disabled={downloading || disabled || documents.length === 0}
          className="gap-2"
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {label}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmSlowPdf}
        onOpenChange={setConfirmSlowPdf}
        title={t("slowPdfTitle", { count: documents.length })}
        description={t("slowPdfDescription")}
        confirmLabel={t("slowPdfConfirm")}
        onConfirm={runDownload}
      />
    </div>
  );
}
