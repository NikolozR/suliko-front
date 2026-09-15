"use client";

import { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/features/ui/components/ui/button";
import { Input } from "@/features/ui/components/ui/input";
import { Label } from "@/features/ui/components/ui/label";
import { Textarea } from "@/features/ui/components/ui/textarea";
import type { LanguagePair, PersonalOrderInput } from "../types/types.Orders";
import { ORDER_LANGUAGE_CODES, languageName } from "../utils/orderFormat";

const selectClass =
  "h-12 w-full rounded-md border border-input bg-transparent px-3 text-base md:text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30";

interface PersonalOrderFormProps {
  initial?: PersonalOrderInput;
  submitLabel: string;
  submittingLabel: string;
  /** Create only: source files picked alongside the order, uploaded after it exists. */
  allowFiles?: boolean;
  onSubmit: (input: PersonalOrderInput, files: File[]) => Promise<void>;
  onCancel?: () => void;
}

export function PersonalOrderForm({
  initial,
  submitLabel,
  submittingLabel,
  allowFiles = false,
  onSubmit,
  onCancel,
}: PersonalOrderFormProps) {
  const t = useTranslations("Orders");
  const locale = useLocale();

  const [clientName, setClientName] = useState(initial?.client_name ?? "");
  const [dueDate, setDueDate] = useState(initial?.due_date ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [pairs, setPairs] = useState<LanguagePair[]>(
    initial?.language_pairs.length
      ? initial.language_pairs
      : [{ source_language: "en", target_language: "ka" }],
  );
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const languageOptions = ORDER_LANGUAGE_CODES.map((code) => ({
    code,
    name: languageName(code, locale),
  })).sort((a, b) => a.name.localeCompare(b.name, locale));

  const updatePair = (index: number, field: keyof LanguagePair, value: string) =>
    setPairs((current) => current.map((pair, i) => (i === index ? { ...pair, [field]: value } : pair)));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!clientName.trim()) {
      setError(t("validationClient"));
      return;
    }
    if (!pairs.length || pairs.some((pair) => pair.source_language === pair.target_language)) {
      setError(t("validationPairs"));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(
        {
          client_name: clientName.trim(),
          due_date: dueDate || null,
          notes: notes.trim() || null,
          language_pairs: pairs,
        },
        files,
      );
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="order-client">{t("clientName")}</Label>
          <Input
            id="order-client"
            value={clientName}
            maxLength={255}
            onChange={(event) => setClientName(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="order-due">{t("dueDate")}</Label>
          <Input
            id="order-due"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">{t("languagePairs")}</legend>
        {pairs.map((pair, index) => (
          <div key={index} className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor={`pair-${index}-source`} className="text-xs text-muted-foreground">
                {t("sourceLanguage")}
              </Label>
              <select
                id={`pair-${index}-source`}
                className={selectClass}
                value={pair.source_language}
                onChange={(event) => updatePair(index, "source_language", event.target.value)}
              >
                {languageOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
            <span className="pb-3 text-muted-foreground" aria-hidden>
              →
            </span>
            <div className="flex-1 space-y-1">
              <Label htmlFor={`pair-${index}-target`} className="text-xs text-muted-foreground">
                {t("targetLanguage")}
              </Label>
              <select
                id={`pair-${index}-target`}
                className={selectClass}
                value={pair.target_language}
                onChange={(event) => updatePair(index, "target_language", event.target.value)}
              >
                {languageOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("removePair")}
              disabled={pairs.length === 1}
              onClick={() => setPairs((current) => current.filter((_, i) => i !== index))}
            >
              <X />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            setPairs((current) => [...current, { source_language: "en", target_language: "ka" }])
          }
        >
          <Plus />
          {t("addPair")}
        </Button>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="order-notes">{t("notes")}</Label>
        <Textarea
          id="order-notes"
          value={notes}
          maxLength={5000}
          placeholder={t("notesPlaceholder")}
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>

      {allowFiles && (
        <div className="space-y-2">
          <Label htmlFor="order-files">{t("attachSource")}</Label>
          <Input
            id="order-files"
            type="file"
            multiple
            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
          />
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-red-200/60 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={submitting} className="suliko-default-bg text-primary-foreground dark:text-white">
          {submitting && <Loader2 className="animate-spin" />}
          {submitting ? submittingLabel : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            {t("cancel")}
          </Button>
        )}
      </div>
    </form>
  );
}
