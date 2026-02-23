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
}

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
    default:
      return 'unknown';
  }
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState("Preparing preview...");
  const [scale, setScale] = useState<number>(1.0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { shouldResetZoom, setShouldResetZoom } = useDocumentTranslationStore();

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

      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{t('zoom')}</span>
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
          <span className="text-sm font-mono min-w-[4rem] text-center">
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
const PdfPreview: React.FC<{ file: File }> = ({ file }) => {
  const t = useTranslations("DocumentTranslationCard.documentPreview");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [pdfModule, setPdfModule] = useState<{
    Document: React.ComponentType<any>;
    Page: React.ComponentType<any>;
  } | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(600);
  const [scale, setScale] = useState<number>(1.0);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [stage, setStage] = useState("Preparing preview...");
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { shouldResetZoom, setShouldResetZoom, translatedMarkdown, setRealPageCount } = useDocumentTranslationStore();

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
            Document: mod.Document as React.ComponentType<any>,
            Page: mod.Page as React.ComponentType<any>,
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
  }, [file, t]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measureWidth = () => {
      const width = container.offsetWidth || container.clientWidth || 600;
      setContainerWidth(width > 0 ? width : 600);
    };

    measureWidth();

    const resizeObserver = new ResizeObserver(entries => {
      const newWidth = entries[0]?.contentRect.width || 600;
      setContainerWidth(newWidth > 0 ? newWidth : 600);
    });
    
    resizeObserver.observe(container);
    return () => resizeObserver.unobserve(container);
  }, []);

  // Reset zoom to 100% when translation is completed and markdown is shown
  useEffect(() => {
    if (shouldResetZoom && translatedMarkdown) {
      updateScale(1.0);
      setShouldResetZoom(false);
    }
  }, [shouldResetZoom, translatedMarkdown, setShouldResetZoom]);

  const onDocumentLoadSuccess = ({ numPages: nextNumPages }: { numPages: number }) => {
    setNumPages(nextNumPages);
    setRealPageCount(nextNumPages); // Set the real page count from PDF parser for loading progress calculation
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
        ref={containerRef} 
        className="flex-1 min-h-0 border rounded-md bg-slate-50 dark:bg-slate-800 overflow-y-auto mb-4"
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
              width={containerWidth}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="flex justify-center mb-2 shadow-md"
            />
          ))}
        </PdfDocument>
      </div>

      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{t('zoom')}</span>
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
          <span className="text-sm font-mono min-w-[4rem] text-center">
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
  const { shouldResetZoom, setShouldResetZoom } = useDocumentTranslationStore();

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

      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{t('zoom')}</span>
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
          <span className="text-sm font-mono min-w-[4rem] text-center">
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

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ file }) => {
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
      return <PdfPreview file={file} />;
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

export default DocumentPreview;