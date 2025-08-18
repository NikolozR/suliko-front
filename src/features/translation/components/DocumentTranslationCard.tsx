"use client";
import { ChangeEvent, useState, useEffect } from "react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/features/ui/components/ui/card";
import { Upload } from "lucide-react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { AuthModal } from "@/features/auth";
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


const createAnchorPoints = (totalDurationMs: number) => {
  // Use all available progress messages (excluding ones handled elsewhere)
  const messageOrder = [
    "starting",
    "documentType",
    "documentInfo",
    "wordCount",
    "estimatedTime",
    "estimatedCost",
    "preparing",
    "analyzing",
    "translating",
    "firstPageDone",
    "checkingMistakes",
    "stillChecking",
    "enhancing",
    "finalizing",
    "waiting",
    "thankYou",
  ];

  const minProgress = 5; // start above 0 so the bar is visible early
  const maxProgress = 97; // leave a bit of headroom for server completion
  const steps = messageOrder.length;

  return messageOrder.map((key, index) => {
    const ratio = (index + 1) / steps;
    const progress = Math.round(minProgress + (maxProgress - minProgress) * ratio);
    const time = totalDurationMs * ratio;
    return {
      progress,
      time,
      messageKey: `progress.${key}`,
    };
  });
};


// const modelOptions = [
//   { value: 0, label: "კლაუდია" },
//   { value: 1, label: "კლაუდია junior" },
//   { value: 2, label: "გურამი" },
// ];

const DocumentTranslationCard = () => {
  const t = useTranslations("DocumentTranslationCard");
  const tButton = useTranslations("TranslationButton");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const { setSuggestionsLoading, suggestionsLoading } = useSuggestionsStore();
  const { token } = useAuthStore();
  const {
    currentFile,
    setCurrentFile,
    translatedMarkdown,
    setTranslatedMarkdown,
    setTranslatedMarkdownWithoutZoomReset,
    currentTargetLanguageId,
    setCurrentTargetLanguageId,
    currentSourceLanguageId,
    setCurrentSourceLanguageId,
    realPageCount,
    estimatedPageCount,
    estimatedMinutes,
    estimatedCost,
    estimatedWordCount,
  } = useDocumentTranslationStore();
  const [isButtonHighlighted, setIsButtonHighlighted] = useState(false);

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
    setValue("currentTargetLanguageId", currentTargetLanguageId);
    setValue("currentSourceLanguageId", currentSourceLanguageId);
  }, [currentTargetLanguageId, currentSourceLanguageId, setValue]);

  // Use real page count from PDF/DOCX parser when available, otherwise fall back to estimation
  useEffect(() => {
    if (!isLoading) {
      setLoadingProgress(0);
      return;
    }

    const estimatedDurationMs = 4 * 60 * 1000;
    const anchorPoints = createAnchorPoints(estimatedDurationMs);

    const finalProgress = Math.floor(Math.random() * 3) + 97;

    const getCurrentTarget = (elapsedTime: number) => {
      if (elapsedTime <= 0) return 0;

      if (elapsedTime >= estimatedDurationMs) {
        return finalProgress;
      }

      const currentAnchor =
        anchorPoints.find((point) => point.time >= elapsedTime) ||
        anchorPoints[anchorPoints.length - 1];
      if (currentAnchor === anchorPoints[0]) {
        const timeRatio = elapsedTime / currentAnchor.time;
        return currentAnchor.progress * timeRatio;
      }

      const previousAnchor =
        anchorPoints[Math.max(anchorPoints.indexOf(currentAnchor) - 1, 0)];

      const timeRatio =
        (elapsedTime - previousAnchor.time) /
        (currentAnchor.time - previousAnchor.time);
      const progressDiff = currentAnchor.progress - previousAnchor.progress;
      return previousAnchor.progress + progressDiff * timeRatio;
    };

    const startTime = Date.now();
    const interval = 50; 

    const timer = setInterval(() => {
      const elapsedTime = Date.now() - startTime;

      // Check if we've exceeded the estimated duration
      if (elapsedTime > estimatedDurationMs) {
        setLoadingMessage(t("progress.longerThanUsual"));
        setLoadingProgress(finalProgress);
        return;
      }

      const currentAnchor =
        anchorPoints.find((point) => point.time >= elapsedTime) ||
        anchorPoints[anchorPoints.length - 1];

      // Inject estimation data for messages that expect dynamic values
      const msgKey = currentAnchor.messageKey;
      if (msgKey === "progress.documentInfo") {
        setLoadingMessage(t(msgKey, { data: estimatedPageCount || 0 }).replace("pages", estimatedPageCount > 1 ? "pages" : "page"));
      } else if (msgKey === "progress.wordCount") {
        const words = estimatedWordCount || (estimatedPageCount > 0 ? estimatedPageCount * 483 : 0);
        setLoadingMessage(t(msgKey, { data: words }));
      } else if (msgKey === "progress.estimatedTime") {
        const minutes = estimatedMinutes || (estimatedPageCount > 0 ? estimatedPageCount * 2 : 0);
        setLoadingMessage(t(msgKey, { data: minutes }));
      } else if (msgKey === "progress.estimatedCost") {
        const cost = estimatedCost && estimatedCost !== "0.00" ? estimatedCost : (estimatedPageCount > 0 ? (estimatedPageCount * 0.1).toFixed(2) : "0.00");
        setLoadingMessage(t(msgKey, { data: cost }));
      } else if (msgKey === "progress.documentType") {
        const file = currentFile && currentFile.length > 0 ? currentFile[0] : null;
        const ext = file?.name.split(".").pop()?.toLowerCase() || "unknown";
        setLoadingMessage(t(msgKey, { data: ext }));
      } else {
        setLoadingMessage(t(msgKey));
      }

      const targetProgress = getCurrentTarget(elapsedTime);

      // Stop at final progress and show "taking longer than usual"
      if (targetProgress >= finalProgress) {
        setLoadingProgress(finalProgress);
        setLoadingMessage(t("progress.longerThanUsual"));
        return;
      }

      setLoadingProgress(targetProgress);
    }, interval);

    return () => clearInterval(timer);
  }, [isLoading, t, currentFile, realPageCount, estimatedPageCount, estimatedMinutes, estimatedCost, estimatedWordCount]);

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
          setRealPageCount(pageCountResult.pageCount || pageCountResult.pages || null);
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

    setIsLoading(true);
    setLoadingProgress(0);
    setLoadingMessage(t("progress.starting"));

    try {
      await documentTranslatingWithJobId(
        data,
        setError,
        (_progress, message) => {
          if (
            message.toLowerCase().includes("error") ||
            message.toLowerCase().includes("failed")
          ) {
            setLoadingMessage(message);
          }
        },
        setSuggestionsLoading
      );

      setLoadingProgress(100);
      setLoadingMessage(t("progress.complete"));
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (err) {
      let message = "An unexpected error occurred during translation.";
      if (err instanceof Error) {
        message = err.message || message;
      }
      setError(message);
    } finally {
      setIsLoading(false);
      setLoadingProgress(0);
      setLoadingMessage("");
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

  const hasFile = currentFile && currentFile.length > 0;
  const currentFileObj = hasFile ? currentFile[0] : null;

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
        />
      )}
      <div className={translatedMarkdown ? "flex gap-8" : undefined}>
        <Card className="border-none flex-1 min-w-0 relative">
          <TranslationLoadingOverlay
            isVisible={isLoading}
            type="document"
            message={loadingMessage || tButton("loading")}
            progress={loadingProgress}
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
                  <span className="block text-xs text-muted-foreground mb-1">Source Language</span>
                  <LanguageSelect
                    value={currentSourceLanguageId}
                    onChange={setCurrentSourceLanguageId}
                    detectOption="Automatic detection"
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
                  <span className="block text-xs text-muted-foreground mb-1">Target Language</span>
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
                      onRemoveFile={handleRemoveFile}
                    />
                    {/* ADD THIS LINE TO SHOW PAGE COUNT ESTIMATION */}
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
    </>
  );
};

export default DocumentTranslationCard;
