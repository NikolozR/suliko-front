"use client";

import { useRef, useState } from "react";
import { Download, FileText, Languages, Loader2, Trash2, Upload } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Button } from "@/features/ui/components/ui/button";
import { ConfirmDialog } from "@/features/ui/components/ui/confirm-dialog";
import {
  deleteOrderFile,
  downloadOrderFile,
  uploadOrderFile,
} from "../services/ordersService";
import type { FileKind, FileTarget } from "../types/types.Orders";
import { formatBytes, formatDate } from "../utils/orderFormat";

/** The fields both file shapes share; Drive ids are strings, database ids numbers. */
export interface ListedFile {
  id: string | number;
  name: string;
  kind: FileKind;
  size_bytes: number | null;
  created_at: string | null;
}

interface FileSectionProps {
  title: string;
  kind: FileKind;
  target: FileTarget;
  files: ListedFile[];
  canUpload: boolean;
  uploadLabel?: string;
  canDelete: (file: ListedFile) => boolean;
  /** Shown instead of an upload button when uploading is not the user's job. */
  note?: string;
  /** Offers Suliko translation on each file — for source documents. */
  onTranslate?: (file: ListedFile) => void;
  /** Rendered above the list: translations on their way into this section. */
  children?: React.ReactNode;
  onChanged: () => void;
}

export function FileSection({
  title,
  kind,
  target,
  files,
  canUpload,
  uploadLabel,
  canDelete,
  note,
  onTranslate,
  children,
  onChanged,
}: FileSectionProps) {
  const t = useTranslations("Orders");
  const locale = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [busyFile, setBusyFile] = useState<string | number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ListedFile | null>(null);

  const handleFiles = async (selected: FileList | null) => {
    if (!selected?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(selected)) {
        await uploadOrderFile(target, file, kind);
      }
      toast.success(t("uploaded"));
      onChanged();
    } catch (error) {
      toast.error(t("uploadFailed", { message: (error as Error).message }));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDownload = async (file: ListedFile) => {
    setBusyFile(file.id);
    try {
      await downloadOrderFile(target, file.id);
    } catch (error) {
      toast.error(t("downloadFailed", { message: (error as Error).message }));
    } finally {
      setBusyFile(null);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setBusyFile(pendingDelete.id);
    try {
      await deleteOrderFile(target, pendingDelete.id);
      onChanged();
    } catch (error) {
      toast.error(t("deleteFailed", { message: (error as Error).message }));
    } finally {
      setBusyFile(null);
      setPendingDelete(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
        {canUpload && (
          <>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => void handleFiles(event.target.files)}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
              {uploading ? t("uploading") : uploadLabel}
            </Button>
          </>
        )}
      </div>

      {note && <p className="text-xs text-muted-foreground">{note}</p>}

      {children}

      {files.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noFiles")}</p>
      ) : (
        <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
          {files.map((file) => (
            <li key={file.id} className="flex items-center gap-3 px-3 py-2">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {[formatBytes(file.size_bytes), formatDate(file.created_at, locale)]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              {onTranslate && (
                <Button
                  variant="outline"
                  size="sm"
                  className="suliko-default-bg border-transparent text-primary-foreground hover:opacity-90 dark:text-white"
                  aria-label={t("translate")}
                  title={t("translate")}
                  onClick={() => onTranslate(file)}
                >
                  <Languages />
                  <span className="hidden sm:inline">{t("translate")}</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("download")}
                title={t("download")}
                disabled={busyFile === file.id}
                onClick={() => void handleDownload(file)}
              >
                {busyFile === file.id ? <Loader2 className="animate-spin" /> : <Download />}
              </Button>
              {canDelete(file) && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("delete")}
                  title={t("delete")}
                  disabled={busyFile === file.id}
                  onClick={() => setPendingDelete(file)}
                >
                  <Trash2 className="text-red-600 dark:text-red-400" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={t("deleteFileTitle")}
        description={t("deleteFileDescription", { name: pendingDelete?.name ?? "" })}
        confirmLabel={t("delete")}
        onConfirm={() => void handleDelete()}
        loading={pendingDelete !== null && busyFile === pendingDelete.id}
      />
    </div>
  );
}
