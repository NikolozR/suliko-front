"use client";
import React, { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, ImageOff } from "lucide-react";
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
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;

  useEffect(() => {
    if (!templateId || !docxUrl) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const result = await getPassportPreview(
          templateId,
          docxUrl,
          fieldsRef.current
        );
        if (result.success) {
          setImages(result.pageImages);
        } else {
          setError(result.errorMessage || "Preview failed");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Preview failed");
      }
      setLoading(false);
    }, 1500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [templateId, docxUrl, fields]);

  if (!templateId || !docxUrl) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{t("preview")}</h3>

      {loading && (
        <div className="flex items-center justify-center p-12 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">{t("generatingPreview")}</span>
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-2">
          <ImageOff className="h-8 w-8" />
          <p className="text-sm">{error}</p>
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
        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-2 border-2 border-dashed rounded-xl">
          <ImageOff className="h-8 w-8" />
          <p className="text-sm">{t("previewWillAppear")}</p>
        </div>
      )}
    </div>
  );
}
