"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { ArrowLeft, FileDown, Loader2, PanelLeft, Printer, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { OriginalPane, type SourceFile } from "@office/features/orders/components/original-pane";
import { editorHref, workspaceHref } from "@office/features/orders/components/order-files";
import { WordEditor } from "@office/features/orders/components/translation-workspace";
import { SyncToggle } from "@office/features/orders/components/workspace-parts";
import { useSyncedScroll, useSyncPreference } from "@office/features/orders/use-synced-scroll";
import { useWordDocument } from "@office/features/orders/use-word-document";
import { Link } from "@office/i18n/navigation";
import { ToggleChip } from "@office/shared/components/form/toggle-chip";
import { Button } from "@office/shared/components/ui/button";
import { cn } from "@office/shared/lib/utils";

/**
 * The full-screen editor: the translation as a Word document, in the whole
 * window, with the ribbon, the ruler and the properties pane.
 *
 * Only the page, no sidebar. The original is out of the way until it is asked
 * for ("Original"), then it opens beside the document and the two can be kept
 * scrolling together. Saving works as on the comparison page: the Word
 * document the editor writes replaces the one it was opened from, and the page
 * moves to the new file's address.
 */
export function TranslationScreen({
  orderId,
  orderNumber,
  documentId,
  file,
  source,
  sfdt,
  canWrite,
}: {
  orderId: number;
  orderNumber: number;
  documentId: number;
  file: { id: string; name: string };
  source: SourceFile | null;
  sfdt: string;
  canWrite: boolean;
}) {
  const t = useTranslations("files.workspace");
  const word = useWordDocument({
    orderId,
    documentId,
    file,
    hrefFor: (fileId) => editorHref(orderId, documentId, fileId),
  });
  const [showOriginal, setShowOriginal] = useState(false);
  const [originalScroller, setOriginalScroller] = useState<HTMLElement | null>(null);
  const [editorScroller, setEditorScroller] = useState<HTMLElement | null>(null);
  const [synced, chooseSynced] = useSyncPreference();
  useSyncedScroll(synced, originalScroller, editorScroller);

  return (
    <div className="bg-background flex h-dvh flex-col">
      <header className="border-border flex flex-wrap items-center gap-2 border-b px-3 py-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={workspaceHref(orderId, documentId, file.id)}>
            <ArrowLeft /> {t("backToComparison")}
          </Link>
        </Button>
        <h1 className="text-sm font-semibold">{t("title", { id: orderNumber })}</h1>
        <span className="text-muted-foreground min-w-0 truncate text-xs" title={file.name}>
          {file.name}
        </span>
        <span className="text-xs" role="status">
          {word.dirty ? (
            <span className="text-hue-amber-ink font-medium">{t("unsaved")}</span>
          ) : (
            <span className="text-muted-foreground">{canWrite ? t("saved") : null}</span>
          )}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {source && (
            <ToggleChip
              pressed={showOriginal}
              onClick={() => setShowOriginal((open) => !open)}
              className="flex h-8 items-center gap-1.5 px-3 text-xs font-medium"
            >
              <PanelLeft className="size-3.5" aria-hidden />
              {showOriginal ? t("hideOriginal") : t("showOriginal")}
            </ToggleChip>
          )}
          {showOriginal && (
            <SyncToggle
              synced={synced}
              available={originalScroller !== null && editorScroller !== null}
              onChange={chooseSynced}
            />
          )}
          <Button variant="outline" size="sm" onClick={word.print}>
            <Printer /> {t("print")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => void word.downloadWord()}>
            <FileDown /> {t("word")}
          </Button>
          {canWrite && (
            <Button
              variant="brand"
              size="sm"
              disabled={!word.dirty || word.saving}
              onClick={() => void word.save()}
            >
              {word.saving ? <Loader2 className="animate-spin" /> : <Save />} {t("save")}
            </Button>
          )}
        </div>
      </header>

      {word.error && (
        <p role="alert" className="text-destructive border-border border-b px-3 py-1.5 text-sm">
          {word.error}
        </p>
      )}

      <div className="flex min-h-0 flex-1">
        {showOriginal && (
          <OriginalPane
            orderId={orderId}
            documentId={documentId}
            source={source}
            className="w-[42%] shrink-0 rounded-none border-y-0 border-l-0"
            onScroller={setOriginalScroller}
          />
        )}
        <main className={cn("min-w-0 flex-1")}>
          <WordEditor
            sfdt={sfdt}
            mode="full"
            readOnly={!canWrite}
            onChange={word.markDirty}
            scrollerRef={setEditorScroller}
            handle={word.editor}
          />
        </main>
      </div>
    </div>
  );
}
