"use client";
import { ChangeEvent, useRef, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import DocumentPreview from "./DocumentPreview";
import FileInfoDisplay from "./FileInfoDisplay";
import CopyButton from "./CopyButton";
import DownloadButton from "./DownloadButton";
import SuggestionsPanel from './SuggestionsPanel';
import Editor from "@/features/editor/Editor";
import { Button } from "@/features/ui/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/features/ui/components/ui/dialog";
import { FileText, File, Download, X, Eye, EyeOff, Clock } from "lucide-react";
import React from "react";


interface TranslationResultViewProps {
  currentFile: File;
  translatedMarkdown: string;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
  onEdit: (content: string) => void;
  isSuggestionsLoading: boolean;
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
      const fileName = `translated_document.${fileType}`;
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
      } else if (fileType === "pdf") {
        // Convert HTML to docx blob
        const fullHtml = `<!DOCTYPE html><html><head><meta charset=\"utf-8\"></head><body>${translatedMarkdown}</body></html>`;
        // @ts-expect-error Type errors, nothing special
        const htmlDocx = (await import("html-docx-js/dist/html-docx")).default;
        const docxBlob = htmlDocx.asBlob(fullHtml);
        const docxFile = new (window.File || File)([docxBlob], "temp.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
        const { wordToPdf } = await import("@/features/translation/services/conversionsService");
        const pdfBlob = await wordToPdf(docxFile);
        const url = URL.createObjectURL(pdfBlob);
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
      }
      setDownloadedFormat(null);
    };
    triggerDownload();
  }, [downloadedFormat, translatedMarkdown]);

  return (
    <>
      <div className={hideOriginalDocument ? "" : "lg:flex gap-8"}>
        {!hideOriginalDocument && (
          <div className="w-full mb-10 lg:mb-0 md:flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-suliko-default-color text-sm md:text-base">
                ორიგინალი დოკუმენტი
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setHideOriginalDocument(true)}
                className="transition-all duration-200"
                title={t('hideOriginal')}
              >
                <EyeOff className="h-4 w-4" />
              </Button>
            </div>
            <div
              className="h-[800px] max-h-[800px] flex flex-col w-full"
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

        <div className={hideOriginalDocument ? "w-full" : "w-full md:flex-1 min-w-0"}>
          <div className="flex items-center justify-between mb-2 relative">
            <div className="flex items-center gap-2">
              <div className="font-semibold text-suliko-default-color text-sm md:text-base">
                თარგმნილი ტექსტი
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(remainingSeconds)}
              </span>
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
            </div>
            <div className="flex items-center gap-2 absolute right-0 bottom-[-4px]">
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
                  >
                    <Download className="h-4 w-4 mr-1" />
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
          <div className="h-full max-h-[800px] overflow-y-auto" ref={markdownPreviewRef}>
            <Editor translatedMarkdown={translatedMarkdown} onChange={onEdit} />
          </div>
        </div>
      </div>
      <SuggestionsPanel isSuggestionsLoading={isSuggestionsLoading} />
      <Dialog open={showDownloadModal} onOpenChange={setShowDownloadModal}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Select Download Format</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            {[{ value: "pdf", label: "PDF Document", extension: "pdf", icon: <FileText className='w-4 h-4' /> }, { value: "docx", label: "Word Document", extension: "docx", icon: <File className='w-4 h-4' /> }, { value: "txt", label: "Text File", extension: "txt", icon: <FileText className='w-4 h-4' /> }].map(format => (
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
