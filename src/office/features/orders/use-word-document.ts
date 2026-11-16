// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { startDownload } from "@office/features/orders/components/workspace-parts";
import type { WordEditorHandle } from "@/features/editor/WordEditor";
import { saveWordDocumentAction } from "@office/features/orders/translation-actions";
import { useRouter } from "@office/i18n/navigation";

/** "passport (EN).html" and "passport (EN).docx" both download as "passport (EN).docx". */
const asWordName = (name: string) => `${name.replace(/\.(docx?|html?)$/i, "")}.docx`;

/**
 * What the two screens that edit a translation in the Word editor share: the
 * editor's handle, whether there are unsaved corrections, saving (which files
 * the Word document the editor writes in place of the one it was opened from,
 * and moves to the new file's address), and handing over the document as it
 * now stands.
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
  /** Where the page for a file of this translation is, to move to after a save. */
  hrefFor: (fileId: string) => string;
}) {
  const t = useTranslations("files.workspace");
  const router = useRouter();
  const editor = useRef<WordEditorHandle>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Leaving with corrections unsaved asks first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function save() {
    const handle = editor.current;
    if (!handle) return;
    setError(null);
    setSaving(true);
    try {
      const form = new FormData();
      form.set("order_id", String(orderId));
      form.set("document_id", String(documentId));
      form.set("file_id", file.id);
      form.set("file", await handle.toDocx(), "translation.docx");
      const result = await saveWordDocumentAction(form);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDirty(false);
      toast.success(t("saved"));
      router.replace(hrefFor(result.file.id));
    } catch {
      setError(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  }

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
    dirty,
    markDirty: () => setDirty(true),
    saving,
    error,
    save,
    downloadWord,
    print: () => editor.current?.print(),
  };
}
