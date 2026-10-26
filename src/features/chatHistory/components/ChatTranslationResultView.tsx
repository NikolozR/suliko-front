"use client";
import { ChangeEvent, useRef, useEffect, useState, type RefObject } from "react";
import { useTranslations } from "next-intl";
import { generateLocalizedFilename, useTranslatedSuffix } from "@/shared/utils/filenameUtils";
import DocumentPreview from "@/features/translation/components/DocumentPreview";
import FileInfoDisplay from "@/features/translation/components/FileInfoDisplay";
import CopyButton from "@/features/translation/components/CopyButton";
import DownloadButton from "@/features/translation/components/DownloadButton";
import ChatSuggestionsPanel from './ChatSuggestionsPanel';
import SuggestionsJumpButton from "@/features/translation/components/SuggestionsJumpButton";
import TranslationEditor, { type TranslationEditorHandle } from "@/features/editor/TranslationEditor";
import { useChatSuggestionsStore } from "../store/chatSuggestionsStore";
import { Button } from "@/features/ui/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/features/ui/components/ui/dialog";
import { FileText, File, Download, X, Eye, EyeOff,  FileDown } from "lucide-react";
import React from "react";
import { getChatDocument, saveChatDocument, updateChatDocumentContent } from "../services/chatService";
import SaveButton from "@/features/translation/components/SaveButton";
import toast from "react-hot-toast";
import { SendToOrder, type OrderExportFormat } from "@/features/orders/components/SendToOrder";
import { translationAsHtml, wordBlob } from "@/features/translation/utils/wordPage";
import { originalPageSetup } from "@/features/translation/utils/originalPage";

/**
 * The translation as HTML, as it stands now. The editor's own HTML where it is
 * up: the same content the user sees and what copy-paste into Word uses, so the
 * formatting is right. Otherwise what was loaded, converted if it is Markdown.
 */
function translationHtml(editor: TranslationEditorHandle | null, loaded: string): string {
  const editorHtml = editor?.getHTML();
  if (editorHtml && editorHtml !== "<p></p>") return editorHtml;
  return translationAsHtml(loaded);
}

interface ChatTranslationResultViewProps {
  chatId: string;
  currentFile: File | null;
  translatedMarkdown: string;
  onFileChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile?: () => void;
  onEdit: (content: string) => void;
  isSuggestionsLoading: boolean;
  /** The Word editor has saved a Word file for this translation that is still current: it opens from that. */
  hasSavedDocument?: boolean;
}

const ChatTranslationResultView: React.FC<ChatTranslationResultViewProps> = ({
  chatId,
  currentFile,
  translatedMarkdown,
  onFileChange,
  onRemoveFile,
  onEdit,
  isSuggestionsLoading,
  hasSavedDocument = false,
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
  const [remainingSeconds, setRemainingSeconds] = useState<number>(600);
  const { hoveredSuggestionOriginalText, suggestions } = useChatSuggestionsStore();
  const suggestionsPanelRef = useRef<HTMLDivElement>(null);

  const isOriginalFileSrt = () => {
    const fileExtension = currentFile?.name.split('.').pop()?.toLowerCase();
    return fileExtension === 'srt';
  };

  useEffect(() => {
    const documentContainer =
      documentPreviewRef.current?.querySelector(".overflow-y-auto");
    const markdownContainer =
      wordScroller ?? markdownPreviewRef.current?.querySelector(".overflow-y-auto");

    if (!documentContainer || !markdownContainer || !translatedMarkdown) return;

    const syncScroll = (source: Element, target: Element, event: Event) => {
      if (isScrolling.current) return;
      event.preventDefault();

      isScrolling.current = true;
      requestAnimationFrame(() => {
        const sourceEl = source as HTMLElement;
        const targetEl = target as HTMLElement;
        const sourceScrollPercent =
          sourceEl.scrollTop / (sourceEl.scrollHeight - sourceEl.clientHeight);
        const targetScrollMax = targetEl.scrollHeight - targetEl.clientHeight;
        targetEl.scrollTop = sourceScrollPercent * targetScrollMax;
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
  }, [translatedMarkdown, wordScroller]);


  /**
   * Saved to the translation's chat. The Word editor's document goes as the Word file with the
   * HTML written beside it, so it opens again as it was left; the simple editor's as HTML.
   */
  const saveToChat = async (): Promise<void> => {
    const word = editorRef.current?.toDocx();
    if (word) {
      await saveChatDocument(chatId, translationHtml(editorRef.current, translatedMarkdown), await word);
      return;
    }
    await updateChatDocumentContent(chatId, translatedMarkdown);
  };

  const saveToChatRef = useRef(saveToChat);
  saveToChatRef.current = saveToChat;

  /**
   * The PDF. From the Word file, by the server, where the Word editor is in use: laid out as Word
   * lays it out, not a picture of a web page. From the HTML here when there is no Word file, or
   * when the server cannot (a licence it does not have, a busy minute).
   */
  const pdfBlob = async (name: string): Promise<Blob> => {
    const made = editorRef.current?.toPdf();
    if (made) {
      try {
        return await made;
      } catch (error) {
        console.warn("The server could not make the PDF; making it here.", error);
      }
    }
    const { generatePdfBlobFromHtml } = await import("@/features/translation/utils/html2pdf-client");
    return generatePdfBlobFromHtml(translationHtml(editorRef.current, translatedMarkdown), name);
  };

  useEffect(() => {
    if (remainingSeconds <= 0) return;

    const autosaveInterval = setInterval(async () => {
      try {
        await saveToChatRef.current();
        toast.success("Autosaved.", { id: "autosave", duration: 1500 });
      } catch {
        toast.error("Autosave failed.", { id: "autosave" });
      }
    }, 10000);

    return () => clearInterval(autosaveInterval);
  }, [chatId, translatedMarkdown, remainingSeconds]);


  useEffect(() => {
    if (editorDeadline === null) {
      setEditorDeadline(Date.now() + 10 * 60 * 1000);
    }
  }, [editorDeadline]);

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

  // const formatTime = (totalSeconds: number) => {
  //   const minutes = Math.floor(totalSeconds / 60);
  //   const seconds = totalSeconds % 60;
  //   const mm = String(minutes).padStart(2, "0");
  //   const ss = String(seconds).padStart(2, "0");
  //   return `${mm}:${ss}`;
  // };

  /** The translation as one file, for the bureau's order it was made for. */
  const buildForOrder = async (format: OrderExportFormat, sourceName: string): Promise<globalThis.File> => {
    // `File` in this module is the icon of that name.
    const DomFile = globalThis.File;
    const name = generateLocalizedFilename(sourceName, format, translatedSuffix);
    if (format === "srt") return new DomFile([translatedMarkdown], name, { type: "text/srt" });
    const html = translationHtml(editorRef.current, translatedMarkdown);
    if (format === "docx") {
      // The Word editor writes the Word file itself; the simple editor's HTML is put in one.
      const blob = (await editorRef.current?.toDocx()) ?? (await wordBlob(html, await originalPageSetup(currentFile)));
      return new DomFile([blob], name, {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
    }
    return new DomFile([await pdfBlob(name)], name, { type: "application/pdf" });
  };

  useEffect(() => {
    if (!downloadedFormat) return;
    const triggerDownload = async () => {
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
        const blob =
          (await editorRef.current?.toDocx()) ??
          (await wordBlob(translationHtml(editorRef.current, translatedMarkdown), await originalPageSetup(currentFile)));
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
          const made = editorRef.current?.toPdf();
          let sent = false;
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
            const htmlContent = translationHtml(editorRef.current, translatedMarkdown);
            const { generatePdfFromHtml } = await import("@/features/translation/utils/html2pdf-client");
            await generatePdfFromHtml(htmlContent, fileName);
          }
        } catch (err) {
          console.error("PDF export failed:", err);
          alert("Failed to generate PDF");
        }
      }

      setDownloadedFormat(null);
    };
    triggerDownload();
  }, [downloadedFormat, translatedMarkdown, currentFile, translatedSuffix]);


  const handleSaveDocument = async (): Promise<void> => {
    try {
      await saveToChat();
      toast.success("Changes saved successfully.");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to save changes. Please try again.";

      toast.error(message);

      throw error; // IMPORTANT → so SaveButton knows it failed
    }
  };


  return (
    <>
      <SendToOrder chatId={chatId} build={buildForOrder} />
      <div className={hideOriginalDocument ? "relative" : "relative md:flex gap-4 lg:gap-6 xl:gap-8"}>
        {!hideOriginalDocument && (
          <div className="w-full mb-6 md:mb-0 md:flex-[0.95] min-w-0">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/40">
              <div className="font-semibold text-foreground text-sm md:text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                {t('originalDocument')}
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
              className="min-h-[300px] h-[50vh] md:h-[calc(100vh-240px)] md:max-h-[calc(100vh-240px)] flex flex-col w-full"
              ref={documentPreviewRef}
            >
              <div className="space-y-4 h-full flex flex-col">
                <div className="flex-1 min-h-0">
                  <DocumentPreview file={currentFile} />
                </div>
                {currentFile && (
                  <FileInfoDisplay
                    file={currentFile}
                    onFileChange={onFileChange as (event: ChangeEvent<HTMLInputElement>) => void}
                    onRemoveFile={onRemoveFile as () => void}
                    id="file-upload-change-split"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        <SuggestionsJumpButton
          count={suggestions.length}
          targetRef={suggestionsPanelRef}
          sideBySideAt={hideOriginalDocument ? null : "md"}
        />

        <div className={hideOriginalDocument ? "w-full" : "w-full md:flex-[1.05] min-w-0"}>
          <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-border/40 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="font-semibold text-foreground text-sm md:text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                {t('translatedText')}
              </div>
              {/* {remainingSeconds > 0 ? (
                <span className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded-full ${remainingSeconds <= 120
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 font-medium animate-pulse"
                  : "text-muted-foreground"
                  }`}>
                  <Clock className="h-3 w-3" />
                  {formatTime(remainingSeconds)}
                </span>
              ) : (
                <span className="text-xs flex items-center gap-1 font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400">
                  <AlertTriangle className="h-3 w-3" />
                  {t('editorTimeExpired')}
                </span>
              )} */}
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
            <div className="flex items-center gap-1 flex-wrap">
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
                    variant="default"
                    size="sm"
                    onClick={() => setShowDownloadModal(true)}
                    className="suliko-default-bg text-white transition-all duration-200 hover:opacity-90"
                    title={tButton('download')}
                    aria-label={tButton('download')}
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:ml-1.5 sm:inline">{tButton('download')}</span>
                  </Button>
                  <CopyButton
                    content={translatedMarkdown}
                    size="sm"
                    variant="outline"
                    label={tButton('copy')}
                    copiedLabel={tButton('copied')}
                  />
                  <SaveButton
                    disabled={remainingSeconds <= 0}
                    onSave={handleSaveDocument}
                    label={tButton('save')}
                    savedLabel={tButton('saved')}
                    savingLabel={tButton('saving')}
                  />

                </>
              )}
            </div>
          </div>
          <div className="min-h-[300px] h-[50vh] md:h-[calc(100vh-240px)] md:max-h-[calc(100vh-240px)] overflow-y-auto" ref={markdownPreviewRef}>
            <TranslationEditor
              ref={editorRef}
              translatedMarkdown={translatedMarkdown}
              onChange={onEdit}
              hoveredText={hoveredSuggestionOriginalText}
              file={currentFile}
              forceSimple={isOriginalFileSrt()}
              onScroller={setWordScroller}
              openDocument={hasSavedDocument ? () => getChatDocument(chatId) : undefined}
              className="h-full"
            />
          </div>
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-border/40" ref={suggestionsPanelRef}>
        <ChatSuggestionsPanel isSuggestionsLoading={isSuggestionsLoading} />
      </div>
      <Dialog open={showDownloadModal} onOpenChange={setShowDownloadModal}>
        <DialogContent className="max-w-xs rounded-2xl">
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
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatTranslationResultView;


