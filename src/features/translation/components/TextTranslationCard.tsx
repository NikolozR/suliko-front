"use client";
import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/features/ui/components/ui/card";
import { Type } from "lucide-react";
import { Textarea } from "@/features/ui/components/ui/textarea";
import LanguageSelectionPanel from "./LanguageSelectionPanel";
import TranslationSubmitButton from "./TranslationSubmitButton";
import CopyButton from "./CopyButton";
import { useAuthStore } from "@/features/auth/store/authStore";
import { AuthModal } from "@/features/auth";
import { TranslationLoadingOverlay } from "@/features/ui/components/loading";
import {
  TextTranslateUserContentParams,
  TextTranslateUserContentResponse,
} from "@/features/translation/types/types.Translation";
import { useTextTranslationStore } from "@/features/translation/store/textTranslationStore";
import { translateUserContent } from "@/features/translation/services/translationService";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { generateLocalizedFilename, useTranslatedSuffix } from "@/shared/utils/filenameUtils";
import { formatBalance } from "@/shared/utils/domainUtils";
import { Button } from "@/features/ui/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/features/ui/components/ui/dialog";
import { FileText, File, Download, X, FileDown } from "lucide-react";
import React from "react";
import { useUserStore } from "@/features/auth/store/userStore";
import ErrorAlert from "@/shared/components/ErrorAlert";

const textTranslationSchema = z.object({
  currentTextValue: z
    .string()
    .min(1, "გთხოვთ, შეიყვანოთ ტექსტი თარგმნისთვის.")
    .trim(),
  currentTargetLanguageId: z
    .number()
    .min(0, "გთხოვთ, აირჩიეთ სამიზნე ენა"),
  currentSourceLanguageId: z
    .number()
    .min(0, "გთხოვთ, აირჩიეთ წყარო ენა"),
});

type FormData = z.infer<typeof textTranslationSchema>;
type DownloadFormatOption = { value: string; label: string; extension: string; icon: React.ReactNode };

const TextTranslationCard = () => {
  const t = useTranslations('TextTranslationCard');
  const tButton = useTranslations('TranslationButton');
  const translatedSuffix = useTranslatedSuffix();
  const [textLoading, setTextLoading] = useState(false);

  // Helper function to count words
  const countWords = (text: string): number => {
    if (!text.trim()) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFormData, setLastFormData] = useState<FormData | null>(null);
  const { fetchUserProfileWithRetry, userProfile } = useUserStore();

  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadedFormat, setDownloadedFormat] = useState<DownloadFormatOption | null>(null);
  const { token } = useAuthStore();
  const {
    setCurrentTextValue,
    setOriginalText,
    setTranslatedText,
    originalText,
    translatedText,
    currentTextValue,
    currentTargetLanguageId,
    originalTargetLanguageId,
    currentSourceLanguageId,
    sourceLanguageId,
    setCurrentSourceLanguageId,
    setCurrentTargetLanguageId,
    setOriginalTargetLanguageId,
    setSourceLanguageId,
  } = useTextTranslationStore();

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    clearErrors,
  } = useForm<FormData>({
    resolver: zodResolver(textTranslationSchema),
    defaultValues: {
      currentTextValue: '',
      currentTargetLanguageId: 1,  // Set this explicitly to 1
      currentSourceLanguageId: 0,
    },
  });

  useEffect(() => {
    setValue("currentTextValue", currentTextValue);
    setValue("currentTargetLanguageId", currentTargetLanguageId);
    setValue("currentSourceLanguageId", currentSourceLanguageId);
  }, [currentTextValue, currentTargetLanguageId, currentSourceLanguageId, setValue]);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const translatedRef = useRef<HTMLTextAreaElement | null>(null);
  const isScrolling = useRef(false);

  useEffect(() => {
    const textarea = textareaRef.current;
    const translated = translatedRef.current;
    if (!textarea || !translated || !translatedText) return;

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

    const handleTextareaScroll = (e: Event) =>
      syncScroll(textarea, translated, e);
    const handleTranslatedScroll = (e: Event) =>
      syncScroll(translated, textarea, e);

    textarea.addEventListener("scroll", handleTextareaScroll);
    translated.addEventListener("scroll", handleTranslatedScroll);

    return () => {
      textarea.removeEventListener("scroll", handleTextareaScroll);
      translated.removeEventListener("scroll", handleTranslatedScroll);
    };
  }, [translatedText]);

  useEffect(() => {
    if (!downloadedFormat) return;
    const triggerDownload = async () => {
      const fileType = downloadedFormat.value;
      const fileName = generateLocalizedFilename("text", fileType, translatedSuffix);
      if (["txt", "md", "srt"].includes(fileType)) {
        const text = translatedText.replace(/<[^>]+>/g, "");
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
        const fullHtml = `<!DOCTYPE html><html><head><meta charset=\"utf-8\"></head><body>${translatedText}</body></html>`;
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
        wrapper.innerHTML = translatedText;

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
  }, [downloadedFormat, translatedText, translatedSuffix]);

  const onSubmit = async (data: FormData) => {
    if (!token) {
      setShowAuthModal(true);
      return;
    }

    // Store form data for retry
    setLastFormData(data);

    // Check if user is logged in (has user profile)
    // If not, refresh session and retry
    let currentUserProfile = userProfile;
    if (!currentUserProfile) {
      try {
        await fetchUserProfileWithRetry(3, 1000);
        // Get updated profile after refresh
        currentUserProfile = useUserStore.getState().userProfile;
        if (!currentUserProfile) {
          setError("Failed to load user profile. Please try again.");
          return;
        }
      } catch (error) {
        console.error("Failed to refresh session:", error);
        setError("Failed to load user profile. Please try again.");
        return;
      }
    }

    // Check if user has sufficient page balance
    // 2500 characters = 1 page, so 250 characters = 0.1 page
    const pagesNeeded = data.currentTextValue.length / 2500;
    const userPages = currentUserProfile?.balance || 0;

    if (pagesNeeded > userPages) {
      setError(t('insufficientPages', { 
        needed: formatBalance(pagesNeeded), 
        available: formatBalance(userPages) 
      }));
      return;
    }

    setTextLoading(true);
    try {
      const params: TextTranslateUserContentParams = {
        UserText: data.currentTextValue,
        LanguageId: data.currentTargetLanguageId,
        SourceLanguageId: data.currentSourceLanguageId === 0 ? 2 : data.currentSourceLanguageId,
      };
      setOriginalText(data.currentTextValue);
      setOriginalTargetLanguageId(data.currentTargetLanguageId);
      setSourceLanguageId(data.currentSourceLanguageId);
      const result: TextTranslateUserContentResponse =
        await translateUserContent(params);
      setTranslatedText(result.text);
      // Use retry mechanism to ensure balance is properly updated
      await fetchUserProfileWithRetry(3, 1000);
    } catch (err) {
      let message = "An unexpected error occurred during translation.";
      if (err instanceof Error) {
        message = err.message || message;
      }
      setError(message);
      console.error("Translation failed:", err);
    } finally {
      setTextLoading(false);
    }
  };

  const handleFormError = () => {
    if (!token) {
      setShowAuthModal(true);
    }
  };

  const getFormError = () => {
    if (errors.currentTextValue) return errors.currentTextValue.message;
    if (errors.currentTargetLanguageId) return errors.currentTargetLanguageId.message;
    if (errors.currentSourceLanguageId) return errors.currentSourceLanguageId.message;
    return null;
  };

  return (
    <>
      {error && (
        <ErrorAlert
          message={error}
          onClose={() => setError(null)}
          onRetry={lastFormData ? () => {
            setError(null);
            // Retry with refresh session first
            const retry = async () => {
              try {
                // Refresh session first
                await fetchUserProfileWithRetry(3, 1000);
                // Retry submission with last form data
                await onSubmit(lastFormData);
              } catch (error) {
                console.error("Retry failed:", error);
                setError("Failed to retry. Please try again.");
              }
            };
            retry();
          } : undefined}
          retryLabel={tButton('retry') || "Retry"}
        />
      )}
      <div className={translatedText ? "flex flex-col md:flex-row gap-4 md:gap-8" : undefined}>
        <Card className="border-none flex-1 min-w-0 relative">
          <TranslationLoadingOverlay
            isVisible={textLoading}
            type="text"
            message={tButton('loading')}
          />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Type className="h-5 w-5" />
              {t('title')}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {t('description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit, handleFormError)}>
              <LanguageSelectionPanel
                sourceLanguageId={currentSourceLanguageId}
                targetLanguageId={currentTargetLanguageId}
                onSourceLanguageChange={(value) => {
                  setCurrentSourceLanguageId(value);
                  setValue("currentSourceLanguageId", value);
                  clearErrors("currentSourceLanguageId");
                }}
                onTargetLanguageChange={(value) => {
                  setCurrentTargetLanguageId(value);
                  setValue("currentTargetLanguageId", value);
                  clearErrors("currentTargetLanguageId");
                }}
                layout="horizontal"
                showSwapButton={true}
              />
              <div className={translatedText ? "flex flex-col md:flex-row gap-4 md:gap-8 items-stretch md:items-end" : undefined}>
                <div className="w-full flex-1 min-w-0">
                  <div className="font-semibold mb-2 text-suliko-default-color text-sm md:text-base">
                    {t('yourText')}
                  </div>
                  <div className="h-[300px] max-h-[300px] flex flex-col overflow-y-auto w-full">
                    <Textarea
                      ref={textareaRef}
                      className="w-full flex-1 border-2 focus:border-suliko-default-color focus:ring-suliko-default-color overflow-y-auto text-sm"
                      placeholder={t('textIputPlaceholder')}
                      value={currentTextValue}
                      onChange={(e) => {
                        setCurrentTextValue(e.target.value);
                        setValue("currentTextValue", e.target.value);
                        clearErrors("currentTextValue");
                      }}
                      onKeyDown={(e) => {
                        if (e.shiftKey && e.key === "Enter") {
                          e.preventDefault();
                          handleSubmit(onSubmit, handleFormError)();
                        }
                      }}
                    />
                  </div>
                  {/* Character and word count display */}
                  {currentTextValue && (
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        {currentTextValue.length} {currentTextValue.length === 1 ? 'character' : 'characters'}
                      </span>
                      <span>
                        {countWords(currentTextValue)} {countWords(currentTextValue) === 1 ? 'word' : 'words'}
                      </span>
                    </div>
                  )}
                  {/* Cost display for input text */}
                  {currentTextValue && currentTextValue.length > 0 && (
                    <div className="mt-2 text-suliko-default-color font-semibold text-sm">
                      Pages to be used: {(currentTextValue.length / 2500).toFixed(2)}
                    </div>
                  )}
                </div>
                {translatedText && (
                  <div className="w-full flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                      <div className="font-semibold text-suliko-default-color text-sm md:text-base">
                        {t('result')}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
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
                          content={translatedText}
                          size="sm"
                          variant="outline"
                        />
                      </div>
                    </div>
                    <Textarea
                      ref={translatedRef}
                      className="w-full flex-1 h-[300px] max-h-[300px] border-2 focus:border-suliko-default-color focus:ring-suliko-default-color overflow-y-auto text-sm md:text-base bg-slate-50 dark:bg-input/30 border-slate-200 dark:border-slate-700"
                      value={translatedText}
                      onChange={(e) => {
                        setTranslatedText(e.target.value);
                      }}
                      placeholder={t('result')}
                    />
                    {/* Character and word count display for translated text */}
                    {translatedText && (
                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {translatedText.length} {translatedText.length === 1 ? 'character' : 'characters'}
                        </span>
                        <span>
                          {countWords(translatedText)} {countWords(translatedText) === 1 ? 'word' : 'words'}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <TranslationSubmitButton
                isLoading={textLoading}
                hasResult={!!translatedText}
                disabled={
                  textLoading ||
                  (!!originalText &&
                    currentTextValue.trim() === originalText.trim() &&
                    currentTargetLanguageId === originalTargetLanguageId &&
                    currentSourceLanguageId === sourceLanguageId)
                }
                formError={getFormError()}
                onClick={(e) => {
                  if (!token) {
                    e.preventDefault();
                    setShowAuthModal(true);
                  }
                }}
              />
            </form>
          </CardContent>
        </Card>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
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
      </div>
    </>
  );
};

export default TextTranslationCard;
