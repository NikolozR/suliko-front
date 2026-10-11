"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Columns2, Download, Languages, Loader2, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/features/ui/components/ui/button";
import DocumentPreview from "@/features/translation/components/DocumentPreview";
import { fileDownloadUrl } from "../api";
import { useOrderFile } from "../orderFileBytes";
import type { OrderFile } from "../types";
import type { CompareTarget } from "./OrderFileCompare";

/** What the site's document viewer can draw: PDF, Word, web pages, text, subtitles, pictures. */
const PREVIEWABLE = /\.(pdf|docx|html?|txt|srt|jpe?g|png|gif|webp|bmp)$/i;

export const isPreviewable = (file: OrderFile) => file.downloadable && PREVIEWABLE.test(file.name);

export type PreviewTarget = {
  slug: string;
  orderId: number;
  documentId: number;
  file: OrderFile;
  /** Where "Translate" leads for this file, if it is one the bureau sent to translate. */
  translateHref: string | null;
  /** What "Compare" opens from this file, if its document has both an original and a translation. */
  compare: CompareTarget | null;
};

/**
 * One file of an order, shown without downloading it: beside the order on a
 * wide screen, over it on a phone.
 */
export function OrderFilePreview({
  target,
  onClose,
  onCompare,
}: {
  target: PreviewTarget;
  onClose: () => void;
  onCompare: (compare: CompareTarget) => void;
}) {
  const t = useTranslations("Orders");
  const { slug, orderId, documentId, file, compare } = target;
  const loaded = useOrderFile(slug, orderId, documentId, file);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // A dialog over the page (the comparison, "Remove this file?") takes
      // Escape for itself: one press closes one thing.
      if (document.querySelector('[role="dialog"][data-state="open"]')) return;
      onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Over the page (a phone), the page under it must not scroll.
  useEffect(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = before;
    };
  }, []);

  return (
    <aside
      aria-label={t("preview")}
      className="fixed inset-0 z-50 flex flex-col bg-background lg:sticky lg:top-6 lg:z-auto lg:h-[calc(100vh-8rem)] lg:rounded-xl lg:border lg:border-border/60"
    >
      <header className="flex items-center gap-2 border-b border-border/60 py-1 pl-4 pr-1">
        <p className="min-w-0 flex-1 truncate text-sm font-medium">{file.name}</p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label={t("closePreview")}
          title={t("closePreview")}
          className="text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X />
        </Button>
      </header>

      <div className="min-h-0 flex-1 p-3">
        {loaded.status === "loading" ? (
          <div role="status" className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {t("previewLoading")}
          </div>
        ) : loaded.status === "failed" ? (
          <div role="alert" className="flex h-full items-center justify-center gap-2 px-4 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
            {t("previewFailed")}
          </div>
        ) : (
          <div className="h-full">
            {/* The page count it reads belongs to this file, not to the one on the document screen. */}
            <DocumentPreview file={loaded.file} trackPageCount={false} />
          </div>
        )}
      </div>

      <footer className="flex flex-wrap items-center gap-2 border-t border-border/60 px-4 py-3">
        {target.translateHref && (
          <Button asChild size="sm">
            <Link href={target.translateHref}>
              <Languages />
              {t("translate")}
            </Link>
          </Button>
        )}
        {compare && (
          <Button type="button" variant="outline" size="sm" onClick={() => onCompare(compare)}>
            <Columns2 />
            {t("compare")}
          </Button>
        )}
        <Button asChild variant="outline" size="sm">
          <a href={fileDownloadUrl(slug, orderId, documentId, file.id)}>
            <Download />
            {t("download")}
          </a>
        </Button>
      </footer>
    </aside>
  );
}
