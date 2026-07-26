"use client";

import { useState } from "react";
import { Check, Wand2 } from "lucide-react";
import LanguageSelect from "@/features/translation/components/LanguageSelect";
import { Button } from "@/features/ui/components/ui/button";
import { Textarea } from "@/features/ui/components/ui/textarea";
import { NameTranslationItem } from "@/features/translation/types/types.Translation";
import { DocumentSettings } from "../types/types.Bulk";
import { NameGlossaryEditor } from "./NameGlossaryEditor";

interface BulkApplyPanelProps {
  selectedCount: number;
  onApply: (patch: Partial<DocumentSettings>) => void;
  disabled?: boolean;
}

/**
 * Applies one setting across every selected document.
 *
 * Each field applies on its own. Editing a folder of fifty documents one row at a time is
 * the thing this feature exists to avoid, but a panel that wrote all its fields at once
 * would clobber per-document notes the user had already written, so nothing is written
 * unless its own Apply is pressed.
 */
export function BulkApplyPanel({
  selectedCount,
  onApply,
  disabled,
}: BulkApplyPanelProps) {
  const [targetLanguageId, setTargetLanguageId] = useState<number>(0);
  const [sourceLanguageId, setSourceLanguageId] = useState<number>(0);
  const [instructions, setInstructions] = useState("");
  const [names, setNames] = useState<NameTranslationItem[]>([]);
  const [justApplied, setJustApplied] = useState<string | null>(null);

  const apply = (field: string, patch: Partial<DocumentSettings>) => {
    onApply(patch);
    setJustApplied(field);
    window.setTimeout(() => setJustApplied(null), 1500);
  };

  const label = `${selectedCount} document${selectedCount === 1 ? "" : "s"}`;

  return (
    <div className="space-y-4 rounded-lg border border-suliko-default-color/30 bg-suliko-default-color/5 p-4">
      <div className="flex items-center gap-2">
        <Wand2 className="h-4 w-4 text-suliko-default-color" />
        <p className="text-sm font-medium">Apply to {label}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Translate from
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <LanguageSelect
                value={sourceLanguageId}
                onChange={setSourceLanguageId}
                detectOption="Detect automatically"
              />
            </div>
            <ApplyButton
              applied={justApplied === "source"}
              disabled={disabled}
              onClick={() => apply("source", { sourceLanguageId })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Translate into
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <LanguageSelect
                value={targetLanguageId}
                onChange={setTargetLanguageId}
              />
            </div>
            <ApplyButton
              applied={justApplied === "target"}
              // Language id 0 means "detect", which is not a valid destination.
              disabled={disabled || targetLanguageId === 0}
              onClick={() => apply("target", { targetLanguageId })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Notes and instructions
        </label>
        <Textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="e.g. keep company names in English, use formal register"
          rows={2}
          className="text-sm"
        />
        <div className="flex justify-end">
          <ApplyButton
            applied={justApplied === "instructions"}
            disabled={disabled}
            onClick={() => apply("instructions", { instructions })}
            wide
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Name spellings
        </label>
        <NameGlossaryEditor names={names} onChange={setNames} />
        <div className="flex justify-end">
          <ApplyButton
            applied={justApplied === "names"}
            disabled={disabled || names.length === 0}
            onClick={() =>
              apply("names", {
                // Blank rows are an artefact of the editor's "add" button, not something
                // the user meant to send.
                nameTranslations: names.filter((n) => n.original.trim()),
              })
            }
            wide
          />
        </div>
      </div>
    </div>
  );
}

function ApplyButton({
  applied,
  disabled,
  onClick,
  wide,
}: {
  applied: boolean;
  disabled?: boolean;
  onClick: () => void;
  wide?: boolean;
}) {
  return (
    <Button
      type="button"
      variant={applied ? "default" : "outline"}
      size="sm"
      disabled={disabled}
      onClick={onClick}
      className={wide ? "gap-1.5" : "shrink-0 gap-1.5"}
    >
      {applied ? (
        <>
          <Check className="h-3.5 w-3.5" />
          Applied
        </>
      ) : (
        "Apply"
      )}
    </Button>
  );
}
