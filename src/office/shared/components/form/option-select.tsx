"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Check, Loader2, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { addOptionAction } from "@office/features/options/actions";
import type { OptionListKey } from "@office/features/options/api";
import { selectClass } from "@office/shared/components/form/fields";
import { Button } from "@office/shared/components/ui/button";
import { Input } from "@office/shared/components/ui/input";

export interface BuiltInOption {
  value: string;
  label: string;
}

/**
 * A dropdown the bureau can extend from where it is used.
 *
 * Lists the built-in values, then the bureau's own, then — so editing an older
 * record never silently blanks it — whatever value the record already holds
 * if it is neither. The "+" opens an inline box rather than a dialog: it sits
 * inside another form, and a nested form is not valid HTML.
 */
export function OptionSelect({
  id,
  name,
  list,
  builtIns,
  custom = [],
  defaultValue = "",
  canAdd = false,
  invalid = false,
}: {
  id: string;
  name: string;
  list: OptionListKey;
  builtIns: readonly BuiltInOption[];
  custom?: readonly string[];
  defaultValue?: string;
  canAdd?: boolean;
  invalid?: boolean;
}) {
  const t = useTranslations("options");
  const [extra, setExtra] = useState<string[]>([...custom]);
  const [value, setValue] = useState(defaultValue);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const known = new Set([...builtIns.map((o) => o.value), ...extra].map((v) => v.toLowerCase()));
  const legacy = value && !known.has(value.toLowerCase()) ? value : null;

  const close = () => {
    setAdding(false);
    setDraft("");
    setError("");
  };

  const save = () =>
    startTransition(async () => {
      setError("");
      const result = await addOptionAction(list, draft);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.option) {
        const added = result.option.value;
        setExtra((current) =>
          current.some((v) => v.toLowerCase() === added.toLowerCase()) ? current : [...current, added],
        );
        setValue(added);
      }
      close();
    });

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        <select
          id={id}
          name={name}
          className={selectClass}
          value={value}
          aria-invalid={invalid}
          onChange={(e) => setValue(e.target.value)}
        >
          <option value="">–</option>
          {builtIns.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          {extra.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
          {legacy && <option value={legacy}>{legacy}</option>}
        </select>
        {canAdd && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            aria-label={t("add")}
            title={t("add")}
            aria-expanded={adding}
            onClick={() => (adding ? close() : setAdding(true))}
          >
            <Plus />
          </Button>
        )}
      </div>

      {adding && (
        <div className="flex gap-1.5">
          <Input
            autoFocus
            value={draft}
            maxLength={60}
            placeholder={t("placeholder")}
            aria-label={t("add")}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // Enter here means "add this", not "submit the whole form".
              if (e.key === "Enter") {
                e.preventDefault();
                if (draft.trim()) save();
              }
              if (e.key === "Escape") close();
            }}
          />
          <Button
            type="button"
            variant="brand"
            size="sm"
            className="h-9 shrink-0"
            disabled={pending || !draft.trim()}
            onClick={save}
          >
            {pending ? <Loader2 className="animate-spin" /> : <Check />}
            {t("save")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label={t("cancel")}
            title={t("cancel")}
            onClick={close}
          >
            <X />
          </Button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
