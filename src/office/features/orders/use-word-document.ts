// Owned by suliko-front: saves as the person corrects (no Save button).
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { startDownload } from "@office/features/orders/components/workspace-parts";
import type { WordEditorHandle } from "@/features/editor/WordEditor";
import { saveWordDocumentAction } from "@office/features/orders/translation-actions";
import { officePath } from "@office/i18n/office-path";

/** "passport (EN).html" and "passport (EN).docx" both download as "passport (EN).docx". */
const asWordName = (name: string) => `${name.replace(/\.(docx?|html?)$/i, "")}.docx`;

/** How long after the last correction it is saved: each save files a new
 * version and retires the old one, so not on every keystroke. */
const SAVE_AFTER_MS = 4000;

/**
 * What the two screens that edit a translation in the Word editor share: the
 * editor's handle, saving as the person corrects (no Save button, as on
 * suliko.ge's own translation page), and handing over the document as it now
 * stands.
 *
 * A save files the Word document the editor writes in place of the one it was
 * opened from, as a new file. The page goes on with that file (its address is
 * updated in place, nothing is reloaded), so the next save replaces it in turn.
 */
export function useWordDocument({
  orderId,
  documentId,
  file,
  hrefFor,
}: {
  orderId: number;
  documentId: number;
  file: { id: string; name: string };
  /** Where the page for a file of this translation is, to move the address to after a save. */
  hrefFor: (fileId: string) => string;
}) {
  const t = useTranslations("files.workspace");
  const locale = useLocale();
  const editor = useRef<WordEditorHandle>(null);
  // The file the editor's document is now filed as: a new one after every save.
  const [fileId, setFileId] = useState(file.id);
  const current = useRef(file.id);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Corrections made while a save is under way: saved again after it.
  const changedWhileSaving = useRef(false);
  const busy = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  // Leaving with corrections not saved yet asks first.
  useEffect(() => {
    if (!dirty && !saving) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, saving]);

  const save = useCallback(async () => {
    window.clearTimeout(timer.current);
    const handle = editor.current;
    if (!handle) return;
    if (busy.current) {
      changedWhileSaving.current = true;
      return;
    }
    busy.current = true;
    changedWhileSaving.current = false;
    setError(null);
    setSaving(true);
    try {
      const form = new FormData();
      form.set("order_id", String(orderId));
      form.set("document_id", String(documentId));
      form.set("file_id", current.current);
      form.set("file", await handle.toDocx(), "translation.docx");
      const result = await saveWordDocumentAction(form);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      current.current = result.file.id;
      setFileId(result.file.id);
      setSavedAt(new Date());
      if (!changedWhileSaving.current) setDirty(false);
      // The address names the file; the old one is retired.
      window.history.replaceState(window.history.state, "", officePath(hrefFor(result.file.id), locale));
    } catch {
      setError(t("saveFailed"));
    } finally {
      busy.current = false;
      setSaving(false);
      if (changedWhileSaving.current) {
        timer.current = window.setTimeout(() => void save(), SAVE_AFTER_MS);
      }
    }
  }, [orderId, documentId, hrefFor, locale, t]);

  const markDirty = useCallback(() => {
    setDirty(true);
    if (busy.current) changedWhileSaving.current = true;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void save(), SAVE_AFTER_MS);
  }, [save]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  /** The document as it now stands, saved or not, as a Word file. */
  async function downloadWord() {
    const handle = editor.current;
    if (!handle) return;
    try {
      const url = URL.createObjectURL(await handle.toDocx());
      startDownload(url, asWordName(file.name));
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      setError(t("downloadFailed"));
    }
  }

  return {
    editor,
    fileId,
    dirty,
    markDirty,
    saving,
    savedAt,
    error,
    save,
    downloadWord,
    print: () => editor.current?.print(),
  };
}
