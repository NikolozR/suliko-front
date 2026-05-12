"use client";
import React, { useCallback, useState } from "react";
import { Upload, X, FileImage } from "lucide-react";
import { useTranslations } from "next-intl";

interface Props {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
}

export default function PassportUpload({ file, onFileSelect, disabled }: Props) {
  const t = useTranslations("Passport");
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled) return;
      const f = e.dataTransfer.files[0];
      if (f && isValidFile(f)) onFileSelect(f);
    },
    [onFileSelect, disabled]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f && isValidFile(f)) onFileSelect(f);
      e.target.value = "";
    },
    [onFileSelect]
  );

  function isValidFile(f: File): boolean {
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    return validTypes.includes(f.type) && f.size <= 10 * 1024 * 1024;
  }

  return (
    <div className="w-full">
      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/20 hover:border-primary/50"
          } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
        >
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleChange}
            disabled={disabled}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <Upload className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium mb-1">{t("uploadTitle")}</p>
          <p className="text-xs text-muted-foreground">{t("supportedFormats")}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("maxFileSize")}</p>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-xl border bg-card">
          <FileImage className="h-8 w-8 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button
            onClick={() => onFileSelect(null)}
            disabled={disabled}
            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
