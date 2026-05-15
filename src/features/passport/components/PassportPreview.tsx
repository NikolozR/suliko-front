"use client";
import React, { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, ImageOff, Eye } from "lucide-react";
import { getPassportPreview } from "../services/passportService";

interface Props {
  templateId: string;
  docxUrl: string;
  fields: Record<string, string>;
}

export default function PassportPreview({ templateId, docxUrl, fields }: Props) {
  const t = useTranslations("Passport");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;

  async function handleGeneratePreview() {
    if (!templateId || !docxUrl || loading) return;
    setLoading(true);
    setError("");
    try {
      const result = await getPassportPreview(templateId, docxUrl, fieldsRef.current);
      if (result.success) {
        setImages(result.pageImages);
      } else {
        setError(result.errorMessage || "Preview failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    }
    setLoading(false);
  }

  if (!templateId || !docxUrl) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t("preview")}</h3>
        <button
          onClick={handleGeneratePreview}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
          {loading ? t("generatingPreview") : t("generatePreview")}
        </button>
      </div>

      {error && !loading && (
        <div className="flex flex-col items-center justify-center p-8 text-muted-foreground gap-2">
          <ImageOff className="h-7 w-7" />
          <p className="text-sm text-center">{error}</p>
          <button
            onClick={handleGeneratePreview}
            className="text-xs underline hover:text-foreground transition-colors mt-1"
          >
            {t("tryAgain")}
          </button>
        </div>
      )}

      {!loading && !error && images.length > 0 && (
        <div className="space-y-3 overflow-auto max-h-[70vh]">
          {images.map((img, i) => (
            <div
              key={i}
              className="rounded-lg border overflow-hidden bg-white shadow-sm"
            >
              <img
                src={`data:image/png;base64,${img}`}
                alt={`Page ${i + 1}`}
                className="w-full h-auto"
              />
            </div>
          ))}
        </div>
      )}

      {!loading && !error && images.length === 0 && (
        <div className="flex flex-col items-center justify-center p-10 text-muted-foreground gap-2 border-2 border-dashed rounded-xl">
          <Eye className="h-7 w-7 opacity-40" />
          <p className="text-sm">{t("previewWillAppear")}</p>
        </div>
      )}
    </div>
  );
}
