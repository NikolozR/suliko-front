"use client";
import { ChangeEvent, useRef, useEffect } from "react";
import DocumentPreview from "./DocumentPreview";
import MarkdownPreview from "./MarkdownPreview";
import FileInfoDisplay from "./FileInfoDisplay";
import CopyButton from "./CopyButton";
import SuggestionsPanel from './SuggestionsPanel';

interface TranslationResultViewProps {
  currentFile: File;
  translatedMarkdown: string;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
}

const TranslationResultView: React.FC<TranslationResultViewProps> = ({
  currentFile,
  translatedMarkdown,
  onFileChange,
  onRemoveFile,
}) => {
  const documentPreviewRef = useRef<HTMLDivElement>(null);
  const markdownPreviewRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

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

  return (
    <div className="flex gap-8">
      <div className="w-full md:flex-1 min-w-0">
        <div className="font-semibold mb-2 text-suliko-default-color text-sm md:text-base">
          ორიგინალი დოკუმენტი
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

      <div className="w-full md:flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2 relative">
          <div className="font-semibold text-suliko-default-color text-sm md:text-base">
            თარგმნილი ტექსტი
          </div>
          <CopyButton
            content={translatedMarkdown}
            size="sm"
            variant="outline"
            className="absolute right-0 bottom-[-4px]"
          />
        </div>
        <div className="h-[800px] max-h-[800px]" ref={markdownPreviewRef}>
          <MarkdownPreview content={translatedMarkdown} className="h-full" />
        </div>
      </div>

      <SuggestionsPanel />
    </div>
  );
};

export default TranslationResultView;
