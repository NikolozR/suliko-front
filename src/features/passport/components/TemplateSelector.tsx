"use client";
import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { FileText, Loader2 } from "lucide-react";
import { listActiveTemplates } from "../services/passportTemplateService";
import type { PassportTemplate } from "../types/types.Passport";

interface Props {
  selectedTemplate: PassportTemplate | null;
  onSelect: (template: PassportTemplate) => void;
  disabled?: boolean;
}

export default function TemplateSelector({
  selectedTemplate,
  onSelect,
  disabled,
}: Props) {
  const t = useTranslations("Passport");
  const [templates, setTemplates] = useState<PassportTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listActiveTemplates()
      .then(setTemplates)
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }, []);

  const grouped = templates.reduce<Record<string, PassportTemplate[]>>(
    (acc, tmpl) => {
      const key = tmpl.country;
      if (!acc[key]) acc[key] = [];
      acc[key].push(tmpl);
      return acc;
    },
    {}
  );

  // Loading and empty: the same labelled, framed box as the list and as the
  // upload box beside it, not a line of text floating in an empty column.
  if (loading || templates.length === 0) {
    return (
      <div className="w-full">
        <label className="text-sm font-medium mb-2 block">{t("selectTemplate")}</label>
        <div
          role="status"
          className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center text-sm text-muted-foreground"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          ) : (
            <FileText className="h-6 w-6 opacity-50" aria-hidden />
          )}
          <span>{loading ? t("loadingTemplates") : t("noTemplates")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <label className="text-sm font-medium mb-2 block">{t("selectTemplate")}</label>
      <div className="space-y-3">
        {Object.entries(grouped).map(([country, tmpls]) => (
          <div key={country}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
              {country}
            </p>
            <div className="space-y-1.5">
              {tmpls.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => onSelect(tmpl)}
                  disabled={disabled}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                    selectedTemplate?.id === tmpl.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-transparent hover:border-muted-foreground/20 hover:bg-accent/50"
                  } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <FileText
                    className={`h-5 w-5 shrink-0 ${
                      selectedTemplate?.id === tmpl.id
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{tmpl.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {tmpl.fields.length} {t("fields")}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
