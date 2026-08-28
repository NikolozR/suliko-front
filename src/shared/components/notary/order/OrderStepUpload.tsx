"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { FileText, Upload, X } from "lucide-react";
import {
  ACCEPT_ATTRIBUTE,
  ALLOWED_EXTENSIONS,
  MAX_FILES_PER_DOCUMENT,
  MAX_FILE_BYTES,
  hasAllowedExtension,
} from "@/shared/utils/notaryOrderConfig";
import type { OrderDocument, OrderState } from "./orderState";

interface Props {
  state: OrderState;
  onPatchDocument: (id: number, patch: Partial<OrderDocument>) => void;
}

const formatSize = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export default function OrderStepUpload({ state, onPatchDocument }: Props) {
  const t = useTranslations("NotaryPage.order");
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [rejections, setRejections] = useState<Record<number, string[]>>({});
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  /**
   * The extension check runs here, not just via `accept=` — drag-drop bypasses
   * `accept`, and an unsupported file would otherwise be rejected by the server
   * *after* the order is already placed.
   */
  const acceptFiles = (doc: OrderDocument, incoming: FileList | File[]) => {
    const rejected: string[] = [];
    const accepted: File[] = [];
    let slots = MAX_FILES_PER_DOCUMENT - doc.files.length;

    Array.from(incoming).forEach((file) => {
      if (!hasAllowedExtension(file.name)) {
        rejected.push(t("uploadRejectType", { name: file.name }));
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        rejected.push(t("uploadRejectSize", { name: file.name }));
        return;
      }
      if (doc.files.some((f) => f.name === file.name && f.size === file.size)) {
        return; // silently ignore an exact duplicate
      }
      if (slots <= 0) {
        rejected.push(t("uploadRejectCount", { name: file.name }));
        return;
      }
      slots -= 1;
      accepted.push(file);
    });

    if (accepted.length > 0) {
      onPatchDocument(doc.id, { files: [...doc.files, ...accepted] });
    }
    setRejections((prev) => ({ ...prev, [doc.id]: rejected }));
  };

  const removeFile = (doc: OrderDocument, index: number) => {
    onPatchDocument(doc.id, { files: doc.files.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-5">
      <p className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        {t("uploadOptional")}
      </p>

      {state.documents.map((doc, index) => {
        const full = doc.files.length >= MAX_FILES_PER_DOCUMENT;
        const docRejections = rejections[doc.id] ?? [];

        return (
          <div key={doc.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <FileText className="h-4 w-4 text-suliko-default-color" />
                {t("document")} #{index + 1}
              </span>
              <span className="text-xs text-muted-foreground">
                {doc.files.length} / {MAX_FILES_PER_DOCUMENT}
              </span>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                if (!full) setDragOverId(doc.id);
              }}
              onDragLeave={() => setDragOverId(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverId(null);
                if (!full) acceptFiles(doc, e.dataTransfer.files);
              }}
              onClick={() => {
                if (!full) inputRefs.current[doc.id]?.click();
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && !full) {
                  e.preventDefault();
                  inputRefs.current[doc.id]?.click();
                }
              }}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-7 text-center transition-colors ${
                full
                  ? "cursor-not-allowed border-border bg-muted/20 opacity-60"
                  : dragOverId === doc.id
                    ? "cursor-pointer border-suliko-default-color bg-suliko-default-color/5"
                    : "cursor-pointer border-border hover:border-suliko-default-color/50 hover:bg-muted/30"
              }`}
            >
              <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                {full ? t("uploadFull") : t("uploadPrompt")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("uploadLimits", {
                  size: MAX_FILE_BYTES / (1024 * 1024),
                  count: MAX_FILES_PER_DOCUMENT,
                })}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground/70">
                {ALLOWED_EXTENSIONS.join(" · ")}
              </p>

              <input
                ref={(el) => {
                  inputRefs.current[doc.id] = el;
                }}
                type="file"
                multiple
                accept={ACCEPT_ATTRIBUTE}
                className="hidden"
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  if (e.target.files) acceptFiles(doc, e.target.files);
                  e.target.value = "";
                }}
              />
            </div>

            {/* Rejections */}
            {docRejections.length > 0 && (
              <ul className="space-y-1">
                {docRejections.map((message) => (
                  <li key={message} className="text-xs text-red-500">
                    {message}
                  </li>
                ))}
              </ul>
            )}

            {/* Selected files */}
            {doc.files.length > 0 && (
              <ul className="space-y-2">
                {doc.files.map((file, fileIndex) => (
                  <li
                    key={`${file.name}-${file.size}-${fileIndex}`}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {file.name}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatSize(file.size)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(doc, fileIndex)}
                      aria-label={t("remove")}
                      className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
