"use client";
import { isSrtResult } from "@/features/translation/utils/resultFormat";
import { ChangeEvent, useRef, useEffect, useState, useCallback, type RefObject } from "react";
// import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { generateLocalizedFilename, useTranslatedSuffix } from "@/shared/utils/filenameUtils";
import FileInfoDisplay from "./FileInfoDisplay";
import CopyButton from "./CopyButton";
import DownloadButton from "./DownloadButton";
import SuggestionsPanel from './SuggestionsPanel';
import SuggestionsJumpButton from './SuggestionsJumpButton';
import TranslationEditor, { type TranslationEditorHandle } from "@/features/editor/TranslationEditor";
import { useSuggestionsStore } from "../store/suggestionsStore";
import { Button } from "@/features/ui/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/features/ui/components/ui/dialog";
import { FileText, File, Download, X, Eye, EyeOff, FileDown, Pencil } from "lucide-react";
import React from "react";
import { toast } from "react-hot-toast";
import DocumentPreview from "./DocumentPreview";
import { translationAsHtml, wordBlob } from "@/features/translation/utils/wordPage";
import { originalPageSetup } from "@/features/translation/utils/originalPage";
// import { Skeleton } from "@/features/ui/components/ui/skeleton";





// const DocumentPreview = dynamic(() => import("./DocumentPreview"), {
//   ssr: false,
//   loading: () => (
//     <div className="h-full p-4">
//       <Skeleton className="mb-3 h-6 w-40" />
//       <Skeleton className="h-[260px] w-full rounded-lg" />
//     </div>
//   ),
// });

/**
 * Isolated column that only re-renders when currentFile or hide state changes.
 * Receives currentFile as prop (no store subscription) so it does NOT re-render
 * when translatedMarkdown changes (avoids flickering on CKEditor keystrokes).
 */
const DocumentPreviewColumn = React.memo(function DocumentPreviewColumn({
  documentPreviewRef,
  hideOriginalDocument,
  setHideOriginalDocument,
  onFileChange,
  onRemoveFile,
  currentFile,
}: {
  documentPreviewRef: React.RefObject<HTMLDivElement | null>;
  hideOriginalDocument: boolean;
  setHideOriginalDocument: (hide: boolean) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
  currentFile: File | null;
}) {
  const t = useTranslations("DocumentTranslationCard");

  if (hideOriginalDocument) return null;

  return (
    <div className="w-full mb-10 lg:mb-0 md:flex-1 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
        <div className="font-semibold text-suliko-default-color text-sm md:text-base">
          {t("originalDocument")}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setHideOriginalDocument(true)}
          className="transition-all duration-200 shrink-0"
          title={t("hideOriginal")}
          aria-label={t("hideOriginal")}
        >
          <EyeOff className="h-4 w-4" />
        </Button>
      </div>
      <div
        className="h-[400px] md:h-[600px] lg:h-[800px] max-h-[400px] md:max-h-[600px] lg:max-h-[800px] flex flex-col w-full"
        ref={documentPreviewRef}
      >
        <div className="space-y-4 h-full flex flex-col">
          <div className="flex-1 min-h-0">
            {currentFile && (
              <DocumentPreview key={currentFile.name + currentFile.size} file={currentFile} />
            )}
          </div>
          {currentFile && (
            <FileInfoDisplay
              file={currentFile}
              onFileChange={onFileChange}
              onRemoveFile={onRemoveFile}
              id="file-upload-change-split"
            />
          )}
        </div>
      </div>
    </div>
  );
});

interface TranslationResultViewProps {
  currentFile: File;
  translatedMarkdown: string;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
  onEdit: (content: string) => void;
  isSuggestionsLoading: boolean;
  /**
   * `translationResult.outputFormat` — what the server produced. Nothing supplies it on
   * this path yet, because the live store carries only the requested format, so the file
   * name decides. Kept here so the two result views take the same input.
   */
  outputFormat?: number | null;
  isOcrOnly?: boolean;
  onOcrOnlyChange?: (checked: boolean) => void;
}

const TranslationResultView: React.FC<TranslationResultViewProps> = ({
  currentFile,
  outputFormat,
  translatedMarkdown,
  onFileChange,
  onRemoveFile,
  onEdit,
  isSuggestionsLoading,
}) => {
  const tButton = useTranslations('TranslationButton');
  const t = useTranslations('DocumentTranslationCard');
  const tDownload = useTranslations('DownloadFormats');
  const translatedSuffix = useTranslatedSuffix();
  const documentPreviewRef = useRef<HTMLDivElement>(null);
  const markdownPreviewRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);
  const editorRef = useRef<TranslationEditorHandle>(null) as RefObject<TranslationEditorHandle>;
  // The Word editor scrolls its own pages; the simple editor is scrolled by the box around it.
  const [wordScroller, setWordScroller] = useState<HTMLElement | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [hideOriginalDocument, setHideOriginalDocument] = useState(false);
  type DownloadFormatOption = { value: string; label: string; extension: string; icon: React.ReactNode };
  const [downloadedFormat, setDownloadedFormat] = useState<DownloadFormatOption | null>(null);
  const [editorDeadline, setEditorDeadline] = useState<number | null>(null);
  // const [remainingSeconds, setRemainingSeconds] = useState<number>(600);
  const { hoveredSuggestionOriginalText, suggestions } = useSuggestionsStore();
  const suggestionsPanelRef = useRef<HTMLDivElement>(null);

  const onFileChangeRef = useRef(onFileChange);
  const onRemoveFileRef = useRef(onRemoveFile);
  onFileChangeRef.current = onFileChange;
  onRemoveFileRef.current = onRemoveFile;
  const stableOnFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => onFileChangeRef.current?.(e),
    []
  );
  const stableOnRemoveFile = useCallback(() => onRemoveFileRef.current?.(), []);

  // Same rule as the history view. Here currentFile is genuinely the document being
  // translated, so the file-name fallback is accurate -- but the rule lives in one place
  // so the two cannot drift apart.
  const isSrtDownload = isSrtResult(outputFormat, currentFile?.name);

  const hasTranslatedContent = !!translatedMarkdown;

  useEffect(() => {
    if (!hasTranslatedContent) return;

    const documentContainer =
      documentPreviewRef.current?.querySelector(".overflow-y-auto");
    const markdownContainer =
      wordScroller ?? markdownPreviewRef.current?.querySelector(".overflow-y-auto");

    if (!documentContainer || !markdownContainer) return;

    const syncScroll = (source: Element, target: Element, event: Event) => {
      if (isScrolling.current) return;
      event.preventDefault();

      isScrolling.current = true;
      requestAnimationFrame(() => {
        const sourceScrollPercent =
          source.scrollTop / (source.scrollHeight - source.clientHeight);
        const targetScrollMax = target.scrollHeight - target.clientHeight;
        target.scrollTop = sourceScrollPercent * targetScrollMax;
        isScrolling.current = false;
      });
    };

    const handleDocumentScroll = (e: Event) =>
      syncScroll(documentContainer, markdownContainer, e);
    const handleMarkdownScroll = (e: Event) =>
      syncScroll(markdownContainer, documentContainer, e);

    documentContainer.addEventListener("scroll", handleDocumentScroll);
    markdownContainer.addEventListener("scroll", handleMarkdownScroll);

    return () => {
      documentContainer.removeEventListener("scroll", handleDocumentScroll);
      markdownContainer.removeEventListener("scroll", handleMarkdownScroll);
    };
  }, [hasTranslatedContent, wordScroller]);

  // Start 10-minute editor timer on first mount of the result view
  useEffect(() => {
    if (editorDeadline === null) {
      setEditorDeadline(Date.now() + 10 * 60 * 1000);
    }
    // no cleanup needed here
  }, [editorDeadline]);

  // Tick countdown each second
  // useEffect(() => {
  //   if (editorDeadline === null) return;
  //   const intervalId = setInterval(() => {
  //     const secondsLeft = Math.max(0, Math.floor((editorDeadline - Date.now()) / 1000));
  //     setRemainingSeconds(secondsLeft);
  //     if (secondsLeft <= 0) {
  //       clearInterval(intervalId);
  //     }
  //   }, 1000);
  //   return () => clearInterval(intervalId);
  // }, [editorDeadline]);

  // const formatTime = (totalSeconds: number) => {
  //   const minutes = Math.floor(totalSeconds / 60);
  //   const seconds = totalSeconds % 60;
  //   const mm = String(minutes).padStart(2, "0");
  //   const ss = String(seconds).padStart(2, "0");
  //   return `${mm}:${ss}`;
  // };

  useEffect(() => {
    if (!downloadedFormat) return;
    // Call DownloadButton logic here
    const triggerDownload = async () => {
      // mimic DownloadButton logic
      const fileType = downloadedFormat.value;
      const originalFileName = currentFile?.name || "document";
      const fileName = generateLocalizedFilename(originalFileName, fileType, translatedSuffix);
      if (["txt", "md", "srt"].includes(fileType)) {
        const text = translatedMarkdown.replace(/<[^>]+>/g, "");
        const blob = new Blob([text], { type: fileType === "md" ? "text/markdown" : fileType === "srt" ? "text/srt" : "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (fileType === "docx") {
        // Prefer the editor's current HTML — it's the same content the user sees and
        // what copy-paste into Word uses, so formatting is guaranteed to be correct.
        // Fall back to the loaded translation when the ref isn't ready.
        // The Word editor writes the Word file itself; the simple editor's HTML is put in one.
        const editorHtml = editorRef.current?.getHTML();
        const bodyHtml = editorHtml && editorHtml !== "<p></p>" ? editorHtml : translationAsHtml(translatedMarkdown);
        const blob = (await editorRef.current?.toDocx()) ?? (await wordBlob(bodyHtml, await originalPageSetup(currentFile)));
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (fileType === "pdf") {
        try {
          // From the Word file, by the server, where the Word editor is in use: laid out as Word
          // lays it out. From the HTML here when there is no Word file or the server cannot.
          let sent = false;
          const made = editorRef.current?.toPdf();
          if (made) {
            try {
              const blob = await made;
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = fileName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              sent = true;
            } catch (error) {
              console.warn("The server could not make the PDF; making it here.", error);
            }
          }
          if (!sent) {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { marked } = require("marked") as { marked: (src: string, options?: { async?: false }) => string };
            const editorHtml = editorRef.current?.getHTML();
            const htmlContent = editorHtml && editorHtml !== "<p></p>"
              ? editorHtml
              : (() => {
                  const isHtml = translatedMarkdown.trimStart().startsWith("<");
                  return isHtml ? translatedMarkdown : (marked(translatedMarkdown, { async: false }) as string);
                })();
            const { generatePdfFromHtml } = await import("@/features/translation/utils/html2pdf-client");
            await generatePdfFromHtml(htmlContent, fileName);
          }
        } catch (err) {
          console.error("PDF export failed:", err);
          toast.error("Failed to generate PDF. Please try again.");
        }
      }

      setDownloadedFormat(null);
    };
    triggerDownload();
  }, [downloadedFormat, translatedMarkdown, currentFile, translatedSuffix]);

  
  return (
    <>
      <div className={hideOriginalDocument ? "relative" : "relative flex flex-col lg:flex-row gap-4 lg:gap-8"}>
        <DocumentPreviewColumn
          documentPreviewRef={documentPreviewRef}
          hideOriginalDocument={hideOriginalDocument}
          setHideOriginalDocument={setHideOriginalDocument}
          onFileChange={stableOnFileChange}
          onRemoveFile={stableOnRemoveFile}
          currentFile={currentFile}
        />

        <SuggestionsJumpButton
          count={suggestions.length}
          targetRef={suggestionsPanelRef}
          sideBySideAt={hideOriginalDocument ? null : "lg"}
        />

        <div className={hideOriginalDocument ? "w-full" : "w-full lg:flex-1 min-w-0"}>
          {/* Header Section */}
          <div className="mb-4 border-b border-border pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Pencil className="h-4 w-4 text-suliko-default-color" aria-hidden="true" />
                <div className="font-semibold text-suliko-default-color text-sm md:text-base">
                  {t('translatedText')}
                </div>
                {/* {remainingSeconds > 0 ? (
                  <span className={`text-xs flex items-center gap-1 whitespace-nowrap px-2 py-0.5 rounded-full ${remainingSeconds <= 120
                    ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 font-medium animate-pulse"
                    : "text-muted-foreground"
                    }`}>
                    <Clock className="h-3 w-3" />
                    {formatTime(remainingSeconds)}
                  </span>
                ) : (
                  <span className="text-xs flex items-center gap-1 font-medium whitespace-nowrap px-2 py-0.5 rounded-full bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400">
                    <AlertTriangle className="h-3 w-3" />
                    {t('editorTimeExpired')}
                  </span>
                )} */}
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center gap-2 shrink-0">
                {hideOriginalDocument && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setHideOriginalDocument(false)}
                    className="transition-all duration-200"
                    title={t('showOriginal')}
                    aria-label={t('showOriginal')}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                {isSrtDownload ? (
                  <DownloadButton
                    content={translatedMarkdown}
                    size="sm"
                    variant="outline"
                    fileType="srt"
                    label={tButton('download')}
                  />
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDownloadModal(true)}
                      className="transition-all duration-200"
                      title={tButton('download')}
                      aria-label={tButton('download')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <CopyButton
                      content={translatedMarkdown}
                      size="sm"
                      variant="outline"
                    />
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="h-full max-h-[400px] md:max-h-[600px] lg:max-h-[800px] overflow-y-auto" ref={markdownPreviewRef}>
            <TranslationEditor
              ref={editorRef}
              translatedMarkdown={translatedMarkdown}
              onChange={onEdit}
              hoveredText={hoveredSuggestionOriginalText}
              file={currentFile}
              forceSimple={isOriginalFileSrt()}
              onScroller={setWordScroller}
              className="h-[400px] md:h-[600px] lg:h-[800px]"
            />
          </div>
        </div>
      </div>
      <div ref={suggestionsPanelRef}>
        <SuggestionsPanel isSuggestionsLoading={isSuggestionsLoading} />
      </div>
      <Dialog open={showDownloadModal} onOpenChange={setShowDownloadModal}>
        <DialogContent className="max-w-xs mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">{tDownload('chooseFormat')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-2">
            {[
              { value: "pdf", label: tDownload("pdfDocument"), extension: "pdf", icon: <FileDown className="w-4 h-4 text-red-500 dark:text-red-400" /> },
              { value: "docx", label: tDownload("wordDocument"), extension: "docx", icon: <File className="w-4 h-4 text-blue-500 dark:text-blue-400" /> },
              { value: "txt", label: tDownload("textFile"), extension: "txt", icon: <FileText className="w-4 h-4 text-muted-foreground" /> },
            ].map(format => (
              <Button
                key={format.value}
                variant="outline"
                className="flex items-center gap-3 justify-start h-11 rounded-xl border-border/60 hover:border-primary/30 hover:bg-muted/50 transition-all"
                onClick={() => {
                  setShowDownloadModal(false);
                  setDownloadedFormat(format);
                }}
              >
                {format.icon}
                <span className="text-sm">{format.label}</span>
              </Button>
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => setShowDownloadModal(false)}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TranslationResultView;
