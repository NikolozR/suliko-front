"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { useCallback, useEffect, useRef, useState } from "react";

/** A page of the PDF, in the points a PDF is measured in. */
interface PageSize {
  width: number;
  height: number;
}

/** More pages than this are left to the browser's own viewer. */
const MAX_PAGES = 300;
/** Space around a page, in CSS pixels. */
const MARGIN = 12;
/** A page is drawn when it is within this distance of what is showing. */
const NEAR = "800px 0px";

/**
 * A PDF's pages, drawn here, one under the other, in a box that scrolls.
 *
 * The browser's own PDF viewer is a frame this page cannot read the position
 * of, and keeping the translation beside it in step needs exactly that. So the
 * pages are drawn with pdf.js into plain elements: the box's scroll position
 * is the original's, and what scrolls it can be followed.
 *
 * Only a picture of each page: no text to select. The original is read for
 * comparison, and downloaded when it has to be copied from. A PDF this cannot
 * open (a damaged or protected one, or a very long one) is given up on, and
 * the caller shows it in the browser's viewer instead.
 *
 * Pages are drawn when they come near, not all at once; each is the right
 * size from the start, so the box is as tall as it will be and a position in
 * it means the same thing before and after they are drawn.
 */
export function PdfPages({
  data,
  zoom,
  scrollerRef,
  onFailed,
}: {
  data: ArrayBuffer;
  /** 1 fits the page to the box; more is larger, and scrolls sideways. */
  zoom: number;
  /** The box that scrolls, as it appears and disappears. */
  scrollerRef: (element: HTMLDivElement | null) => void;
  /** Stable, or the document is loaded again each time it changes. */
  onFailed: () => void;
}) {
  const t = useTranslations("files.workspace");
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [sizes, setSizes] = useState<PageSize[] | null>(null);
  const [width, setWidth] = useState(0);

  const attach = useCallback(
    (element: HTMLDivElement | null) => {
      setBox(element);
      scrollerRef(element);
    },
    [scrollerRef],
  );

  useEffect(() => {
    let cancelled = false;
    let loading: { promise: Promise<PDFDocumentProxy>; destroy: () => Promise<void> } | null = null;
    (async () => {
      try {
        // Loaded when it is needed: pdf.js reaches for the browser at import.
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();
        // A copy: the worker takes the bytes it is given.
        loading = pdfjs.getDocument({ data: new Uint8Array(data.slice(0)) });
        const loaded = await loading.promise;
        if (loaded.numPages > MAX_PAGES) throw new Error("too many pages");
        const found: PageSize[] = [];
        for (let number = 1; number <= loaded.numPages; number += 1) {
          const page = await loaded.getPage(number);
          const view = page.getViewport({ scale: 1 });
          found.push({ width: view.width, height: view.height });
          page.cleanup();
        }
        if (cancelled) return;
        setPdf(loaded);
        setSizes(found);
      } catch {
        if (!cancelled) onFailed();
      }
    })();
    return () => {
      cancelled = true;
      void loading?.destroy();
    };
  }, [data, onFailed]);

  useEffect(() => {
    if (!box) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(box);
    return () => observer.disconnect();
  }, [box]);

  const pageWidth = Math.max(160, Math.round((width - MARGIN * 2) * zoom));

  return (
    <div ref={attach} className="bg-muted/40 size-full overflow-auto">
      {pdf && sizes ? (
        <div className="flex w-max min-w-full flex-col items-center gap-3 p-3">
          {sizes.map((size, index) => (
            <PdfPage
              key={index}
              pdf={pdf}
              number={index + 1}
              size={size}
              width={pageWidth}
              root={box}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground flex size-full items-center justify-center gap-2 p-6 text-sm">
          <Loader2 className="size-4 animate-spin" aria-hidden /> {t("loadingOriginal")}
        </p>
      )}
    </div>
  );
}

function PdfPage({
  pdf,
  number,
  size,
  width,
  root,
}: {
  pdf: PDFDocumentProxy;
  number: number;
  size: PageSize;
  /** The width it is drawn at, in CSS pixels. */
  width: number;
  root: HTMLElement | null;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [near, setNear] = useState(false);
  const height = Math.round((width * size.height) / size.width);

  useEffect(() => {
    const element = holder.current;
    if (!element || !root) return;
    const observer = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), {
      root,
      rootMargin: NEAR,
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [root]);

  useEffect(() => {
    if (!near) return;
    let cancelled = false;
    let drawing: { promise: Promise<void>; cancel: () => void } | null = null;
    (async () => {
      const page = await pdf.getPage(number);
      const target = canvas.current;
      if (cancelled || !target) return;
      // Sharp on a dense screen, without a canvas of a size no one needs.
      const density = Math.min(window.devicePixelRatio || 1, 2);
      const view = page.getViewport({ scale: (width / size.width) * density });
      target.width = Math.floor(view.width);
      target.height = Math.floor(view.height);
      drawing = page.render({ canvas: target, viewport: view });
      try {
        await drawing.promise;
      } catch {
        // Cancelled by a resize or by leaving: the next draw replaces it.
      }
    })();
    return () => {
      cancelled = true;
      drawing?.cancel();
    };
  }, [near, pdf, number, width, size.width]);

  return (
    <div
      ref={holder}
      className="shrink-0 bg-white shadow-sm ring-1 ring-black/10"
      style={{ width, height }}
    >
      <canvas ref={canvas} className="block size-full" aria-label={String(number)} />
    </div>
  );
}
