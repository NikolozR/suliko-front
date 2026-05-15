"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { RotateCcw, AlertCircle } from "lucide-react";
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

function ConfidenceBadge({ score, empty }: { score?: number; empty?: boolean }) {
  if (empty) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
        <AlertCircle className="h-2.5 w-2.5" />
      </span>
    );
  }
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

function getFieldAccent(empty: boolean, score?: number) {
  if (empty)                                  return "border-l-amber-500/60";
  if (score !== undefined && score < 60)      return "border-l-red-500/50";
  if (score !== undefined && score < 80)      return "border-l-yellow-500/50";
  if (score !== undefined && score >= 80)     return "border-l-emerald-500/40";
  return "border-l-border";
}

function getInputStyle(empty: boolean, score?: number) {
  if (empty)                                  return "border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/[0.06]";
  if (score !== undefined && score < 60)      return "border-red-400/60 dark:border-red-500/50";
  return "";
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
  const emptyCount = sorted.filter((f) => !(values[f.key] || "").trim()).length;

  return (
    <div className="space-y-4">
      {/* Header */}
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

      {/* Attention banner */}
      {emptyCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-xs">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{t("emptyFieldsWarning", { count: emptyCount })}</span>
        </div>
      )}

      <p className="text-xs text-muted-foreground">{t("reviewDescription")}</p>

      {/* Fields */}
      <div className="space-y-2">
        {sorted.map((field) => {
          const value = values[field.key] || "";
          const empty = !value.trim();
          const score = confidence?.[field.key];

          return (
            <div
              key={field.key}
              className={`border-l-2 pl-3 py-0.5 transition-colors ${getFieldAccent(empty, score)}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <label className="text-xs font-medium">{field.label}</label>
                <ConfidenceBadge score={score} empty={empty} />
              </div>
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
                disabled={disabled}
                placeholder={field.description || field.label}
                className={`w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50 ${getInputStyle(empty, score)}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
