"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Download, Languages, Loader2, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/features/ui/components/ui/button";
import DocumentPreview from "@/features/translation/components/DocumentPreview";
import { fetchOrderFile, fileDownloadUrl } from "../api";
import { learnPdfPages } from "../orderFilePages";
import type { OrderFile } from "../types";

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
};

/**
 * The files last looked at, so going back and forth between two of them does
 * not fetch each again. A handful only: these are whole files held in memory.
 */
const KEPT = 3;
const kept = new Map<string, File>();

function keep(key: string, file: File): void {
  kept.delete(key);
  kept.set(key, file);
  while (kept.size > KEPT) kept.delete(kept.keys().next().value as string);
}

type Loaded = { key: string; file: File } | { key: string; failed: true };

/**
 * One file of an order, shown without downloading it: beside the order on a
 * wide screen, over it on a phone.
 */
export function OrderFilePreview({ target, onClose }: { target: PreviewTarget; onClose: () => void }) {
  const t = useTranslations("Orders");
  const { slug, orderId, documentId, file } = target;
  const key = `${slug}/${orderId}/${documentId}/${file.id}`;
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    const known = kept.get(key);
    if (known) {
      setLoaded({ key, file: known });
      return;
    }
    let cancelled = false;
    fetchOrderFile(slug, orderId, documentId, file).then((result) => {
      if (cancelled) return;
      if (result.status === "ok") {
        keep(key, result.file);
        setLoaded({ key, file: result.file });
        // The bytes are here anyway: a PDF too large to count unopened is counted now.
        void learnPdfPages(file.id, result.file);
      } else {
        setLoaded({ key, failed: true });
      }
    });
    return () => {
      cancelled = true;
    };
    // `key` names the file; the rest are its parts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
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

  // What was loaded for another file is not this file's.
  const shown = loaded?.key === key ? loaded : null;

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
        {shown === null ? (
          <div role="status" className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {t("previewLoading")}
          </div>
        ) : "failed" in shown ? (
          <div role="alert" className="flex h-full items-center justify-center gap-2 px-4 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
            {t("previewFailed")}
          </div>
        ) : (
          <div className="h-full">
            {/* The page count it reads belongs to this file, not to the one on the document screen. */}
            <DocumentPreview file={shown.file} trackPageCount={false} />
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
