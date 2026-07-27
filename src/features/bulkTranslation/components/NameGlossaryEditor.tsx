"use client";

import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { Button } from "@/features/ui/components/ui/button";
import { Input } from "@/features/ui/components/ui/input";
import { NameTranslationItem } from "@/features/translation/types/types.Translation";

interface NameGlossaryEditorProps {
  names: NameTranslationItem[];
  onChange: (names: NameTranslationItem[]) => void;
}

/**
 * Editor for how proper names should be spelled in the output.
 *
 * Names are the thing translation models are least consistent about — the same person can
 * come back spelled three ways across a folder of documents. Pinning them here makes the
 * whole batch agree.
 */
export function NameGlossaryEditor({ names, onChange }: NameGlossaryEditorProps) {
  const t = useTranslations("BulkTranslation");

  const update = (index: number, patch: Partial<NameTranslationItem>) => {
    onChange(names.map((name, i) => (i === index ? { ...name, ...patch } : name)));
  };

  const remove = (index: number) => {
    onChange(names.filter((_, i) => i !== index));
  };

  const add = () => {
    onChange([...names, { original: "", translation: "", type: "Person" }]);
  };

  return (
    <div className="space-y-2">
      {names.length === 0 && (
        <p className="text-xs text-muted-foreground">{t("noNamesYet")}</p>
      )}

      {names.map((name, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={name.original}
            onChange={(e) => update(index, { original: e.target.value })}
            placeholder={t("originalPlaceholder")}
            className="h-8 text-xs"
          />
          <span className="text-xs text-muted-foreground shrink-0">→</span>
          <Input
            value={name.translation}
            onChange={(e) => update(index, { translation: e.target.value })}
            placeholder={t("translationPlaceholder")}
            className="h-8 text-xs"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 shrink-0"
            onClick={() => remove(index)}
            aria-label={t("removeAria", { name: name.original || t("addName") })}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={add}
        className="h-7 gap-1.5 text-xs"
      >
        <Plus className="h-3.5 w-3.5" />
        {t("addName")}
      </Button>
    </div>
  );
}
