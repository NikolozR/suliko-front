"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  FileText,
  Loader2,
  Trash2,
} from "lucide-react";
import LanguageSelect from "@/features/translation/components/LanguageSelect";
import { Button } from "@/features/ui/components/ui/button";
import { Checkbox } from "@/features/ui/components/ui/checkbox";
import { Textarea } from "@/features/ui/components/ui/textarea";
import { cn } from "@/shared/lib/utils";
import { DocumentSettings, StagedDocument } from "../types/types.Bulk";
import { formatFileSize } from "../utils/folderScanning";
import { NameGlossaryEditor } from "./NameGlossaryEditor";

interface BulkDocumentTableProps {
  documents: StagedDocument[];
  selectedIds: Set<string>;
  onToggleSelected: (id: string) => void;
  onToggleAll: () => void;
  onUpdateSettings: (id: string, patch: Partial<DocumentSettings>) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export function BulkDocumentTable({
  documents,
  selectedIds,
  onToggleSelected,
  onToggleAll,
  onUpdateSettings,
  onRemove,
  disabled,
}: BulkDocumentTableProps) {
  const t = useTranslations("BulkTranslation");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const allSelected =
    documents.length > 0 && selectedIds.size === documents.length;
  // Distinguished from "all" so the header checkbox can show an indeterminate state
  // rather than implying a partial selection is a full one.
  const someSelected = selectedIds.size > 0 && !allSelected;

  return (
    <div className="rounded-lg border border-border/70 overflow-hidden">
      <div className="flex items-center gap-3 border-b bg-muted/40 px-4 py-2.5">
        <Checkbox
          // Radix takes "indeterminate" as a checked value; a partial selection must not
          // render as fully checked, or "select all" appears to be a no-op.
          checked={someSelected ? "indeterminate" : allSelected}
          onCheckedChange={onToggleAll}
          disabled={disabled}
          aria-label={t("selectAllAria")}
        />
        <span className="text-xs font-medium text-muted-foreground">
          {selectedIds.size > 0
            ? t("selectedCount", {
                selected: selectedIds.size,
                total: documents.length,
              })
            : t("documentCount", { count: documents.length })}
        </span>
      </div>

      <div className="divide-y divide-border/60">
        {documents.map((doc) => (
          <DocumentRow
            key={doc.id}
            document={doc}
            selected={selectedIds.has(doc.id)}
            expanded={expandedId === doc.id}
            onToggleSelected={() => onToggleSelected(doc.id)}
            onToggleExpanded={() =>
              setExpandedId((prev) => (prev === doc.id ? null : doc.id))
            }
            onUpdateSettings={(patch) => onUpdateSettings(doc.id, patch)}
            onRemove={() => onRemove(doc.id)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

interface DocumentRowProps {
  document: StagedDocument;
  selected: boolean;
  expanded: boolean;
  onToggleSelected: () => void;
  onToggleExpanded: () => void;
  onUpdateSettings: (patch: Partial<DocumentSettings>) => void;
  onRemove: () => void;
  disabled?: boolean;
}

function DocumentRow({
  document: doc,
  selected,
  expanded,
  onToggleSelected,
  onToggleExpanded,
  onUpdateSettings,
  onRemove,
  disabled,
}: DocumentRowProps) {
  const t = useTranslations("BulkTranslation");

  // The folder path is what distinguishes two files with the same name in different
  // subfolders, so it is shown whenever it adds information beyond the name alone.
  const folder = doc.relativePath.includes("/")
    ? doc.relativePath.slice(0, doc.relativePath.lastIndexOf("/"))
    : null;

  const hasInstructions = doc.settings.instructions.trim().length > 0;
  const nameCount = doc.settings.nameTranslations.filter((n) => n.original.trim()).length;

  return (
    <div className={cn(selected && "bg-suliko-default-color/5")}>
      <div className="flex items-center gap-3 px-4 py-3">
        <Checkbox
          checked={selected}
          onCheckedChange={onToggleSelected}
          disabled={disabled}
          aria-label={t("selectAria", { name: doc.file.name })}
        />

        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />

        <button
          type="button"
          onClick={onToggleExpanded}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{doc.file.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {folder && <span className="mr-2">{folder}/</span>}
              {formatFileSize(doc.file.size)}
              {doc.pageCount !== null && (
                <span className="ml-2">
                  · {t("pageCount", { count: doc.pageCount })}
                </span>
              )}
              {hasInstructions && <span className="ml-2">· {t("hasNotes")}</span>}
              {nameCount > 0 && (
                <span className="ml-2">· {t("nameCount", { count: nameCount })}</span>
              )}
            </p>
          </div>

          <UploadIndicator document={doc} />

          {expanded ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
        </button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 shrink-0 p-0"
          onClick={onRemove}
          disabled={disabled}
          aria-label={t("removeAria", { name: doc.file.name })}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {expanded && (
        <div className="space-y-4 border-t border-border/50 bg-muted/20 px-4 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {t("translateFrom")}
              </label>
              <LanguageSelect
                value={doc.settings.sourceLanguageId}
                onChange={(value) => onUpdateSettings({ sourceLanguageId: value })}
                detectOption={t("detectAutomatically")}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {t("translateInto")}
              </label>
              <LanguageSelect
                value={doc.settings.targetLanguageId}
                onChange={(value) => onUpdateSettings({ targetLanguageId: value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {t("notesLabel")}
            </label>
            <Textarea
              value={doc.settings.instructions}
              onChange={(e) => onUpdateSettings({ instructions: e.target.value })}
              placeholder={t("notesPlaceholder")}
              rows={3}
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {t("nameSpellings")}
            </label>
            <NameGlossaryEditor
              names={doc.settings.nameTranslations}
              onChange={(names) => onUpdateSettings({ nameTranslations: names })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function UploadIndicator({ document: doc }: { document: StagedDocument }) {
  const t = useTranslations("BulkTranslation");

  if (doc.upload.status === "uploading") {
    return (
      <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        {Math.round(doc.upload.progress * 100)}%
      </span>
    );
  }

  if (doc.upload.status === "error") {
    return (
      <span
        className="flex shrink-0 items-center gap-1.5 text-xs text-red-600 dark:text-red-400"
        title={doc.upload.error}
      >
        <AlertCircle className="h-3.5 w-3.5" />
        {t("uploadFailed")}
      </span>
    );
  }

  return null;
}
