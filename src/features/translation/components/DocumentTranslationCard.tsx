"use client";
import React, { ChangeEvent, useState, useEffect } from "react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/features/ui/components/ui/card";
import { Upload } from "lucide-react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useUserStore } from "@/features/auth/store/userStore";
import { AuthModal } from "@/features/auth";
import { PageWarningModal } from "@/shared/components/PageWarningModal";
import { useDocumentTranslationStore } from "@/features/translation/store/documentTranslationStore";
import TranslationResultView from "./TranslationResultView";
import DocumentUploadView from "./DocumentUploadView";
import TranslationSubmitButton from "./TranslationSubmitButton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import ErrorAlert from "@/shared/components/ErrorAlert";
import { documentTranslatingWithJobId } from "../utils/documentTranslation";
import { TranslationLoadingOverlay } from "@/features/ui/components/loading";
import LanguageSelect from "./LanguageSelect";
import { Button } from "@/features/ui/components/ui/button";
import { ArrowRightLeft } from "lucide-react";
import { countPages } from "@/features/translation/services/countPagesService";
import { useSuggestionsStore } from "../store/suggestionsStore";
import PageCountDisplay from "./PageCountDisplay";
import { useDocumentLoadingProgress } from "@/features/translation/hooks/useDocumentLoadingProgress";
import { useCountdown } from "@/hooks";

const isFileListAvailable =
  typeof window !== "undefined" && "FileList" in window;

const documentTranslationSchema = z.object({
  currentFile: z
    .any()
    .nullable()
    .refine((files) => {
      if (!files) return false;
      return (
        (isFileListAvailable &&
          files instanceof FileList &&
          files.length > 0) ||
        (files && typeof files === "object" && files.length > 0)
      );
    }, "Please select a file to translate.")
    .refine((files) => {
      if (!files || !files.length) return false;
      const file = files[0];
      return file && file.size <= 10 * 1024 * 1024; // 10MB limit
    }, "File size must be less than 10MB."),
  currentTargetLanguageId: z.number(),
  currentSourceLanguageId: z.number(),
  isSrt: z.boolean().optional(),
});

export type DocumentFormData = z.infer<typeof documentTranslationSchema>;


const DocumentTranslationCard = () => {
  const t = useTranslations("DocumentTranslationCard");
  const tButton = useTranslations("TranslationButton");
  const tCommon = useTranslations("CommonLanguageSelect");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showPageWarning, setShowPageWarning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFormData, setLastFormData] = useState<DocumentFormData | null>(null);
  const [/*loadingProgressState*/, /*setLoadingProgressState*/] = useState<number>(0);
  const [/*loadingMessageState*/, /*setLoadingMessageState*/] = useState<string>("");
  const { setSuggestionsLoading, suggestionsLoading } = useSuggestionsStore();
  const { token } = useAuthStore();
  const { userProfile, fetchUserProfile } = useUserStore();
  const {
    realPageCount,
    currentFile,
    setCurrentFile,
    translatedMarkdown,
    setTranslatedMarkdown,
    setTranslatedMarkdownWithoutZoomReset,
    currentTargetLanguageId,
    setCurrentTargetLanguageId,
    currentSourceLanguageId,
    setCurrentSourceLanguageId,
    estimatedPageCount,
    estimatedMinutes,
    estimatedCost,
    estimatedWordCount,
  } = useDocumentTranslationStore();
  const [isButtonHighlighted, setIsButtonHighlighted] = useState(false);

  const hasFile = currentFile && currentFile.length > 0;
  const currentFileObj = hasFile ? currentFile[0] : null;

  const { loadingProgress, loadingMessage, setOverrideMessage, setManualProgress, reset } =
    useDocumentLoadingProgress({
      isLoading,
      t,
      currentFile: currentFileObj,
      estimatedPageCount,
      estimatedMinutes,
      estimatedCost,
      estimatedWordCount,
    });

  // Calculate countdown duration: 4 minutes base + 25 seconds per additional page
  const countdownMinutes = estimatedPageCount > 0 ? 4 + Math.ceil((estimatedPageCount - 1) * 25 / 60) : 4;
  
  const { isComplete, start, stop } = useCountdown({
    initialMinutes: countdownMinutes,
    autoStart: false, // We'll start it manually
    onComplete: () => {
      // When countdown completes, show "taking longer" message
    }
  });

  // Start countdown when loading starts
  useEffect(() => {
    if (isLoading) {
      start();
    } else {
      stop();
    }
  }, [isLoading, start, stop]);

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    clearErrors,
  } = useForm<DocumentFormData>({
    resolver: zodResolver(documentTranslationSchema),
    defaultValues: {
      currentFile: null,
      currentTargetLanguageId: 1, 
      currentSourceLanguageId: 0,
      isSrt: false,
    },
  });

  useEffect(() => {
    if (realPageCount && realPageCount > 3) {
      setShowPageWarning(true);
    }
  }, [realPageCount]);

  useEffect(() => {
    setValue("currentTargetLanguageId", currentTargetLanguageId);
    setValue("currentSourceLanguageId", currentSourceLanguageId);
  }, [currentTargetLanguageId, currentSourceLanguageId, setValue]);

  const handleFileClick = () => {
    if (!token) {
      setShowAuthModal(true);
      return false;
    }
    return true;
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!token) {
      setShowAuthModal(true);
      event.target.value = "";
      return;
    }

    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      const isSrtFile = fileExtension === "srt";

      setCurrentFile(event.target.files);
      setValue("currentFile", event.target.files);
      setValue("isSrt", isSrtFile);
      clearErrors("currentFile");

      // Highlight the translate button after file upload
      setIsButtonHighlighted(true);
      setTimeout(() => {
        setIsButtonHighlighted(false);
      }, 3000); // Remove highlight after 3 seconds

      // Get exact page count for DOCX files
      if (fileExtension === "docx") {
        const { setRealPageCount, setIsCountingPages } = useDocumentTranslationStore.getState();
        
        // Set loading state while counting pages
        setIsCountingPages(true);
        setRealPageCount(null); // Reset previous count
        
        try {
          const pageCountResult = await countPages(file);
          const pageCount = pageCountResult.pageCount || pageCountResult.pages || null;
          setRealPageCount(pageCount);
          
          // Show warning if page count is more than 3

        } catch (error) {
          console.error("Failed to count DOCX pages:", error);
          // Fallback to null so estimation is used
          setRealPageCount(null);
        } finally {
          // Always clear loading state
          setIsCountingPages(false);
        }
      } else if (fileExtension !== "pdf") {
        // Reset page count for non-PDF, non-DOCX files (PDF count is handled by DocumentPreview)
        const { setRealPageCount, setIsCountingPages } = useDocumentTranslationStore.getState();
        setRealPageCount(null);
        setIsCountingPages(false);
      }
    }
  };

  const handleRemoveFile = () => {
    setCurrentFile(null);
    setTranslatedMarkdown("");
    setValue("currentFile", null);
    setValue("isSrt", false);
    clearErrors("currentFile");
    
    const { setRealPageCount, setIsCountingPages } = useDocumentTranslationStore.getState();
    setRealPageCount(null);
    setIsCountingPages(false);
    
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const onSubmit = async (data: DocumentFormData) => {
    if (!token) {
      setShowAuthModal(true);
      return;
    }

    if (!data.currentFile || data.currentFile.length === 0) {
      return;
    }

    // Store form data for retry
    setLastFormData(data);

    // Check if user is logged in (has user profile)
    // If not, refresh session and retry
    let currentUserProfile = userProfile;
    if (!currentUserProfile) {
      try {
        await fetchUserProfile();
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
    const pagesNeeded = Math.ceil(estimatedPageCount || 0);
    const userPages = Math.floor(currentUserProfile?.balance || 0);
    
    if (pagesNeeded > userPages) {
      setError(t('pageCount.insufficientPages', { needed: pagesNeeded, available: userPages }));
      return;
    }

    setIsLoading(true);
    setManualProgress(0, t("progress.starting"));

    try {
      await documentTranslatingWithJobId(
        data,
        setError,
        (_progress, message) => {
          if (
            message.toLowerCase().includes("error") ||
            message.toLowerCase().includes("failed")
          ) {
            setOverrideMessage(message);
          }
        },
        setSuggestionsLoading
      );

      setManualProgress(100, t("progress.complete"));
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (err) {
      let message = t("progress.unexpectedError");
      if (err instanceof Error) {
        message = err.message || message;
      }
      setError(message);
    } finally {
      setIsLoading(false);
      reset();
    }
  };

  const handleFormError = () => {
    if (!token) {
      setShowAuthModal(true);
    }
  };

  const getFormError = (): string | null => {
    if (errors.currentFile?.message) {
      return typeof errors.currentFile.message === "string"
        ? errors.currentFile.message
        : "Please select a file to translate.";
    }
    if (errors.currentTargetLanguageId?.message) {
      return typeof errors.currentTargetLanguageId.message === "string"
        ? errors.currentTargetLanguageId.message
        : "Please select a target language.";
    }
    if (errors.currentSourceLanguageId?.message) {
      return typeof errors.currentSourceLanguageId.message === "string"
        ? errors.currentSourceLanguageId.message
        : "Please select a source language.";
    }
    return null;
  };


  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setShowAuthModal(true);
      return;
    }

    handleSubmit(onSubmit, handleFormError)();
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
                await fetchUserProfile();
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
      <div className={translatedMarkdown ? "flex gap-8" : undefined}>
        <Card className="border-none flex-1 min-w-0 relative">
          <TranslationLoadingOverlay
            isVisible={isLoading}
            type="document"
            message={loadingMessage || tButton("loading")}
            progress={loadingProgress}
            showTakingLonger={isComplete}
          />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Upload className="h-5 w-5" />
              {t("title")}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {t("description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit}>
              {/* Unified select row: source, swap, target, model */}
              <div className="flex flex-row gap-2 md:gap-4 mb-4 items-end">
                {/* Source language */}
                <div className="flex-1 flex flex-col">
                  <span className="block text-xs text-muted-foreground mb-1">{t("sourceLanguage")}</span>
                  <LanguageSelect
                    value={currentSourceLanguageId}
                    onChange={setCurrentSourceLanguageId}
                    detectOption={tCommon("automaticDetection")}
                  />
                </div>
                {/* Swap button */}
                <div className="flex flex-col justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 border-2 hover:border-suliko-default-color hover:text-suliko-default-color transition-colors"
                    disabled={currentSourceLanguageId === 0}
                    onClick={() => {
                      if (currentSourceLanguageId !== 0) {
                        const tempSource = currentSourceLanguageId;
                        const tempTarget = currentTargetLanguageId;
                        setCurrentSourceLanguageId(tempTarget);
                        setCurrentTargetLanguageId(tempSource);
                      }
                    }}
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                  </Button>
                </div>
                {/* Target language */}
                <div className="flex-1 flex flex-col">
                  <span className="block text-xs text-muted-foreground mb-1">{t("targetLanguage")}</span>
                  <LanguageSelect
                    value={currentTargetLanguageId}
                    onChange={setCurrentTargetLanguageId}
                  />
                </div>
              </div>
              {translatedMarkdown ? (
                <>
                  <TranslationResultView
                    currentFile={currentFileObj!}
                    translatedMarkdown={translatedMarkdown}
                    onFileChange={handleFileChange}
                    onRemoveFile={handleRemoveFile}
                    onEdit={setTranslatedMarkdownWithoutZoomReset}
                    isSuggestionsLoading={suggestionsLoading}
                  />
                </>
              ) : (
                <div className="flex gap-2 md:gap-4 items-end flex-col md:flex-row">
                  <div className="w-full md:flex-1 min-w-0">
                    <DocumentUploadView
                      currentFile={currentFileObj}
                      onFileChange={handleFileChange}
                      onFileClick={handleFileClick}
                      onRemoveFile={handleRemoveFile}
                    />
                    {currentFileObj && (
                      <PageCountDisplay file={currentFileObj} />
                    )}
                  </div>
                </div>
              )}

              <TranslationSubmitButton
                isLoading={isLoading}
                hasResult={!!translatedMarkdown}
                disabled={isLoading || (!token ? false : !hasFile)}
                showShiftEnter={true}
                formError={token ? getFormError() : null}
                isHighlighted={isButtonHighlighted}
              />
            </form>
          </CardContent>
        </Card>
      </div>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      <PageWarningModal
        isOpen={showPageWarning}
        onClose={() => setShowPageWarning(false)}
        pageCount={estimatedPageCount}
      />
    </>
  );
};

export default DocumentTranslationCard;
