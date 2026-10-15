"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";
import NewEditor, { type NewEditorHandle } from "@/features/editor/NewEditor";
import { Button } from "@/features/ui/components/ui/button";
import { ConfirmDialog } from "@/features/ui/components/ui/confirm-dialog";
import type { PreviewScroller } from "@/features/translation/components/DocumentPreview";
import { embeddedPageOf, wordBlob } from "@/features/translation/utils/wordPage";
import { removeTranslation, uploadTranslation, type TranslationUpload } from "../api";
import { correctHistory } from "../historyCopy";
import { noteSentToOrder, translationOfFile } from "../orderTranslations";
import type { OrderFile } from "../types";

/**
 * The page a translation's text is, where the file is one this site wrote: a
 * Word file sent from a translation's result. Such a file was made from the
 * editor's own HTML, so it can be opened in the editor and written back as it
 * was. Any other file (a PDF, a Word file made in Word) answers null: it would
 * lose its layout on the way through.
 */
export async function editablePageOf(file: File): Promise<string | null> {
  if (!/\.docx$/i.test(file.name)) return null;
  try {
    return await embeddedPageOf(await file.arrayBuffer());
  } catch {
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
 * compared with its original. Saving writes the file again under its own name
 * and takes the earlier one out of the order: the bureau keeps one file, the
 * corrected one. The translation it was sent from, in the translator's
 * history, is corrected with it where this browser knows which one that is.
 */
export function OrderTranslationEditor({
  slug,
  orderId,
  documentId,
  file,
  page,
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
  /** Its text, as the page it was written from. */
  page: string;
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
  const editor = useRef<NewEditorHandle>(null);
  const body = useMemo(
    () => new DOMParser().parseFromString(page, "text/html").body.innerHTML,
    [page],
  );

  const [box, setBox] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!box) return;
    onScroller({ box, events: box });
    return () => onScroller(null);
  }, [box, onScroller]);

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
    const html = editor.current?.getHTML();
    if (!html) return;
    setSaving(true);
    setProblem(null);
    try {
      const corrected = new File([await wordBlob(html)], file.name, { type: WORD_TYPE });
      const sent = await uploadTranslation(slug, orderId, documentId, corrected);
      if (sent.status !== "ok") {
        setProblem(sent.status);
        return;
      }
      // The corrected file is in the order: only now does the earlier one go,
      // and the translation it was sent from is brought in step with it.
      const source = translationOfFile(slug, orderId, documentId, file);
      const [removed, history] = await Promise.all([
        removeTranslation(slug, orderId, documentId, file.id),
        source ? correctHistory(source.chatId, body, html) : null,
      ]);
      // That translation's file in the order is the new one now.
      if (source) noteSentToOrder(source.chatId, sent.file);

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
        <Button type="button" size="sm" disabled={saving || !edited} onClick={save}>
          {saving ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
          {saving ? t("savingToOrder") : t("saveToOrder")}
        </Button>
      </div>

      {problem && (
        <p role="alert" className="mb-2 flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {t(PROBLEM_KEYS[problem])}
        </p>
      )}

      {/* `overflow-y-auto`: the editor looks for its scrolling box by that name. */}
      <div ref={setBox} className="min-h-0 flex-1 overflow-y-auto rounded-md border bg-white">
        <NewEditor ref={editor} translatedMarkdown={body} onChange={noteEdit} />
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
