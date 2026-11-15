"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Download, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { PdfPages } from "@office/features/orders/components/pdf-pages";
import { fileHref, Note, Pane } from "@office/features/orders/components/workspace-parts";
import { Button } from "@office/shared/components/ui/button";

const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;

export interface SourceFile {
  id: string;
  name: string;
  contentType: string;
}

/**
 * The translation's original beside the editor: its title, what can be done
 * to it (zoom a PDF, download it), and the file itself.
 *
 * `onScroller` is told which element scrolls the original, as it appears and
 * goes, so the editor beside it can be kept at the same place.
 */
export function OriginalPane({
  orderId,
  documentId,
  source,
  hidden,
  className,
  onScroller,
}: {
  orderId: number;
  documentId: number;
  source: SourceFile | null;
  hidden?: boolean;
  className?: string;
  onScroller: (element: HTMLElement | null) => void;
}) {
  const t = useTranslations("files.workspace");
  const [zoom, setZoom] = useState(1);
  // Whether the original is drawn here (a PDF or an image), for the zoom buttons.
  const [scrolls, setScrolls] = useState(false);
  const scroller = useCallback(
    (element: HTMLElement | null) => {
      setScrolls(element !== null);
      onScroller(element);
    },
    [onScroller],
  );

  return (
    <Pane
      title={t("original")}
      detail={source?.name}
      hidden={hidden}
      className={className}
      actions={
        source && (
          <>
            {source.contentType === "application/pdf" && scrolls && (
              <>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("zoomOut")}
                  title={t("zoomOut")}
                  disabled={zoom <= ZOOM_MIN}
                  onClick={() => setZoom((value) => Math.max(ZOOM_MIN, value - ZOOM_STEP))}
                >
                  <ZoomOut />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("zoomIn")}
                  title={t("zoomIn")}
                  disabled={zoom >= ZOOM_MAX}
                  onClick={() => setZoom((value) => Math.min(ZOOM_MAX, value + ZOOM_STEP))}
                >
                  <ZoomIn />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              asChild
              aria-label={t("downloadOriginal")}
              title={t("downloadOriginal")}
            >
              <a href={fileHref(orderId, documentId, source.id)}>
                <Download />
              </a>
            </Button>
          </>
        )
      }
    >
      {source ? (
        <OriginalPreview
          orderId={orderId}
          documentId={documentId}
          source={source}
          zoom={zoom}
          scrollerRef={scroller}
        />
      ) : (
        <Note>{t("noOriginal")}</Note>
      )}
    </Pane>
  );
}

/**
 * The source file, shown if it is a PDF or an image; offered as a download if not.
 *
 * A PDF is drawn page by page here so the translation can follow its
 * position. If it cannot be (a PDF pdf.js will not open), the browser's own
 * viewer shows it instead, and the two sides do not scroll together.
 */
function OriginalPreview({
  orderId,
  documentId,
  source,
  zoom,
  scrollerRef,
}: {
  orderId: number;
  documentId: number;
  source: SourceFile;
  zoom: number;
  /** The element that scrolls the original, as it appears and goes. */
  scrollerRef: (element: HTMLElement | null) => void;
}) {
  const t = useTranslations("files.workspace");
  const href = fileHref(orderId, documentId, source.id);
  const kind =
    source.contentType === "application/pdf"
      ? "pdf"
      : /^image\/(png|jpeg|webp|gif)$/.test(source.contentType)
        ? "image"
        : null;
  const [bytes, setBytes] = useState<ArrayBuffer | null>(null);
  const kept = useRef<ArrayBuffer | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [nativeUrl, setNativeUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!kind) return;
    let made: string | null = null;
    let cancelled = false;
    fetch(href)
      .then((response) => (response.ok ? response.blob() : Promise.reject(new Error("failed"))))
      .then(async (blob) => {
        if (cancelled) return;
        if (kind === "pdf") {
          kept.current = await blob.arrayBuffer();
          setBytes(kept.current);
          return;
        }
        // Typed here, never by the upload: these bytes only ever reach an <img>.
        made = URL.createObjectURL(new Blob([blob], { type: source.contentType }));
        setImageUrl(made);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      if (made) URL.revokeObjectURL(made);
    };
  }, [href, kind, source.contentType]);

  // pdf.js could not open it: the browser's own viewer, from a blob: URL this
  // page types itself, so the bytes only ever reach a PDF viewer. Its pages
  // are gone from this page, so the scroller goes with them.
  const unreadable = useCallback(() => {
    if (kept.current) {
      setNativeUrl(URL.createObjectURL(new Blob([kept.current], { type: "application/pdf" })));
    }
    setBytes(null);
  }, []);
  useEffect(
    () => () => {
      if (nativeUrl) URL.revokeObjectURL(nativeUrl);
    },
    [nativeUrl],
  );

  const download = (
    <Button variant="outline" size="sm" asChild>
      <a href={href}>
        <Download /> {t("downloadOriginal")}
      </a>
    </Button>
  );

  if (!kind || failed) {
    return (
      <Note>
        {failed ? t("originalFailed") : t("noPreview")}
        {download}
      </Note>
    );
  }
  if (nativeUrl) {
    return <iframe src={nativeUrl} title={source.name} className="size-full" />;
  }
  if (kind === "pdf" && bytes) {
    return <PdfPages data={bytes} zoom={zoom} scrollerRef={scrollerRef} onFailed={unreadable} />;
  }
  if (kind === "image" && imageUrl) {
    return (
      <div ref={scrollerRef} className="size-full overflow-auto bg-white p-3">
        {/* A blob: URL of the user's own file: next/image has nothing to optimise. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={source.name} className="mx-auto max-w-full" />
      </div>
    );
  }
  return (
    <Note>
      <Loader2 className="size-5 animate-spin" aria-hidden />
      {t("loadingOriginal")}
    </Note>
  );
}
