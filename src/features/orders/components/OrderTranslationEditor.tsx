"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";
import TranslationEditor, { type TranslationEditorHandle } from "@/features/editor/TranslationEditor";
import { Button } from "@/features/ui/components/ui/button";
import { ConfirmDialog } from "@/features/ui/components/ui/confirm-dialog";
import type { PreviewScroller } from "@/features/translation/components/DocumentPreview";
import { embeddedPageOf } from "@/features/translation/utils/wordPage";
import { removeTranslation, uploadTranslation, type TranslationUpload } from "../api";
import { correctHistory } from "../historyCopy";
import { noteSentToOrder, translationOfFile } from "../orderTranslations";
import type { OrderFile } from "../types";

/** What a translation in an order is opened from in the editor. */
export type EditableSource =
  /** A Word file this site used to write: its text is a web page inside the file. */
  | { kind: "html"; page: string }
  /** Any other Word file: the Word editor's own, one made in Word. It opens as it is. */
  | { kind: "docx"; file: File };

/**
 * How a translation in an order can be opened for corrections, or null when it cannot: a PDF
 * has no pages to lay out again, and a file that is not a readable Word file would be lost.
 *
 * A Word file written by this site's earlier Word export carries its text as a web page, which
 * is what is opened (the file proper is empty). Every other Word file, the Word editor's own
 * included, is opened as it is and keeps its headers, footers and page breaks.
 */
export async function editableSourceOf(file: File): Promise<EditableSource | null> {
  if (!/\.docx$/i.test(file.name)) return null;
  try {
    const page = await embeddedPageOf(await file.arrayBuffer());
    return page ? { kind: "html", page } : { kind: "docx", file };
  } catch {
    // Not a readable zip: there is nothing to open.
    return null;
  }
}

type Problem = Exclude<TranslationUpload["status"], "ok">;

const PROBLEM_KEYS: Record<Problem, string> = {
  tooLarge: "sendTooLarge",
  gone: "sendGone",
  signedOut: "sendSignedOut",
  error: "sendError",
};

const WORD_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * A translation already in the order, open for corrections where it is being
 * compared with its original, in the Word editor. Saving writes the Word file
 * again under its own name and takes the earlier one out of the order: the
 * bureau keeps one file, the corrected one. The translation it was sent from,
 * in the translator's history, is corrected with it where this browser knows
 * which one that is.
 */
export function OrderTranslationEditor({
  slug,
  orderId,
  documentId,
  file,
  source,
  onScroller,
  onEdited,
  onCancel,
  onSaved,
}: {
  slug: string;
  orderId: number;
  documentId: number;
  /** The translation as it is in the order. */
  file: OrderFile;
  /** What it is opened from. */
  source: EditableSource;
  /** Where the editor scrolls, for the screen that moves it with the original. */
  onScroller: (scroller: PreviewScroller | null) => void;
  /** Whether there are corrections not saved yet. */
  onEdited: (edited: boolean) => void;
  /** Leave without saving. */
  onCancel: () => void;
  /** Saved as `added`; `earlierRemoved` is false if the earlier file is still in the order. */
  onSaved: (added: OrderFile, earlierRemoved: boolean) => void;
}) {
  const t = useTranslations("Orders");
  const editor = useRef<TranslationEditorHandle>(null);
  // The text of a web-page file, as the editor's HTML; a Word file has none until it is open.
  const body = useMemo(
    () =>
      source.kind === "html"
        ? new DOMParser().parseFromString(source.page, "text/html").body.innerHTML
        : "",
    [source],
  );
  // What the file held when it was opened, as HTML: the history copy is compared with it.
  const opened = useRef<string | null>(null);
  const openFile = useMemo(
    () => (source.kind === "docx" ? () => Promise.resolve<Blob | null>(source.file) : undefined),
    [source],
  );

  // The Word editor scrolls its own pages: those are what the original is moved with.
  const [scroller, setScroller] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!scroller) return;
    onScroller({ box: scroller, events: scroller });
    return () => onScroller(null);
  }, [scroller, onScroller]);
  const [unavailable, setUnavailable] = useState(false);

  const [edited, setEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [leaving, setLeaving] = useState(false);

  const noteEdit = () => {
    if (edited) return;
    setEdited(true);
    onEdited(true);
  };

  const save = async () => {
    const word = editor.current?.toDocx();
    if (!word) return;
    const html = editor.current?.getHTML() ?? "";
    setSaving(true);
    setProblem(null);
    try {
      const corrected = new File([await word], file.name, { type: WORD_TYPE });
      const sent = await uploadTranslation(slug, orderId, documentId, corrected);
      if (sent.status !== "ok") {
        setProblem(sent.status);
        return;
      }
      // The corrected file is in the order: only now does the earlier one go,
      // and the translation it was sent from is brought in step with it.
      const sentFrom = translationOfFile(slug, orderId, documentId, file);
      const [removed, history] = await Promise.all([
        removeTranslation(slug, orderId, documentId, file.id),
        sentFrom ? correctHistory(sentFrom.chatId, opened.current ?? body, html) : null,
      ]);
      // That translation's file in the order is the new one now.
      if (sentFrom) noteSentToOrder(sentFrom.chatId, sent.file);

      if (removed.status !== "ok") toast(t("saveKeptEarlier"), { duration: 8000 });
      else toast.success(t(history === "updated" ? "saveDoneBoth" : "saveDone"));
      if (history === "differs") toast(t("historyDiffers"), { duration: 8000 });
      if (history === "failed") toast(t("historyFailed"), { duration: 8000 });
      onEdited(false);
      onSaved(sent.file, removed.status === "ok");
    } catch {
      // The Word file could not be made.
      setProblem("error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/*
        Above the text, not under it: the foot of the screen's right-hand side
        is where the site's chat button sits, on top of whatever is there.
      */}
      <div className="mb-2 flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
        {/* A line of its own on a phone, so the two buttons stay side by side. */}
        <p className="min-w-0 flex-1 basis-full text-xs text-muted-foreground sm:basis-48">
          {t("editHint")}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={saving}
          onClick={() => (edited ? setLeaving(true) : onCancel())}
        >
          {t("cancel")}
        </Button>
        <Button type="button" size="sm" disabled={saving || !edited || unavailable} onClick={save}>
          {saving ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
          {saving ? t("savingToOrder") : t("saveToOrder")}
        </Button>
      </div>

      {unavailable && (
        <p role="alert" className="mb-2 flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {t("editUnavailable")}
        </p>
      )}

      {problem && (
        <p role="alert" className="mb-2 flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {t(PROBLEM_KEYS[problem])}
        </p>
      )}

      <div className="min-h-0 flex-1 rounded-md border bg-background">
        <TranslationEditor
          ref={editor}
          translatedMarkdown={body}
          openDocument={openFile}
          wordOnly
          hideHint
          onUnavailable={() => setUnavailable(true)}
          onOpened={(html) => {
            opened.current = html;
          }}
          onChange={noteEdit}
          onScroller={setScroller}
          className="h-full"
        />
      </div>

      <ConfirmDialog
        open={leaving}
        onOpenChange={setLeaving}
        title={t("discardTitle")}
        description={t("discardBody")}
        confirmLabel={t("discard")}
        onConfirm={() => {
          setLeaving(false);
          onEdited(false);
          onCancel();
        }}
      />
    </div>
  );
}
