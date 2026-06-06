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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">{t("loadingTemplates")}</span>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center p-6 text-muted-foreground text-sm">
        {t("noTemplates")}
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
                    className={`h-5 w-5 flex-shrink-0 ${
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
