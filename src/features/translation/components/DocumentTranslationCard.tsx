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
import LanguageSelectionPanel from "./LanguageSelectionPanel";
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
  } = useDocumentTranslationStore();

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    clearErrors,
  } = useForm<DocumentFormData>({
    resolver: zodResolver(documentTranslationSchema),
    defaultValues: {
      currentFile: null,
      currentTargetLanguageId,
      currentSourceLanguageId,
      isSrt: false,
    },
  });

  useEffect(() => {
    if (!isLoading) {
      setLoadingProgress(0);
      return;
    }

    // Define anchor points with their progress, timing, and message keys
    const anchorPoints = [
      { progress: 15, time: 3000, messageKey: "progress.preparing" },
      { progress: 35, time: 7000, messageKey: "progress.analyzing" },
      { progress: 55, time: 12000, messageKey: "progress.translating" },
      { progress: 75, time: 16000, messageKey: "progress.enhancing" },
      { progress: 90, time: 20000, messageKey: "progress.finalizing" },
      { progress: 97, time: 23000, messageKey: "progress.waiting" }
    ];

    // Function to get current target based on elapsed time
    const getCurrentTarget = (elapsedTime: number) => {
      // Handle initial case
      if (elapsedTime <= 0) return 0;
      
      const currentAnchor = anchorPoints.find(point => point.time >= elapsedTime) || anchorPoints[anchorPoints.length - 1];
      // If we're before the first anchor point, interpolate from 0
      if (currentAnchor === anchorPoints[0]) {
        const timeRatio = elapsedTime / currentAnchor.time;
        return Math.min(currentAnchor.progress * timeRatio, 97);
      }
      
      const previousAnchor = anchorPoints[Math.max(anchorPoints.indexOf(currentAnchor) - 1, 0)];
      
      // Calculate progress between anchor points
      const timeRatio = (elapsedTime - previousAnchor.time) / (currentAnchor.time - previousAnchor.time);
      const progressDiff = currentAnchor.progress - previousAnchor.progress;
      return Math.min(previousAnchor.progress + (progressDiff * timeRatio), 97);
    };

    const startTime = Date.now();
    const interval = 50; // Update every 50ms for smoother animation

    const timer = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      
      // Find appropriate message for current time
      const currentAnchor = anchorPoints.find(point => point.time >= elapsedTime) || anchorPoints[anchorPoints.length - 1];
      setLoadingMessage(t(currentAnchor.messageKey));

      if (elapsedTime >= 23000) {
        setLoadingProgress(97);
        clearInterval(timer);
        return;
      }

      const targetProgress = getCurrentTarget(elapsedTime);
      setLoadingProgress(targetProgress);
    }, interval);

    return () => clearInterval(timer);
  }, [isLoading, t]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!token) {
      setShowAuthModal(true);
      event.target.value = "";
      return;
    }

    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const isSrtFile = fileExtension === 'srt';
      
      setCurrentFile(event.target.files);
      setValue("currentFile", event.target.files);
      setValue("isSrt", isSrtFile);
      clearErrors("currentFile");
    }
  };

  const handleRemoveFile = () => {
    setCurrentFile(null);
    setTranslatedMarkdown("");
    setValue("currentFile", null);
    setValue("isSrt", false);
    clearErrors("currentFile");
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
      await documentTranslatingWithJobId(data, setError, (_progress, message) => {
        // We'll keep the backend messages for error handling only
        if (message.toLowerCase().includes("error") || message.toLowerCase().includes("failed")) {
          setLoadingMessage(message);
        }
      });
      
      // Only set to 100% when actually complete
      setLoadingProgress(100);
      setLoadingMessage(t("progress.complete"));
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (err) {
      console.log(err);
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
          className="mb-6"
        />
      )}
      <div className={translatedMarkdown ? "flex gap-8" : undefined}>
        <Card className="border-none flex-1 min-w-0 relative">
          <TranslationLoadingOverlay
            isVisible={isLoading}
            type="document"
            message={loadingMessage || tButton('loading')}
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
              {translatedMarkdown ? (
                <>
                  <LanguageSelectionPanel
                    targetLanguageId={currentTargetLanguageId}
                    sourceLanguageId={currentSourceLanguageId}
                    onTargetLanguageChange={(value) => {
                      setCurrentTargetLanguageId(value);
                      setValue("currentTargetLanguageId", value);
                      clearErrors("currentTargetLanguageId");
                    }}
                    onSourceLanguageChange={(value) => {
                      setCurrentSourceLanguageId(value);
                      setValue("currentSourceLanguageId", value);
                      clearErrors("currentSourceLanguageId");
                    }}
                    layout="horizontal"
                    showSwapButton={true}
                  />

                  <TranslationResultView
                    currentFile={currentFileObj!}
                    translatedMarkdown={translatedMarkdown}
                    onFileChange={handleFileChange}
                    onRemoveFile={handleRemoveFile}
                  />
                </>
              ) : (
                <div className="flex gap-2 md:gap-4 items-end flex-col md:flex-row">
                  <div className="w-full md:flex-1 min-w-0">
                    <LanguageSelectionPanel
                      targetLanguageId={currentTargetLanguageId}
                      sourceLanguageId={currentSourceLanguageId}
                      onTargetLanguageChange={(value) => {
                        setCurrentTargetLanguageId(value);
                        setValue("currentTargetLanguageId", value);
                        clearErrors("currentTargetLanguageId");
                      }}
                      onSourceLanguageChange={(value) => {
                        setCurrentSourceLanguageId(value);
                        setValue("currentSourceLanguageId", value);
                        clearErrors("currentSourceLanguageId");
                      }}
                      layout="horizontal"
                      showSwapButton={true}
                    />

                    <DocumentUploadView
                      currentFile={currentFileObj}
                      onFileChange={handleFileChange}
                      onRemoveFile={handleRemoveFile}
                    />
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
