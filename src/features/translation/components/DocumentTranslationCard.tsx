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
import { PageRangeSelector } from "@/shared/components/PageRangeSelector";
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
import { extractPagesFromDocument } from "../utils/extractPages";
import { TranslationLoadingOverlay } from "@/features/ui/components/loading";
import { saveFileToStorage, getFileFromStorage, clearFileFromStorage, getMetadataFromStorage, type DocumentMetadata } from "@/shared/utils/fileStorage";
import LanguageSelect from "./LanguageSelect";
import { Button } from "@/features/ui/components/ui/button";
import { ArrowRightLeft } from "lucide-react";
import { countPages } from "@/features/translation/services/countPagesService";
import { useSuggestionsStore } from "../store/suggestionsStore";
import PageCountDisplay from "./PageCountDisplay";
import { useDocumentLoadingProgress } from "@/features/translation/hooks/useDocumentLoadingProgress";
import { useCountdown } from "@/hooks";
import { Checkbox } from "@/features/ui/components/ui/checkbox";
import { Label } from "@/features/ui/components/ui/label";
import { ocrToHtml, extractUserNames } from "@/features/translation/services/conversionsService";
import { getAllLanguages, type Language } from "@/features/translation/services/languageService";

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
  const [showPageRangeSelector, setShowPageRangeSelector] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFormData, setLastFormData] = useState<DocumentFormData | null>(null);
  const [/*loadingProgressState*/, /*setLoadingProgressState*/] = useState<number>(0);
  const [/*loadingMessageState*/, /*setLoadingMessageState*/] = useState<string>("");
  const { setSuggestionsLoading, suggestionsLoading, setUserNames } = useSuggestionsStore();
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
    selectedPageRange,
    setSelectedPageRange,
  } = useDocumentTranslationStore();
  const [isButtonHighlighted, setIsButtonHighlighted] = useState(false);
  const [isOcrOnly, setIsOcrOnly] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);

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

  // Show page range selector when document has more than 4 pages
  useEffect(() => {
    if (realPageCount && realPageCount > 4 && currentFileObj) {
      // Reset selection when a new document is uploaded
      if (!selectedPageRange) {
        setShowPageRangeSelector(true);
      }
    } else {
      // Clear selection if document has 4 or fewer pages
      if (realPageCount && realPageCount <= 4) {
        setSelectedPageRange(null);
        setShowPageRangeSelector(false);
      }
    }
  }, [realPageCount, currentFileObj, selectedPageRange, setSelectedPageRange]);

  useEffect(() => {
    setValue("currentTargetLanguageId", currentTargetLanguageId);
    setValue("currentSourceLanguageId", currentSourceLanguageId);
  }, [currentTargetLanguageId, currentSourceLanguageId, setValue]);

  // Fetch languages for name extraction
  useEffect(() => {
    const fetchLanguages = async () => {
      if (token) {
        try {
          const langs = await getAllLanguages();
          setLanguages(Array.isArray(langs) ? langs : []);
        } catch (error) {
          console.error("Failed to fetch languages:", error);
          setLanguages([]);
        }
      }
    };
    fetchLanguages();
  }, [token]);

  // Restore file from storage when user returns after authentication
  useEffect(() => {
    const restoreFile = async () => {
      // Only restore if user is authenticated and no file is currently loaded
      if (token && !currentFileObj && typeof window !== 'undefined' && 'indexedDB' in window) {
        try {
          const storedFile = await getFileFromStorage();
          const storedMetadata = await getMetadataFromStorage();
          
          if (storedFile) {
            // Reconstruct FileList from stored File
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(storedFile);
            const fileList = dataTransfer.files;
            
            setCurrentFile(fileList);
            setValue("currentFile", fileList);
            
            // Determine if it's an SRT file
            const fileExtension = storedFile.name.split(".").pop()?.toLowerCase();
            const isSrtFile = fileExtension === "srt";
            setValue("isSrt", isSrtFile);
            
            // Restore metadata if available
            if (storedMetadata) {
              const { setRealPageCount, setSelectedPageRange, setCurrentSourceLanguageId, setCurrentTargetLanguageId } = useDocumentTranslationStore.getState();
              
              if (storedMetadata.realPageCount !== null && storedMetadata.realPageCount !== undefined) {
                setRealPageCount(storedMetadata.realPageCount);
              }
              
              if (storedMetadata.selectedPageRange) {
                setSelectedPageRange(storedMetadata.selectedPageRange);
              }
              
              if (storedMetadata.currentSourceLanguageId !== undefined) {
                setCurrentSourceLanguageId(storedMetadata.currentSourceLanguageId);
              }
              
              if (storedMetadata.currentTargetLanguageId !== undefined) {
                setCurrentTargetLanguageId(storedMetadata.currentTargetLanguageId);
              }
            }
            
            // Clear the stored file from IndexedDB after restoring
            await clearFileFromStorage();
          }
        } catch (error) {
          console.error("Failed to restore file from storage:", error);
        }
      }
    };

    restoreFile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Clear stored file after successful translation
  useEffect(() => {
    const clearStorageAfterTranslation = async () => {
      if (translatedMarkdown && typeof window !== 'undefined' && 'indexedDB' in window) {
        try {
          await clearFileFromStorage();
        } catch (error) {
          console.error("Failed to clear file from storage after translation:", error);
        }
      }
    };

    clearStorageAfterTranslation();
  }, [translatedMarkdown]);

  // Save file to storage before navigating to sign-in
  const handleSaveFileBeforeAuth = async () => {
    if (currentFileObj && typeof window !== 'undefined' && 'indexedDB' in window) {
      try {
        const metadata: DocumentMetadata = {
          realPageCount,
          selectedPageRange,
          currentSourceLanguageId,
          currentTargetLanguageId,
        };
        await saveFileToStorage(currentFileObj, metadata);
      } catch (error) {
        console.error("Failed to save file to storage:", error);
      }
    }
  };

  const handleFileClick = () => {
    // Allow file upload without authentication
    // Authentication will be checked when user tries to translate
    return true;
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    // Allow file upload without authentication
    // Authentication will be checked when user tries to translate

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

      // Get exact page count for DOCX files (only if authenticated)
      if (fileExtension === "docx" && token) {
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

  const handleRemoveFile = async () => {
    setCurrentFile(null);
    setTranslatedMarkdown("");
    setValue("currentFile", null);
    setValue("isSrt", false);
    setIsOcrOnly(false);
    setUserNames([]);
    clearErrors("currentFile");
    
    const { setRealPageCount, setIsCountingPages, setSelectedPageRange } = useDocumentTranslationStore.getState();
    setRealPageCount(null);
    setIsCountingPages(false);
    setSelectedPageRange(null);
    setShowPageRangeSelector(false);
    
    // Clear stored file from IndexedDB if it exists
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      try {
        await clearFileFromStorage();
      } catch (error) {
        console.error("Failed to clear file from storage:", error);
      }
    }
    
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const onSubmit = async (data: DocumentFormData) => {
    if (!token) {
      // Save file to storage before showing auth modal
      await handleSaveFileBeforeAuth();
      setShowAuthModal(true);
      return;
    }

    if (!data.currentFile || data.currentFile.length === 0) {
      return;
    }

    // For OCR mode, skip page balance check and page range validation
    if (!isOcrOnly) {
      // Check if page range selection is required and selected
      if (realPageCount && realPageCount > 4) {
        if (!selectedPageRange) {
          setShowPageRangeSelector(true);
          setError(t("pageSelection.required"));
          return;
        }
      }

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
    }

    // Store form data for retry
    setLastFormData(data);

    setIsLoading(true);
    setManualProgress(0, t("progress.starting"));

    try {
      // Handle OCR Only mode
      if (isOcrOnly) {
        setManualProgress(10, "Processing OCR...");
        let fileToOcr = data.currentFile[0];
        
        // Extract pages if page range is selected (for OCR mode too)
        if (realPageCount && realPageCount > 4 && selectedPageRange) {
          setManualProgress(15, t("progress.extractingPages"));
          const extractedFile = await extractPagesFromDocument(
            fileToOcr,
            selectedPageRange.startPage,
            selectedPageRange.endPage
          );
          
          if (!extractedFile) {
            setError(t("pageSelection.extractionNotSupported"));
            setIsLoading(false);
            reset();
            return;
          }
          
          fileToOcr = extractedFile;
        }

        setManualProgress(30, "Running OCR...");
        const htmlContent = await ocrToHtml(fileToOcr);
        
        setManualProgress(90, "Loading result...");
        setTranslatedMarkdown(htmlContent);
        
        setManualProgress(100, t("progress.complete"));
        await new Promise((resolve) => setTimeout(resolve, 500));
        return;
      }

      // Normal translation flow
      // Extract pages if page range is selected
      let fileToTranslate = data.currentFile[0];
      if (realPageCount && realPageCount > 4 && selectedPageRange) {
        setManualProgress(5, t("progress.extractingPages"));
        const extractedFile = await extractPagesFromDocument(
          fileToTranslate,
          selectedPageRange.startPage,
          selectedPageRange.endPage
        );
        
        if (!extractedFile) {
          // If extraction is not supported (e.g., DOCX), show error
          setError(t("pageSelection.extractionNotSupported"));
          setIsLoading(false);
          reset();
          return;
        }
        
        fileToTranslate = extractedFile;
        
        // Create a new FileList with the extracted file
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(extractedFile);
        const newFileList = dataTransfer.files;
        
        // Update form data with extracted file
        data.currentFile = newFileList;
        setValue("currentFile", newFileList);
      }

      // Start translation
      const translationPromise = documentTranslatingWithJobId(
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

      // Extract user names in parallel (non-blocking)
      const extractNamesPromise = (async () => {
        try {
          // Skip if source language is auto-detect (0) or languages not loaded
          if (data.currentSourceLanguageId === 0) {
            console.log("Skipping name extraction: source language is auto-detect");
            return;
          }

          if (languages.length === 0) {
            console.warn("Languages not loaded yet, skipping name extraction");
            return;
          }

          // Get language name from source language ID
          const sourceLanguage = languages.find((lang: Language) => lang.id === data.currentSourceLanguageId);
          if (!sourceLanguage) {
            console.warn("Source language not found for name extraction", {
              sourceLanguageId: data.currentSourceLanguageId,
              availableLanguages: languages.map(l => ({ id: l.id, name: l.name }))
            });
            return;
          }
          
          // Use the language name (e.g., "Georgian", "English", "Russian")
          const languageName = sourceLanguage.name.replace(" Language", "").trim();
          console.log("Extracting user names with language:", languageName);
          
          // Extract user names from the original file (before page extraction if any)
          const originalFile = data.currentFile[0];
          console.log("Calling extractUserNames API...");
          const userNamesResult = await extractUserNames(originalFile, languageName);
          console.log("User names extraction result:", userNamesResult);
          
          if (userNamesResult.success && userNamesResult.userNames.length > 0) {
            const { setUserNames } = useSuggestionsStore.getState();
            setUserNames(userNamesResult.userNames);
            console.log("User names set in store:", userNamesResult.userNames);
          } else {
            console.log("No user names found or extraction failed");
          }
        } catch (error) {
          // Log error but don't block translation
          console.error("Failed to extract user names:", error);
        }
      })();

      // Wait for translation to complete
      await translationPromise;
      
      // Wait for name extraction (but don't block if it's still running)
      await extractNamesPromise.catch(() => {});

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
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Upload className="h-5 w-5" />
                  {t("title")}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {t("description")}
                </CardDescription>
              </div>
              {/* OCR Only Toggle - Same height as Upload document title */}
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="ocr-only-header"
                  className="text-sm font-medium cursor-pointer"
                >
                  {t("ocrOnly")}
                </Label>
                <button
                  type="button"
                  id="ocr-only-header"
                  role="switch"
                  aria-checked={isOcrOnly}
                  onClick={() => setIsOcrOnly(!isOcrOnly)}
                  className={`
                    relative inline-flex h-7 w-12 items-center rounded-full transition-colors
                    focus:outline-none focus:ring-2 focus:ring-suliko-default-color focus:ring-offset-2
                    ${isOcrOnly ? 'bg-suliko-default-color' : 'bg-gray-300 dark:bg-gray-600'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-5 w-5 transform rounded-full bg-white transition-transform
                      ${isOcrOnly ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit}>
              {/* Unified select row: source, swap, target, model */}
              {!isOcrOnly && (
                <div className="flex flex-col sm:flex-row gap-2 md:gap-4 mb-4 items-stretch sm:items-end">
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
              )}
              {translatedMarkdown ? (
                <>
                  <TranslationResultView
                    currentFile={currentFileObj!}
                    translatedMarkdown={translatedMarkdown}
                    onFileChange={handleFileChange}
                    onRemoveFile={handleRemoveFile}
                    onEdit={setTranslatedMarkdownWithoutZoomReset}
                    isSuggestionsLoading={suggestionsLoading}
                    isOcrOnly={isOcrOnly}
                    onOcrOnlyChange={setIsOcrOnly}
                  />
                </>
              ) : (
                <div className="flex gap-2 md:gap-4 items-stretch sm:items-end flex-col sm:flex-row">
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
      {realPageCount && realPageCount > 4 && (
        <PageRangeSelector
          isOpen={showPageRangeSelector}
          onClose={() => {
            setShowPageRangeSelector(false);
            // If no selection was made and modal is closed, don't block submission
            // User can reopen it if needed
          }}
          totalPages={realPageCount}
        />
      )}
    </>
  );
};

export default DocumentTranslationCard;
