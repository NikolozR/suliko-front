"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import type { PassportTemplateField } from "../types/types.Passport";

interface Props {
  fields: PassportTemplateField[];
  values: Record<string, string>;
  confidence?: Record<string, number>;
  overallConfidence?: number;
  judgeIterations?: number;
  onChange: (key: string, value: string) => void;
  onReExtract?: () => void;
  disabled?: boolean;
  extracting?: boolean;
}

function ConfidenceBadge({ score }: { score?: number }) {
  if (score === undefined || score === 0) return null;

  const { label, classes } =
    score >= 80
      ? { label: `${score}%`, classes: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" }
      : score >= 60
      ? { label: `${score}%`, classes: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30" }
      : { label: `${score}%`, classes: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30" };

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${classes}`}>
      {label}
    </span>
  );
}

export default function PassportFieldsForm({
  fields,
  values,
  confidence,
  overallConfidence,
  judgeIterations,
  onChange,
  onReExtract,
  disabled,
  extracting,
}: Props) {
  const t = useTranslations("Passport");

  const sorted = [...fields].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{t("reviewTitle")}</h3>
          {overallConfidence !== undefined && overallConfidence > 0 && (
            <ConfidenceBadge score={overallConfidence} />
          )}
          {judgeIterations !== undefined && judgeIterations > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {t("reviewedTimes", { count: judgeIterations })}
            </span>
          )}
        </div>
        {onReExtract && (
          <button
            onClick={onReExtract}
            disabled={disabled || extracting}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${extracting ? "animate-spin" : ""}`} />
            {t("reExtract")}
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{t("reviewDescription")}</p>

      <div className="space-y-3">
        {sorted.map((field) => {
          const score = confidence?.[field.key];
          return (
            <div key={field.key}>
              <div className="flex items-center gap-2 mb-1">
                <label className="text-xs font-medium">
                  {field.label}
                </label>
                <ConfidenceBadge score={score} />
              </div>
              <input
                type="text"
                value={values[field.key] || ""}
                onChange={(e) => onChange(field.key, e.target.value)}
                disabled={disabled}
                placeholder={field.description || field.label}
                className={`w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50 ${
                  score !== undefined && score > 0 && score < 60
                    ? "border-red-400/60 dark:border-red-500/50"
                    : ""
                }`}
              />
              {field.description && (
                <p className="text-[11px] text-muted-foreground mt-0.5 px-1">
                  {field.description}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
