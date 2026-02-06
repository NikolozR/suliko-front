"use client";
import { ChangeEvent, useRef, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { generateLocalizedFilename, useTranslatedSuffix } from "@/shared/utils/filenameUtils";
import DocumentPreview from "./DocumentPreview";
import FileInfoDisplay from "./FileInfoDisplay";
import CopyButton from "./CopyButton";
import DownloadButton from "./DownloadButton";
import SuggestionsPanel from './SuggestionsPanel';
import Editor from "@/features/editor/Editor";
import { Button } from "@/features/ui/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/features/ui/components/ui/dialog";
import { FileText, File, Download, X, Eye, EyeOff, Clock, FileDown } from "lucide-react";
import React from "react";


interface TranslationResultViewProps {
  currentFile: File;
  translatedMarkdown: string;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
  onEdit: (content: string) => void;
  isSuggestionsLoading: boolean;
  isOcrOnly?: boolean;
  onOcrOnlyChange?: (checked: boolean) => void;
}

const TranslationResultView: React.FC<TranslationResultViewProps> = ({
  currentFile,
  translatedMarkdown,
  onFileChange,
  onRemoveFile,
  onEdit,
  isSuggestionsLoading,
}) => {
  const tButton = useTranslations('TranslationButton');
  const t = useTranslations('DocumentTranslationCard');
  const translatedSuffix = useTranslatedSuffix();
  const documentPreviewRef = useRef<HTMLDivElement>(null);
  const markdownPreviewRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [hideOriginalDocument, setHideOriginalDocument] = useState(false);
  type DownloadFormatOption = { value: string; label: string; extension: string; icon: React.ReactNode };
  const [downloadedFormat, setDownloadedFormat] = useState<DownloadFormatOption | null>(null);
  const [editorDeadline, setEditorDeadline] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(600);

  const isOriginalFileSrt = () => {
    const fileExtension = currentFile?.name.split('.').pop()?.toLowerCase();
    return fileExtension === 'srt';
  };

  useEffect(() => {
    const documentContainer =
      documentPreviewRef.current?.querySelector(".overflow-y-auto");
    const markdownContainer =
      markdownPreviewRef.current?.querySelector(".overflow-y-auto");

    if (!documentContainer || !markdownContainer || !translatedMarkdown) return;

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
  }, [translatedMarkdown]);

  // Start 10-minute editor timer on first mount of the result view
  useEffect(() => {
    if (editorDeadline === null) {
      setEditorDeadline(Date.now() + 10 * 60 * 1000);
    }
    // no cleanup needed here
  }, [editorDeadline]);

  // Tick countdown each second
  useEffect(() => {
    if (editorDeadline === null) return;
    const intervalId = setInterval(() => {
      const secondsLeft = Math.max(0, Math.floor((editorDeadline - Date.now()) / 1000));
      setRemainingSeconds(secondsLeft);
      if (secondsLeft <= 0) {
        clearInterval(intervalId);
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }, [editorDeadline]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");
    return `${mm}:${ss}`;
  };

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
        const fullHtml = `<!DOCTYPE html><html><head><meta charset=\"utf-8\"></head><body>${translatedMarkdown}</body></html>`;
        // @ts-expect-error Type errors, nothing special
        const htmlDocx = (await import("html-docx-js/dist/html-docx")).default;
        const blob = htmlDocx.asBlob(fullHtml);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (fileType === "pdf") {
        const { jsPDF } = await import("jspdf");
        const html2canvas = (await import("html2canvas")).default;

        // --- Create isolated wrapper ---
        const wrapper = document.createElement("div");
        wrapper.className = "pdf-export";
        wrapper.innerHTML = translatedMarkdown;

        Object.assign(wrapper.style, {
          position: "fixed",
          left: "-10000px",
          top: "0",
          width: "794px",              // A4 @ 96dpi
          padding: "24px",
          backgroundColor: "#ffffff",
          color: "#000000",            // 🔴 force readable text
          fontFamily: "Arial, sans-serif",
          boxSizing: "border-box",
          lineHeight: "1.5",
        });

        document.body.appendChild(wrapper);

        try {
          // --- Wait for fonts ---
          if (document.fonts?.ready) {
            await document.fonts.ready;
          }

          // --- Wait for images ---
          const images = wrapper.querySelectorAll("img");
          await Promise.all(
            [...images].map(img =>
              img.complete
                ? Promise.resolve()
                : new Promise(resolve => {
                  img.onload = resolve;
                  img.onerror = resolve;
                })
            )
          );

          // --- Let browser fully paint (CRITICAL) ---
          await new Promise(r => requestAnimationFrame(r));
          await new Promise(r => requestAnimationFrame(r));

          // --- Render to canvas ---
          const canvas = await html2canvas(wrapper, {
            scale: 2,
            backgroundColor: "#ffffff",
            useCORS: true,
            logging: false,
          });

          const imgData = canvas.toDataURL("image/png");

          // --- Create PDF ---
          const pdf = new jsPDF({
            orientation: "p",
            unit: "mm",
            format: "a4",
          });

          const pageWidth = 210;
          const pageHeight = 297;
          const margin = 10;

          const imgWidth = pageWidth - margin * 2;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          let position = margin;
          let heightLeft = imgHeight;

          pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
          heightLeft -= pageHeight - margin * 2;

          while (heightLeft > 0) {
            pdf.addPage();
            position = heightLeft - imgHeight + margin;
            pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
            heightLeft -= pageHeight - margin * 2;
          }

          pdf.save(fileName);
        } catch (err) {
          console.error("PDF export failed:", err);
          alert("Failed to generate PDF");
        } finally {
          document.body.removeChild(wrapper);
        }
      }

      setDownloadedFormat(null);
    };
    triggerDownload();
  }, [downloadedFormat, translatedMarkdown, currentFile?.name, translatedSuffix]);

  return (
    <>
      <div className={hideOriginalDocument ? "" : "flex flex-col lg:flex-row gap-4 lg:gap-8"}>
        {!hideOriginalDocument && (
          <div className="w-full mb-10 lg:mb-0 md:flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <div className="font-semibold text-suliko-default-color text-sm md:text-base">
                {t('originalDocument')}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setHideOriginalDocument(true)}
                className="transition-all duration-200 flex-shrink-0"
                title={t('hideOriginal')}
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
                  <DocumentPreview file={currentFile} />
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
        )}

        <div className={hideOriginalDocument ? "w-full" : "w-full lg:flex-1 min-w-0"}>
          {/* Header Section - Redesigned to prevent overlapping */}
          <div className="mb-4 space-y-3">
            {/* Title and Timer Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="font-semibold text-suliko-default-color text-sm md:text-base">
                  {t('translatedText')}
                </div>
                {remainingSeconds > 0 ? (
                  <span className="text-xs text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                    <Clock className="h-3 w-3" />
                    {formatTime(remainingSeconds)}
                  </span>
                ) : (
                  <span className="text-xs text-red-500 flex items-center gap-1 font-medium whitespace-nowrap">
                    <Clock className="h-3 w-3" />
                    {t('editorTimeExpired')}
                  </span>
                )}
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {hideOriginalDocument && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setHideOriginalDocument(false)}
                    className="transition-all duration-200"
                    title={t('showOriginal')}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                {isOriginalFileSrt() ? (
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
            <Editor translatedMarkdown={translatedMarkdown} onChange={onEdit} />
          </div>
        </div>
      </div>
      <SuggestionsPanel isSuggestionsLoading={isSuggestionsLoading} />
      <Dialog open={showDownloadModal} onOpenChange={setShowDownloadModal}>
        <DialogContent className="max-w-xs mx-4">
          <DialogHeader>
            <DialogTitle>Select Download Format</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            {[{ value: "pdf", label: "PDF Document", extension: "pdf", icon: <FileDown className='w-4 h-4' /> }, { value: "docx", label: "Word Document", extension: "docx", icon: <File className='w-4 h-4' /> }, { value: "txt", label: "Text File", extension: "txt", icon: <FileText className='w-4 h-4' /> }].map(format => (
              <Button
                key={format.value}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 justify-start"
                onClick={() => {
                  setShowDownloadModal(false);
                  setDownloadedFormat(format);
                }}
              >
                {format.icon}
                {format.label}
              </Button>
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => setShowDownloadModal(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TranslationResultView;
