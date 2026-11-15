"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { FileDown, Loader2, Maximize2, Printer, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useState } from "react";

import { OriginalPane, type SourceFile } from "@office/features/orders/components/original-pane";
import { editorHref, workspaceHref } from "@office/features/orders/components/order-files";
import { Note, Pane, SyncToggle } from "@office/features/orders/components/workspace-parts";
import { useSyncedScroll, useSyncPreference } from "@office/features/orders/use-synced-scroll";
import { useWordDocument } from "@office/features/orders/use-word-document";
import { Link } from "@office/i18n/navigation";
import { ToggleChip } from "@office/shared/components/form/toggle-chip";
import { Button } from "@office/shared/components/ui/button";

/** Loaded when the page is: the editor is a large piece of code and only this page and the full-screen one show it. */
export const WordEditor = dynamic(() => import("@office/features/orders/components/word-editor"), {
  ssr: false,
  loading: () => <EditorLoading />,
});

function EditorLoading() {
  const t = useTranslations("files.workspace");
  return (
    <Note>
      <Loader2 className="size-5 animate-spin" aria-hidden />
      {t("editorLoading")}
    </Note>
  );
}

/**
 * A translation beside its original: the source file on the left, the
 * translation in the Word editor on the right, where it can be corrected and
 * saved.
 *
 * The editor works on the Word document itself, so what is corrected is what
 * the client receives; the short toolbar here has what a correction needs, and
 * "Full screen" opens the same document with the whole ribbon, rulers and
 * properties pane. Saving files the Word document the editor writes in the
 * old one's place, so the address changes: the page moves to the new file's
 * own URL.
 *
 * The two sides scroll together, by how far down each is, until that is
 * turned off.
 */
export function TranslationWorkspace({
  orderId,
  documentId,
  file,
  source,
  sfdt,
  canWrite,
}: {
  orderId: number;
  documentId: number;
  file: { id: string; name: string };
  /** Null when the document has no source file left to show. */
  source: SourceFile | null;
  /** The translation in the editor's format. */
  sfdt: string;
  canWrite: boolean;
}) {
  const t = useTranslations("files.workspace");
  const word = useWordDocument({
    orderId,
    documentId,
    file,
    hrefFor: (fileId) => workspaceHref(orderId, documentId, fileId),
  });
  // Below lg the two panes do not fit side by side: one at a time.
  const [pane, setPane] = useState<"original" | "translation">("translation");
  const [originalScroller, setOriginalScroller] = useState<HTMLElement | null>(null);
  const [editorScroller, setEditorScroller] = useState<HTMLElement | null>(null);
  const [synced, chooseSynced] = useSyncPreference();
  useSyncedScroll(synced, originalScroller, editorScroller);

  return (
    <div className="space-y-3">
      <div className="bg-card border-border flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2">
        <div role="group" aria-label={t("panes")} className="flex gap-1 lg:hidden">
          {(["original", "translation"] as const).map((key) => (
            <ToggleChip
              key={key}
              pressed={pane === key}
              onClick={() => setPane(key)}
              className="h-8 px-3 text-xs font-medium"
            >
              {t(key)}
            </ToggleChip>
          ))}
        </div>

        <p className="text-muted-foreground min-w-0 flex-1 truncate text-xs" title={file.name}>
          {word.dirty ? (
            <span className="text-hue-amber-ink font-medium">{t("unsaved")}</span>
          ) : canWrite ? (
            t("editHint")
          ) : (
            file.name
          )}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <SyncToggle
            synced={synced}
            available={originalScroller !== null && editorScroller !== null}
            onChange={chooseSynced}
            className="max-lg:hidden"
          />
          <Button variant="outline" size="sm" onClick={word.print}>
            <Printer /> {t("print")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => void word.downloadWord()}>
            <FileDown /> {t("word")}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={editorHref(orderId, documentId, file.id)}>
              <Maximize2 /> {t("fullScreen")}
            </Link>
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
      </div>

      {word.error && (
        <p role="alert" className="text-destructive text-sm">
          {word.error}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <OriginalPane
          orderId={orderId}
          documentId={documentId}
          source={source}
          hidden={pane !== "original"}
          className="h-[calc(100dvh-15rem)] min-h-[26rem]"
          onScroller={setOriginalScroller}
        />
        <Pane
          title={t("translation")}
          detail={file.name}
          hidden={pane !== "translation"}
          className="h-[calc(100dvh-15rem)] min-h-[26rem]"
        >
          <WordEditor
            sfdt={sfdt}
            mode="compact"
            readOnly={!canWrite}
            onChange={word.markDirty}
            scrollerRef={setEditorScroller}
            handle={word.editor}
          />
        </Pane>
      </div>
    </div>
  );
}
