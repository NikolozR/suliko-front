"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useTranslations } from "next-intl";
import { ZoomIn, ZoomOut, RotateCcw, FileText, File, Subtitles } from 'lucide-react';
import { Button } from '@/features/ui/components/ui/button';
import { useDocumentTranslationStore } from '@/features/translation/store/documentTranslationStore';
import { Skeleton } from '@/features/ui/components/ui/skeleton';
import Image from 'next/image';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

interface DocumentPreviewProps {
  file: File | null;
  /**
   * Whether a PDF's page count is reported to the document screen's store,
   * which shows it beside the file being translated. False where the preview
   * is of some other file (an order's), whose count is not that screen's.
   */
  trackPageCount?: boolean;
}

type PdfDocumentComponent = React.ComponentType<{
  file: string;
  onLoadSuccess: ({ numPages }: { numPages: number }) => void;
  onLoadError: (error: Error) => void;
  loading?: React.ReactNode;
  error?: React.ReactNode;
  children?: React.ReactNode;
}>;

/** How wide a PDF's page is drawn at 100%, where there is room for it. */
const PDF_PAGE_WIDTH = 600;

type PdfPageComponent = React.ComponentType<{
  pageNumber: number;
  width: number;
  scale: number;
  renderTextLayer: boolean;
  renderAnnotationLayer: boolean;
  className?: string;
}>;

// Helper function to get file type
const getFileType = (file: File): string => {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  // Image types
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension)) {
    return 'image';
  }

  // Document types
  switch (extension) {
    case 'pdf':
      return 'pdf';
    case 'txt':
      return 'txt';
    case 'srt':
      return 'srt';
    case 'doc':
    case 'docx':
      return 'docx';
    case 'html':
    case 'htm':
      return 'html';
    default:
      return 'unknown';
  }
};

/**
 * The web page inside a Word file that carries its text as one ("altChunk").
 *
 * This site's own Word export writes its files this way (html-docx-js): the
 * document proper is empty and points at an embedded page, which Word draws.
 * Mammoth reads only the document proper, so such a file came out blank.
 * Returns null for a Word file that has no such part.
 */
async function embeddedPageOf(buffer: ArrayBuffer): Promise<string | null> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(buffer);
  // The page as it is (`afchunk.htm`, what this site writes)...
  const page = zip.file(/^word\/[^/]+\.html?$/i)[0];
  if (page) return page.async('string');

  // ...or wrapped as a web archive (`afchunk.mht`, what other builds of the
  // same library write): one HTML part between the MIME headers and the
  // closing boundary, with every "=" written as "=3D".
  const archive = zip.file(/^word\/[^/]+\.mht$/i)[0];
  if (!archive) return null;
  const packed = await archive.async('string');
  const start = packed.search(/<(!doctype|html)/i);
  if (start < 0) return null;
  const end = packed.lastIndexOf('------=mhtDocumentPart--');
  return packed.slice(start, end > start ? end : undefined).replace(/=3D/g, '=');
}

/**
 * A page from a file, shown as it is and kept apart from this site: the frame
 * runs no scripts and has no access to the page around it.
 */
const SandboxedPage: React.FC<{ html: string; title: string }> = ({ html, title }) => (
  <iframe
    sandbox=""
    srcDoc={html}
    title={title}
    className="h-full w-full rounded-md border bg-white"
  />
);

// HTML Preview Component
const HtmlPreview: React.FC<{ file: File }> = ({ file }) => {
  const t = useTranslations("DocumentTranslationCard.documentPreview");
  const [html, setHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setHtml(null);
    setFailed(false);
    file
      .text()
      .then((text) => {
        if (!cancelled) setHtml(text);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [file]);

  if (failed) {
    return (
      <div className="flex justify-center items-center h-full text-red-500">
        <p>{t('loadErrorWord')}</p>
      </div>
    );
  }
  if (html === null) return <PreviewLoadingState stage="Preparing preview..." />;
  return <SandboxedPage html={html} title={file.name} />;
};

// Helper function to read file as text
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
};

const PreviewLoadingState: React.FC<{ stage: string }> = ({ stage }) => {
  return (
    <div className="h-full p-4">
      <div className="mb-3 text-sm text-muted-foreground">{stage}</div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
};

// Text Preview Component
const TextPreview: React.FC<{ file: File }> = ({ file }) => {
  const t = useTranslations("DocumentTranslationCard.documentPreview");
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState("Preparing preview...");

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        setStage("Preparing preview...");
        const text = await readFileAsText(file);
        setStage("Rendering preview...");
        setContent(text);
      } catch (err) {
        setError(t('loadError'));
        console.error('Text file load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [file, t]);

  if (loading) {
    return <PreviewLoadingState stage={stage} />;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 h-full overflow-y-auto">
      <pre className="whitespace-pre-wrap text-sm font-mono text-foreground leading-relaxed">
        {content}
      </pre>
    </div>
  );
};

// SRT Preview Component
const SrtPreview: React.FC<{ file: File }> = ({ file }) => {
  const t = useTranslations("DocumentTranslationCard.documentPreview");
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState("Preparing subtitle preview...");

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        setStage("Preparing subtitle preview...");
        const text = await readFileAsText(file);
        setStage("Rendering subtitle preview...");
        setContent(text);
      } catch (err) {
        setError(t('loadErrorSubtitle'));
        console.error('SRT file load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [file, t]);

  if (loading) {
    return <PreviewLoadingState stage={stage} />;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 h-full overflow-y-auto">
      <div className="text-sm text-foreground">
        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Subtitles className="h-4 w-4" />
            <span className="font-medium">{t('subtitlePreview')}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('subtitleType')}
          </p>
        </div>
        <pre className="whitespace-pre-wrap font-mono leading-relaxed">
          {content}
        </pre>
      </div>
    </div>
  );
};

// Word Document Preview Component
const WordPreview: React.FC<{ file: File }> = ({ file }) => {
  const t = useTranslations("DocumentTranslationCard.documentPreview");
  const [content, setContent] = useState<string>('');
  // Set instead of `content` for a file whose text is an embedded web page.
  const [embeddedPage, setEmbeddedPage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState("Preparing preview...");
  const [scale, setScale] = useState<number>(1.0);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldResetZoom = useDocumentTranslationStore((state) => state.shouldResetZoom);
  const setShouldResetZoom = useDocumentTranslationStore((state) => state.setShouldResetZoom);

  const minScale = 0.5;
  const maxScale = 3.0;
  const scaleStep = 0.25;

  const handleZoomIn = () => setScale(Math.min(scale + scaleStep, maxScale));
  const handleZoomOut = () => setScale(Math.max(scale - scaleStep, minScale));
  const handleResetZoom = () => setScale(1.0);

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        setStage("Preparing preview...");
        const arrayBuffer = await file.arrayBuffer();
        setStage("Rendering document...");
        const mammoth = (await import('mammoth')).default;
        const result = await mammoth.convertToHtml({ arrayBuffer });
        // Nothing in the document proper: its text may be an embedded page.
        const blank = !result.value.replace(/<[^>]*>/g, '').trim();
        const embedded = blank ? await embeddedPageOf(arrayBuffer).catch(() => null) : null;
        setEmbeddedPage(embedded);
        setContent(result.value);
      } catch (err) {
        setError(t('loadErrorWord'));
        console.error('Word document load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [file, t]);

  // Reset zoom when translation is completed
  useEffect(() => {
    if (shouldResetZoom) {
      setScale(1.0);
      setShouldResetZoom(false);
    }
  }, [shouldResetZoom, setShouldResetZoom]);

  if (loading) {
    return <PreviewLoadingState stage={stage} />;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (embeddedPage) return <SandboxedPage html={embeddedPage} title={file.name} />;

  return (
    <div className="w-full h-full flex flex-col">
      <div
        ref={containerRef}
        className="flex-1 min-h-0 border rounded-md bg-slate-50 dark:bg-slate-800 overflow-auto mb-4"
      >
        <div
          className="p-4 min-h-full"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease-in-out'
          }}
        >
          <div
            dangerouslySetInnerHTML={{ __html: content }}
            className="prose prose-sm max-w-none dark:prose-invert bg-white dark:bg-slate-900 p-8 rounded-lg shadow-sm text-foreground"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 p-3 bg-muted/30 rounded-lg shrink-0">
        <div className="flex items-center gap-2">
          <span className="sr-only text-sm font-medium sm:not-sr-only">{t('zoom')}</span>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= minScale}
            className="p-2"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-mono min-w-12 text-center sm:min-w-16">
            {(scale * 100).toFixed(0)}%
          </span>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={handleZoomIn}
            disabled={scale >= maxScale}
            className="p-2"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={handleResetZoom}
            disabled={scale === 1.0}
            className="p-2"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// PDF Preview Component (existing functionality)
const PdfPreview: React.FC<{ file: File; trackPageCount: boolean }> = ({ file, trackPageCount }) => {
  const t = useTranslations("DocumentTranslationCard.documentPreview");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [pdfModule, setPdfModule] = useState<{
    Document: PdfDocumentComponent;
    Page: PdfPageComponent;
  } | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(PDF_PAGE_WIDTH);
  const [scale, setScale] = useState<number>(1.0);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [stage, setStage] = useState("Preparing preview...");
  // The box the pages are drawn in. Kept in state, not in a ref: it is not on
  // the page until the viewer has loaded, and its width is measured from then.
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  // const { shouldResetZoom, setShouldResetZoom, translatedMarkdown, setRealPageCount } = useDocumentTranslationStore();
  const shouldResetZoom = useDocumentTranslationStore(
    (state) => state.shouldResetZoom
  );


  const setShouldResetZoom = useDocumentTranslationStore(
    (state) => state.setShouldResetZoom
  );

  const setRealPageCount = useDocumentTranslationStore(
    (state) => state.setRealPageCount
  );

  const minScale = 0.5;
  const maxScale = 3.0;
  const scaleStep = 0.25;

  const debouncedScale = useRef<number>(scale);
  const scaleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateScale = (newScale: number) => {
    setScale(newScale);

    if (scaleTimeoutRef.current) {
      clearTimeout(scaleTimeoutRef.current);
    }

    scaleTimeoutRef.current = setTimeout(() => {
      debouncedScale.current = newScale;
    }, 150);
  };

  const handleZoomIn = () => updateScale(Math.min(scale + scaleStep, maxScale));
  const handleZoomOut = () => updateScale(Math.max(scale - scaleStep, minScale));
  const handleResetZoom = () => updateScale(1.0);

  useEffect(() => {
    let cancelled = false;
    setStage("Preparing preview...");

    import("react-pdf")
      .then((mod) => {
        mod.pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();
        if (!cancelled) {
          setPdfModule({
            Document: mod.Document as unknown as PdfDocumentComponent,
            Page: mod.Page as unknown as PdfPageComponent,
          });
        }
      })
      .catch((error) => {
        console.error("Failed to load PDF viewer:", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      setNumPages(null);
      setIsRendering(true);
      setStage("Rendering pages...");

      return () => {
        URL.revokeObjectURL(url);
        setFileUrl(null);
      };
    } else {
      setFileUrl(null);
      setNumPages(null);
    }
  }, [file]);

  const lastWidthRef = useRef<number>(PDF_PAGE_WIDTH);
  const widthChangeThreshold = 5;
  const debounceMs = 100;

  useEffect(() => {
    if (!container) return;

    const measureWidth = () => {
      // Inside the border and beside the scrollbar: the room a page has.
      const width = container.clientWidth || PDF_PAGE_WIDTH;
      const safeWidth = width > 0 ? width : PDF_PAGE_WIDTH;
      lastWidthRef.current = safeWidth;
      setContainerWidth(safeWidth);
    };

    measureWidth();

    let debounceTimer: NodeJS.Timeout | null = null;

    const resizeObserver = new ResizeObserver(entries => {
      const newWidth = entries[0]?.contentRect.width || PDF_PAGE_WIDTH;
      const safeWidth = newWidth > 0 ? newWidth : PDF_PAGE_WIDTH;

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const lastWidth = lastWidthRef.current;
        if (Math.abs(safeWidth - lastWidth) <= widthChangeThreshold) return;
        lastWidthRef.current = safeWidth;
        setContainerWidth(safeWidth);
        debounceTimer = null;
      }, debounceMs);
    });

    resizeObserver.observe(container);
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      resizeObserver.unobserve(container);
    };
  }, [container]);

  // Reset zoom to 100% when translation is completed and markdown is shown
  useEffect(() => {
    if (shouldResetZoom) {
      updateScale(1.0);
      setShouldResetZoom(false);
    }
  }, [shouldResetZoom, setShouldResetZoom]);

  const onDocumentLoadSuccess = ({ numPages: nextNumPages }: { numPages: number }) => {
    setNumPages(nextNumPages);
    // The real page count from the PDF parser, for the loading progress calculation.
    if (trackPageCount) setRealPageCount(nextNumPages);
    setIsRendering(false);
    setStage("Ready");
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error.message);
    setIsRendering(false);
  };

  if (!fileUrl) {
    return (
      <div className="mt-4 p-4 border rounded-md text-center text-muted-foreground">
        {t('noPdfPreview')}
      </div>
    );
  }

  if (!pdfModule) {
    return <PreviewLoadingState stage={stage} />;
  }

  const PdfDocument = pdfModule.Document;
  const PdfPage = pdfModule.Page;

  return (
    <div className="w-full h-full flex flex-col">
      <div
        ref={setContainer}
        // The scrollbar's room is kept from the start, so that its arrival
        // does not narrow the box and draw every page a second time.
        className="flex-1 min-h-0 border rounded-md bg-slate-50 dark:bg-slate-800 overflow-y-auto [scrollbar-gutter:stable] mb-4"
      >
        <PdfDocument
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={<PreviewLoadingState stage={stage || t('loadingPdf')} />}
          error={
            <div className="flex justify-center items-center h-full text-red-500">
              <p>{t('loadErrorPdf')}</p>
            </div>
          }
        >
          {numPages && Array.from(new Array(numPages), (_, index) => (
            <PdfPage
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              // A page's usual width, or the box's where that is narrower (a phone).
              width={Math.min(containerWidth, PDF_PAGE_WIDTH)}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="flex justify-center mb-2 shadow-md"
            />
          ))}
        </PdfDocument>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 p-3 bg-muted/30 rounded-lg shrink-0">
        <div className="flex items-center gap-2">
          <span className="sr-only text-sm font-medium sm:not-sr-only">{t('zoom')}</span>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= minScale || isRendering}
            className="p-2"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-mono min-w-12 text-center sm:min-w-16">
            {(scale * 100).toFixed(0)}%
          </span>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={handleZoomIn}
            disabled={scale >= maxScale || isRendering}
            className="p-2"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={handleResetZoom}
            disabled={scale === 1.0 || isRendering}
            className="p-2"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-3">
          {isRendering && (
            <span className="text-sm text-muted-foreground">{t('rendering')}</span>
          )}
          {numPages && (
            <span className="text-sm text-muted-foreground">
              {t(numPages !== 1 ? 'pages' : 'page', { count: numPages })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Image Preview Component
const ImagePreview: React.FC<{ file: File }> = ({ file }) => {
  const t = useTranslations("DocumentTranslationCard.documentPreview");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1.0);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [stage, setStage] = useState("Preparing image preview...");
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldResetZoom = useDocumentTranslationStore((state) => state.shouldResetZoom);
  const setShouldResetZoom = useDocumentTranslationStore((state) => state.setShouldResetZoom);

  const minScale = 0.5;
  const maxScale = 3.0;
  const scaleStep = 0.25;

  const handleZoomIn = () => setScale(Math.min(scale + scaleStep, maxScale));
  const handleZoomOut = () => setScale(Math.max(scale - scaleStep, minScale));
  const handleResetZoom = () => setScale(1.0);

  useEffect(() => {
    if (file) {
      setStage("Preparing image preview...");
      const url = URL.createObjectURL(file);
      setImageUrl(url);

      // Get image dimensions
      const img = new window.Image();
      img.onload = () => {
        setStage("Rendering image...");
        setDimensions({
          width: img.width,
          height: img.height
        });
      };
      img.src = url;

      return () => {
        URL.revokeObjectURL(url);
        setImageUrl(null);
        setDimensions(null);
      };
    }
  }, [file, t]);

  // Reset zoom when translation is completed
  useEffect(() => {
    if (shouldResetZoom) {
      setScale(1.0);
      setShouldResetZoom(false);
    }
  }, [shouldResetZoom, setShouldResetZoom]);

  if (!imageUrl || !dimensions) {
    return <PreviewLoadingState stage={stage || t('loadingImage')} />;
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div
        ref={containerRef}
        className="flex-1 min-h-0 border rounded-md bg-slate-50 dark:bg-slate-800 overflow-auto mb-4"
      >
        <div className="flex justify-center min-h-full p-4">
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'center',
              transition: 'transform 0.2s ease-in-out',
              position: 'relative',
              width: dimensions.width,
              height: dimensions.height,
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          >
            <Image
              src={imageUrl}
              alt="Preview"
              width={dimensions.width}
              height={dimensions.height}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
              unoptimized // Since we're using a Blob URL
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 p-3 bg-muted/30 rounded-lg shrink-0">
        <div className="flex items-center gap-2">
          <span className="sr-only text-sm font-medium sm:not-sr-only">{t('zoom')}</span>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= minScale}
            className="p-2"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-mono min-w-12 text-center sm:min-w-16">
            {(scale * 100).toFixed(0)}%
          </span>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={handleZoomIn}
            disabled={scale >= maxScale}
            className="p-2"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={handleResetZoom}
            disabled={scale === 1.0}
            className="p-2"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ file, trackPageCount = true }) => {
  const t = useTranslations("DocumentTranslationCard.documentPreview");
  if (!file) {
    return (
      <div className="mt-4 p-4 border rounded-md text-center text-muted-foreground">
        {t('noPreview')}
      </div>
    );
  }

  const fileType = getFileType(file);

  // Render appropriate preview based on file type
  switch (fileType) {
    case 'pdf':
      return <PdfPreview file={file} trackPageCount={trackPageCount} />;
    case 'image':
      return <ImagePreview file={file} />;
    case 'txt':
      return (
        <div className="w-full h-full border rounded-md bg-slate-50 dark:bg-slate-800 overflow-hidden">
          <TextPreview file={file} />
        </div>
      );
    case 'srt':
      return (
        <div className="w-full h-full border rounded-md bg-slate-50 dark:bg-slate-800 overflow-hidden">
          <SrtPreview file={file} />
        </div>
      );
    case 'docx':
    case 'doc':
      return (
        <div className="w-full h-full border rounded-md bg-slate-50 dark:bg-slate-800 overflow-hidden">
          <WordPreview file={file} />
        </div>
      );
    case 'html':
      return (
        <div className="w-full h-full border rounded-md bg-slate-50 dark:bg-slate-800 overflow-hidden">
          <HtmlPreview file={file} />
        </div>
      );
    default:
      return (
        <div className="flex flex-col justify-center items-center h-full text-muted-foreground p-8 border rounded-md">
          <FileText className="h-16 w-16 mb-4" />
          <div className="text-center">
            <h3 className="font-medium text-lg mb-2">{t('unsupportedTitle')}</h3>
            <p className="text-sm mb-4">
              {file.name}
            </p>
            <p className="text-xs">
              {t('unsupportedDesc')}<br />
              {t('willProcess')}
            </p>
          </div>
        </div>
      );
  }
};

export default React.memo(DocumentPreview);