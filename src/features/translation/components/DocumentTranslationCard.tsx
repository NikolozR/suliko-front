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
import ModelSelect from "./ModelSelect";
import { countPages } from "@/features/translation/services/countPagesService";

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

const estimatePageCount = (file: File): number => {
  const fileSizeKB = file.size / 1024;
  const fileExtension = file.name.split(".").pop()?.toLowerCase();

  // Images always count as 1 page
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(fileExtension || '')) {
    return 1;
  }

  switch (fileExtension) {
    case "pdf":
      return Math.max(1, Math.ceil(fileSizeKB / 50));
    case "docx":
      return Math.max(1, Math.ceil(fileSizeKB / 20));
    case "txt":
      return Math.max(1, Math.ceil(fileSizeKB / 3));
    case "rtf":
      return Math.max(1, Math.ceil(fileSizeKB / 10));
    case "srt":
      return Math.max(1, Math.ceil(fileSizeKB / 2));
    default:
      return Math.max(1, Math.ceil(fileSizeKB / 30));
  }
};

const createAnchorPoints = (totalDurationMs: number) => {
  return [
    {
      progress: 10,
      time: totalDurationMs * 0.05,
      messageKey: "progress.preparing",
    },
    {
      progress: 25,
      time: totalDurationMs * 0.15,
      messageKey: "progress.analyzing",
    },
    {
      progress: 50,
      time: totalDurationMs * 0.4,
      messageKey: "progress.translating",
    },
    {
      progress: 75,
      time: totalDurationMs * 0.7,
      messageKey: "progress.enhancing",
    },
    {
      progress: 90,
      time: totalDurationMs * 0.85,
      messageKey: "progress.finalizing",
    },
    {
      progress: 97,
      time: totalDurationMs * 0.95,
      messageKey: "progress.waiting",
    },
  ];
};

// ADD THIS OPTIONAL COMPONENT HERE (before the main component)
const PageCountDisplay = ({ file }: { file: File | null }) => {
  const { realPageCount, isCountingPages } = useDocumentTranslationStore();
  
  if (!file) return null;
  
  const fileExtension = file.name.split(".").pop()?.toLowerCase();
  
  // Show loading state while counting pages for DOCX files
  if (isCountingPages && fileExtension === 'docx') {
    return (
      <div className="text-sm text-muted-foreground mt-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-suliko-default-color border-t-transparent rounded-full animate-spin"></div>
          Counting pages...
        </div>
      </div>
    );
  }
  
  // Use real page count when available (for PDFs and DOCX), otherwise fall back to estimation
  const pageCount = (() => {
    // For PDFs and DOCX, use the real page count if available
    if ((fileExtension === 'pdf' || fileExtension === 'docx') && realPageCount !== null) {
      return realPageCount;
    }
    
    // For other file types or when real count isn't loaded yet, use estimation
    return estimatePageCount(file);
  })();
  
  const estimatedMinutes = pageCount * 2;
  const hasRealCount = (fileExtension === 'pdf' || fileExtension === 'docx') && realPageCount !== null;
  const estimatedCost = (pageCount * 0.1).toFixed(2);

  return (
    <div className="text-sm text-muted-foreground mt-2">
      {hasRealCount ? 'Actual' : 'Estimated'}: {pageCount} page{pageCount !== 1 ? "s" : ""}
      (~{estimatedMinutes} minute{estimatedMinutes !== 1 ? "s" : ""})
      <div className="mt-1 text-suliko-default-color font-semibold">
        Estimated cost: {estimatedCost} ლარი
      </div>
    </div>
  );
};

const modelOptions = [
  { value: 0, label: "კლაუდია" },
  { value: 1, label: "კლაუდია junior" },
  { value: 2, label: "გურამი" },
];

const DocumentTranslationCard = () => {
  const t = useTranslations("DocumentTranslationCard");
  const tButton = useTranslations("TranslationButton");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const { token } = useAuthStore();
  const {
    currentFile,
    setCurrentFile,
    translatedMarkdown,
    setTranslatedMarkdown,
    currentTargetLanguageId,
    setCurrentTargetLanguageId,
    currentSourceLanguageId,
    setCurrentSourceLanguageId,
    realPageCount,
  } = useDocumentTranslationStore();
  const [selectedModel, setSelectedModel] = useState<number>(-1);

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    clearErrors,
  } = useForm<DocumentFormData>({
    resolver: zodResolver(documentTranslationSchema),
    defaultValues: {
      currentFile: null,
      currentTargetLanguageId: 1,  // Set this explicitly to 1
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
    
    // Use real page count (100% accurate) when available for PDF and DOCX
    // Otherwise fall back to file size estimation for other file types
    const pageCount = (() => {
      if (!currentFile || currentFile.length === 0) return 1;
      
      const file = currentFile[0];
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      
      // For PDFs and DOCX, use the real page count when available
      if ((fileExtension === 'pdf' || fileExtension === 'docx') && realPageCount !== null) {
        return realPageCount;
      }
      
      // For other file types or when real count isn't loaded yet, use estimation
      const estimated = estimatePageCount(file);
      return estimated;
    })();

    const estimatedDurationMs = pageCount * 1 * 60 * 1000;
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
      setLoadingMessage(t(currentAnchor.messageKey));

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
  }, [isLoading, t, currentFile, realPageCount]);

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
    
    // Reset page count and loading state when file is removed
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
        selectedModel
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
                {/* Model select */}
                <div className="flex-1 flex flex-col">
                  <span className="block text-xs text-muted-foreground mb-1">Translation Model</span>
                  <ModelSelect
                    value={selectedModel}
                    onChange={setSelectedModel}
                    placeholder="აირჩიეთ მოდელი"
                    options={modelOptions}
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
                    onEdit={setTranslatedMarkdown}
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
