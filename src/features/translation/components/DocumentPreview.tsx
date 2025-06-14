"use client";
import React, { useEffect, useState, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ZoomIn, ZoomOut, RotateCcw, FileText, File, Subtitles } from 'lucide-react';
import { Button } from '@/features/ui/components/ui/button';
import { useDocumentTranslationStore } from '@/features/translation/store/documentTranslationStore';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface DocumentPreviewProps {
  file: File | null;
}

// Helper function to get file type
const getFileType = (file: File): string => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  return extension || '';
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

// Text Preview Component
const TextPreview: React.FC<{ file: File }> = ({ file }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        const text = await readFileAsText(file);
        setContent(text);
      } catch (err) {
        setError('Failed to load file content');
        console.error('Text file load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [file]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full text-muted-foreground">
        <p>Loading text file...</p>
      </div>
    );
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
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        const text = await readFileAsText(file);
        setContent(text);
      } catch (err) {
        setError('Failed to load subtitle file');
        console.error('SRT file load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [file]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full text-muted-foreground">
        <p>Loading subtitle file...</p>
      </div>
    );
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
            <span className="font-medium">Subtitle Preview</span>
          </div>
          <p className="text-xs text-muted-foreground">
            SubRip (.srt) subtitle file
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
  return (
    <div className="flex flex-col justify-center items-center h-full text-muted-foreground p-8">
      <File className="h-16 w-16 mb-4" />
      <div className="text-center">
        <h3 className="font-medium text-lg mb-2">Word Document</h3>
        <p className="text-sm mb-4">
          {file.name}
        </p>
        <p className="text-xs">
          Preview not available for Word documents.<br />
          The document will be processed for translation.
        </p>
      </div>
    </div>
  );
};

// PDF Preview Component (existing functionality)
const PdfPreview: React.FC<{ file: File }> = ({ file }) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(600);
  const [scale, setScale] = useState<number>(2.0);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { shouldResetZoom, setShouldResetZoom, translatedMarkdown } = useDocumentTranslationStore();

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
    if (file) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      setNumPages(null);
      setIsRendering(true);
      
      return () => {
        URL.revokeObjectURL(url);
        setFileUrl(null);
      };
    } else {
      setFileUrl(null);
      setNumPages(null);
    }
  }, [file]);

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
    setIsRendering(false);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error.message);
    setIsRendering(false);
  };

  if (!fileUrl) {
    return (
      <div className="mt-4 p-4 border rounded-md text-center text-muted-foreground">
        No PDF file available for preview.
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div 
        ref={containerRef} 
        className="flex-1 min-h-0 border rounded-md bg-slate-50 dark:bg-slate-800 overflow-y-auto mb-4"
      >
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex justify-center items-center h-full text-muted-foreground">
              <p>Loading PDF...</p>
            </div>
          }
          error={
            <div className="flex justify-center items-center h-full text-red-500">
              <p>Failed to load PDF. Check console for details.</p>
            </div>
          }
        >
          {numPages && Array.from(new Array(numPages), (_, index) => (
            <Page
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              width={containerWidth}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="flex justify-center mb-2 shadow-md"
            />
          ))}
        </Document>
      </div>

      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Zoom:</span>
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
            <span className="text-sm text-muted-foreground">Rendering...</span>
          )}
          {numPages && (
            <span className="text-sm text-muted-foreground">
              {numPages} page{numPages !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ file }) => {
  if (!file) {
    return (
      <div className="mt-4 p-4 border rounded-md text-center text-muted-foreground">
        No document selected or preview not available.
      </div>
    );
  }

  const fileType = getFileType(file);

  // Render appropriate preview based on file type
  switch (fileType) {
    case 'pdf':
      return <PdfPreview file={file} />;
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
            <h3 className="font-medium text-lg mb-2">Unsupported File Type</h3>
            <p className="text-sm mb-4">
              {file.name}
            </p>
            <p className="text-xs">
              Preview not available for this file type.<br />
              The file will be processed for translation.
            </p>
          </div>
        </div>
      );
  }
};

export default DocumentPreview;