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
// DISABLED: Unused imports - Splitting functionality is kept in repository but not used
// import { PageWarningModal } from "@/shared/components/PageWarningModal";
// import { PageRangeSelector } from "@/shared/components/PageRangeSelector";
import { useDocumentTranslationStore } from "@/features/translation/store/documentTranslationStore";
import TranslationResultView from "./TranslationResultView";
import DocumentUploadView from "./DocumentUploadView";
import TranslationSubmitButton from "./TranslationSubmitButton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import ErrorAlert from "@/shared/components/ErrorAlert";
import { EmailPromptModal } from "@/shared/components/EmailPromptModal";
import { startTranslationProject } from "../utils/startTranslationProject";
import { suggestNameTranslations } from "../services/nameTranslationService";
import NameReviewModal from "./NameReviewModal";
import { NameTranslationItem, DEFAULT_DOCUMENT_OUTPUT_FORMAT } from "../types/types.Translation";
import { moveChatToProject, uploadOriginalForChat } from "@/features/chatHistory";
import { getProjectNames, saveProjectNames, type ProjectNameTranslation } from "@/features/projects";
// DISABLED: Unused import - Splitting functionality is kept in repository but not used
// import { extractPagesFromDocument } from "../utils/extractPages";
import { saveFileToStorage, getFileFromStorage, clearFileFromStorage, getMetadataFromStorage, saveOriginalFileForChat, type DocumentMetadata } from "@/shared/utils/fileStorage";
import { MAX_DOCUMENT_UPLOAD_BYTES, formatBytes } from "../constants/uploadLimits";
import LanguageSelect from "./LanguageSelect";
import { DeliverableSelect, NamesBlock, QuoteBlock } from "./JobPanel";
import { Button } from "@/features/ui/components/ui/button";
import { ArrowRightLeft } from "lucide-react";
import { countPages } from "@/features/translation/services/countPagesService";
import { useSuggestionsStore } from "../store/suggestionsStore";
import PageCountDisplay from "./PageCountDisplay";
import { useDocumentLoadingProgress } from "@/features/translation/hooks/useDocumentLoadingProgress";
import { estimateMinutes } from "@/features/translation/utils/translationEta";
import { useCountdown } from "@/hooks";
import { ocrToHtml } from "@/features/translation/services/conversionsService";
import ProgressBar from "@/shared/components/ProgressBar";
import { startRouteProgress } from "@/shared/components/RouteTransitionProgress";

// DISABLED: Unused import - Splitting functionality is kept in repository but not used
// import toaster, { toast } from 'react-hot-toast'
import toaster from 'react-hot-toast'

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
      return file && file.size <= MAX_DOCUMENT_UPLOAD_BYTES;
    }, `File must be ${formatBytes(MAX_DOCUMENT_UPLOAD_BYTES)} or smaller.`),
  currentTargetLanguageId: z.number(),
  currentSourceLanguageId: z.number(),
  isSrt: z.boolean().optional(),
});

export type DocumentFormData = z.infer<typeof documentTranslationSchema>;

const NAME_DETECTION_STORAGE_KEY = "suliko:nameDetectionEnabled";

const nameKey = (original: string) => original.trim().toLowerCase();

const stripId = ({ original, translation, type }: ProjectNameTranslation): NameTranslationItem => ({
  original,
  translation,
  type,
});

/** Merge a saved project glossary with extra confirmed pairs, deduped by original (extras win). */
const mergeNames = (
  saved: ProjectNameTranslation[],
  extra: NameTranslationItem[]
): NameTranslationItem[] => {
  const byKey = new Map<string, NameTranslationItem>();
  for (const p of saved) {
    if (p.original?.trim()) byKey.set(nameKey(p.original), stripId(p));
  }
  for (const e of extra) {
    if (e.original?.trim()) {
      byKey.set(nameKey(e.original), {
        original: e.original.trim(),
        translation: e.translation,
        type: e.type,
      });
    }
  }
  return Array.from(byKey.values());
};


const DocumentTranslationCard = () => {
  const t = useTranslations("DocumentTranslationCard");
  const tButton = useTranslations("TranslationButton");
  const tCommon = useTranslations("CommonLanguageSelect");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);

  // DISABLED: Unused state - Splitting functionality is kept in repository but not used
  // const [showPageWarning, setShowPageWarning] = useState<boolean>(false);
  // const [showPageRangeSelector, setShowPageRangeSelector] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFormData, setLastFormData] = useState<DocumentFormData | null>(null);
  const [/*loadingProgressState*/, /*setLoadingProgressState*/] = useState<number>(0);
  const [/*loadingMessageState*/, /*setLoadingMessageState*/] = useState<string>("");
  const { suggestionsLoading } = useSuggestionsStore();
  const { token } = useAuthStore();
  const { userProfile, fetchUserProfile } = useUserStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const projectName = searchParams.get("projectName");
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
    isCountingPages,
    estimatedMinutes,
    estimatedCost,
    estimatedWordCount,
    selectedPageRange,
    // DISABLED: Unused setter - Splitting functionality is kept in repository but not used
    // setSelectedPageRange,
  } = useDocumentTranslationStore();
  const [isButtonHighlighted, setIsButtonHighlighted] = useState(false);
  const [isOcrOnly, setIsOcrOnly] = useState(false);
  // Output format for document (non-SRT) translations. Defaults to the standard HTML output.
  const [outputFormat, setOutputFormat] = useState<number>(DEFAULT_DOCUMENT_OUTPUT_FORMAT);
  const [isDetectingNames, setIsDetectingNames] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [detectedNames, setDetectedNames] = useState<NameTranslationItem[]>([]);
  const [pendingTranslationData, setPendingTranslationData] = useState<DocumentFormData | null>(null);
  // Saved project glossary carried across the review modal (project flow only).
  const [pendingSavedNames, setPendingSavedNames] = useState<ProjectNameTranslation[]>([]);
  // Standalone-only opt-in for name detection; remembered per browser. Default OFF.
  /**
   * Default on. Consistent naming across a user's documents is the point of the
   * feature, and defaulting it off meant most people never discovered it — it
   * was a 22px unlabelled switch. Only an explicit "0" in storage turns it off,
   * so a user who has actively opted out keeps that choice.
   */
  const [nameDetectionEnabled, setNameDetectionEnabled] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setNameDetectionEnabled(window.localStorage.getItem(NAME_DETECTION_STORAGE_KEY) !== "0");
  }, []);

  const toggleNameDetection = () => {
    setNameDetectionEnabled((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(NAME_DETECTION_STORAGE_KEY, next ? "1" : "0");
      }
      return next;
    });
  };

  const hasFile = currentFile && currentFile.length > 0;

  /**
   * What the quote is allowed to show as the page count.
   *
   * `null` means "not resolved yet" and puts the quote figures into a skeleton
   * with the CTA disabled. That is deliberate: `estimatedPageCount` falls back
   * to a file-size heuristic for types we cannot really count, and presenting a
   * guess as the number the user is charged is what made the old balance check
   * fail after the click rather than before it.
   */
  const quotedPageCount: number | null = !hasFile
    ? null
    : isCountingPages
      ? null
      : realPageCount ?? (estimatedPageCount > 0 ? estimatedPageCount : null);

  const quoteEtaMin = quotedPageCount ? Math.max(1, estimateMinutes(quotedPageCount)) : 0;
  const quoteEtaMax = quotedPageCount ? Math.max(2, Math.round(quoteEtaMin * 1.35)) : 0;

  /** Saved glossary size, shown instead of hiding the control inside a project. */
  const [projectGlossaryCount, setProjectGlossaryCount] = useState<number>(0);
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    getProjectNames(projectId)
      .then((names) => { if (!cancelled) setProjectGlossaryCount(names.length); })
      .catch(() => { /* the panel simply omits the count */ });
    return () => { cancelled = true; };
  }, [projectId]);
  const currentFileObj = hasFile ? currentFile[0] : null;

  const { loadingProgress, loadingMessage, setManualProgress, reset } =
    useDocumentLoadingProgress({
      isLoading,
      t,
      currentFile: currentFileObj,
      estimatedPageCount,
      estimatedMinutes,
      estimatedCost,
      estimatedWordCount,
    });

  // Shared with the progress bar and the wait page, so the same document is
  // never quoted two different durations in one session.
  const countdownMinutes = estimateMinutes(estimatedPageCount);

  const { start, stop } = useCountdown({
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
    watch,
  } = useForm<DocumentFormData>({
    resolver: zodResolver(documentTranslationSchema),
    defaultValues: {
      currentFile: null,
      currentTargetLanguageId: 1,
      currentSourceLanguageId: 0,
      isSrt: false,
    },
  });

  // DISABLED: Show page warning - Splitting functionality is kept in repository but not used
  // useEffect(() => {
  //   if (realPageCount && realPageCount > 3) {
  //     setShowPageWarning(true);
  //   }
  // }, [realPageCount]);

  // DISABLED: Show page range selector when document has more than 10 pages
  // Splitting functionality is kept in repository but not used
  // useEffect(() => {
  //   if (realPageCount && realPageCount > 10 && currentFileObj) {
  //     // Reset selection when a new document is uploaded
  //     if (!selectedPageRange) {
  //       setShowPageRangeSelector(true);
  //     }
  //   } else {
  //     // Clear selection if document has 10 or fewer pages
  //     if (realPageCount && realPageCount <= 10) {
  //       setSelectedPageRange(null);
  //       setShowPageRangeSelector(false);
  //     }
  //   }
  // }, [realPageCount, currentFileObj, selectedPageRange, setSelectedPageRange]);

  useEffect(() => {
    setValue("currentTargetLanguageId", currentTargetLanguageId);
    setValue("currentSourceLanguageId", currentSourceLanguageId);
  }, [currentTargetLanguageId, currentSourceLanguageId, setValue]);


  // Restore file from storage when user returns after authentication
  useEffect(() => {
    const restoreFile = async () => {
      if (!token || currentFileObj || typeof window === 'undefined' || !('indexedDB' in window)) return;

      try {
        const storedFile = await getFileFromStorage();
        const storedMetadata = await getMetadataFromStorage();

        if (!storedFile) return;

        // Reconstruct FileList
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(storedFile);
        const fileList = dataTransfer.files;

        setCurrentFile(fileList);
        setValue("currentFile", fileList);
        clearErrors("currentFile");

        // Set SRT flag
        setValue("isSrt", storedFile.name.split(".").pop()?.toLowerCase() === "srt");

        // Restore metadata
        if (storedMetadata) {
          const { setRealPageCount, setCurrentSourceLanguageId, setCurrentTargetLanguageId } =
            useDocumentTranslationStore.getState();

          if (storedMetadata.realPageCount != null) setRealPageCount(storedMetadata.realPageCount);
          if (storedMetadata.currentSourceLanguageId != null) setCurrentSourceLanguageId(storedMetadata.currentSourceLanguageId);
          if (storedMetadata.currentTargetLanguageId != null) setCurrentTargetLanguageId(storedMetadata.currentTargetLanguageId);
        }

        // Clear storage after restoring
        await clearFileFromStorage();
      } catch (err) {
        console.error("Failed to restore file from storage:", err);
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


  useEffect(() => {
    if (currentFile && currentFile.length > 0) {
      setValue("currentFile", currentFile, { shouldValidate: true });
      clearErrors("currentFile");
    } else {
      setValue("currentFile", null);
    }
  }, [currentFile, setValue, clearErrors]);

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
    if (!event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];

    if (file.size > MAX_DOCUMENT_UPLOAD_BYTES) {
      toaster.error(
        t("fileTooLarge", {
          name: file.name,
          size: formatBytes(file.size),
          max: formatBytes(MAX_DOCUMENT_UPLOAD_BYTES),
        }),
        { duration: 6000 }
      );
      event.target.value = "";
      return;
    }

    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
    const isSrtFile = fileExtension === "srt";

    // Clear previous translation results and suggestions
    setTranslatedMarkdown("");
    const { setSuggestions, setJobId, setChatId } = useDocumentTranslationStore.getState();
    setSuggestions([]);
    setJobId("");
    setChatId("");
    useSuggestionsStore.getState().reset();

    // Update current file in state and form
    setCurrentFile(event.target.files);
    setValue("currentFile", event.target.files);
    setValue("isSrt", isSrtFile);
    clearErrors("currentFile");

    // Highlight translate button briefly
    setIsButtonHighlighted(true);
    setTimeout(() => setIsButtonHighlighted(false), 3000);

    const { setRealPageCount, setIsCountingPages } = useDocumentTranslationStore.getState();

    if (fileExtension === "docx" && token) {
      // Count DOCX pages if authenticated
      setIsCountingPages(true);
      setRealPageCount(null);

      try {
        const pageCountResult = await countPages(file);
        const pageCount = pageCountResult.pageCount || pageCountResult.pages || null;
        setRealPageCount(pageCount);
      } catch (err) {
        console.error("Failed to count DOCX pages:", err);
        setRealPageCount(null);
      } finally {
        setIsCountingPages(false);
      }
    } else if (fileExtension !== "pdf") {
      // For non-PDF/non-DOCX, reset page count
      setRealPageCount(null);
      setIsCountingPages(false);
    }
  };

  const handleRemoveFile = async () => {
  // Clear translation result and OCR flag
  setTranslatedMarkdown("");
  setIsOcrOnly(false);

  // Clear form values
  setValue("currentFile", null, { shouldValidate: false });
  setValue("isSrt", false, { shouldValidate: false });
  clearErrors("currentFile");

  // Clear document translation store states
  const { setRealPageCount, setIsCountingPages } = useDocumentTranslationStore.getState();
  setRealPageCount(null);
  setIsCountingPages(false);

  // Clear IndexedDB storage if any
  if (typeof window !== "undefined" && "indexedDB" in window) {
    try {
      await clearFileFromStorage();
    } catch (error) {
      console.error("Failed to clear file from storage:", error);
    }
  }

  // Only reset the file input element once
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
  if (fileInput && fileInput.files?.length) {
    fileInput.value = "";
  }

  // Only update currentFile once after everything else is done
  setCurrentFile(null);
};

  const onSubmit = async (
    data: DocumentFormData,
    confirmedNames?: NameTranslationItem[] | React.BaseSyntheticEvent
  ) => {
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
      // DISABLED: Check if page range selection is required and selected
      // Splitting functionality is kept in repository but not used
      // if (realPageCount && realPageCount > 10) {
      //   if (!selectedPageRange) {
      //     setShowPageRangeSelector(true);
      //     toast.error(t("pageSelection.required"))
      //     // setError(t("pageSelection.required"));
      //     return;
      //   }
      // }

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

    // Pre-translation name handling (normal document translation only — not SRT or OCR-only).
    // `confirmedNames` is an array only when re-invoked from the review modal; the initial
    // react-hook-form submit passes its event object here, so we discriminate with Array.isArray.
    let reviewedNames: NameTranslationItem[] = Array.isArray(confirmedNames) ? confirmedNames : [];
    if (!Array.isArray(confirmedNames) && !isOcrOnly && !data.isSrt) {
      if (projectId) {
        // Project flow: auto-apply the saved glossary, review only names not already saved.
        try {
          setIsDetectingNames(true);
          // Detection is resilient: a failure here still applies the saved glossary.
          const [savedPairs, detected] = await Promise.all([
            getProjectNames(projectId).catch(() => [] as ProjectNameTranslation[]),
            suggestNameTranslations(
              data.currentFile[0],
              data.currentSourceLanguageId,
              data.currentTargetLanguageId
            ).catch(() => [] as NameTranslationItem[]),
          ]);
          const savedKeys = new Set(savedPairs.map((p) => nameKey(p.original)));
          const newOnes = detected.filter((d) => !savedKeys.has(nameKey(d.original)));
          if (newOnes.length > 0) {
            setPendingSavedNames(savedPairs);
            setDetectedNames(newOnes);
            setPendingTranslationData(data);
            setShowNameModal(true);
            return; // resumes from the modal's confirm/skip handlers
          }
          // No new names — translate with the existing glossary, no review needed.
          reviewedNames = savedPairs.map(stripId);
        } catch (err) {
          console.error("Project name detection failed; proceeding without name review:", err);
        } finally {
          setIsDetectingNames(false);
        }
      } else if (nameDetectionEnabled) {
        // Standalone flow: only when the user has opted in via the toggle.
        try {
          setIsDetectingNames(true);
          const names = await suggestNameTranslations(
            data.currentFile[0],
            data.currentSourceLanguageId,
            data.currentTargetLanguageId
          );
          if (names.length > 0) {
            setPendingSavedNames([]);
            setDetectedNames(names);
            setPendingTranslationData(data);
            setShowNameModal(true);
            return; // flow resumes from the modal's confirm/skip handlers
          }
        } catch (err) {
          console.error("Name detection failed; proceeding without name review:", err);
        } finally {
          setIsDetectingNames(false);
        }
      }
    }

    // Store form data for retry
    setLastFormData(data);

    try {
      setIsLoading(true);
      setManualProgress(5, t("progress.uploading"));

      // Handle OCR Only mode
      if (isOcrOnly) {
        setManualProgress(0, t("progress.starting"));
        setManualProgress(10, "Processing OCR...");
        const fileToOcr = data.currentFile[0];

        // DISABLED: Extract pages if page range is selected (for OCR mode too)
        // Splitting functionality is kept in repository but not used
        // if (realPageCount && realPageCount > 10 && selectedPageRange) {
        //   setManualProgress(15, t("progress.extractingPages"));
        //   const extractedFile = await extractPagesFromDocument(
        //     fileToOcr,
        //     selectedPageRange.startPage,
        //     selectedPageRange.endPage
        //   );
        //   
        //   if (!extractedFile) {
        //     setError(t("pageSelection.extractionNotSupported"));
        //     setIsLoading(false);
        //     reset();
        //     return;
        //   }
        //   
        //   fileToOcr = extractedFile;
        // }

        setManualProgress(30, "Running OCR...");
        const htmlContent = await ocrToHtml(fileToOcr);

        setManualProgress(90, "Loading result...");
        setTranslatedMarkdown(htmlContent);

        setManualProgress(100, t("progress.complete"));
        await new Promise((resolve) => setTimeout(resolve, 500));
        return;
      }

      // Normal translation flow
      // DISABLED: Extract pages if page range is selected
      // Splitting functionality is kept in repository but not used
      // let fileToTranslate = data.currentFile[0];
      // if (realPageCount && realPageCount > 10 && selectedPageRange) {
      //   setManualProgress(5, t("progress.extractingPages"));
      //   const extractedFile = await extractPagesFromDocument(
      //     fileToTranslate,
      //     selectedPageRange.startPage,
      //     selectedPageRange.endPage
      //   );
      //   
      //   if (!extractedFile) {
      //     // If extraction is not supported (e.g., DOCX), show error
      //     setError(t("pageSelection.extractionNotSupported"));
      //     setIsLoading(false);
      //     reset();
      //     return;
      //   }
      //   
      //   fileToTranslate = extractedFile;
      //   
      //   // Create a new FileList with the extracted file
      //   const dataTransfer = new DataTransfer();
      //   dataTransfer.items.add(extractedFile);
      //   const newFileList = dataTransfer.files;
      //   
      //   // Update form data with extracted file
      //   data.currentFile = newFileList;
      //   setValue("currentFile", newFileList);
      // }

      const { chatId } = await startTranslationProject(data, estimatedPageCount || 1, reviewedNames, outputFormat);

      // Persist the original file so the translation detail page can show the preview.
      // URI-based (Gemini) translations don't store bytes on the backend during translation,
      // so we persist them in two places:
      if (!data.isSrt) {
        // 1. Server-side copy — visible on any device for ~1 month (primary preview source).
        uploadOriginalForChat(chatId, data.currentFile[0]).catch(() => {});
        // 2. Browser-local copy — instant preview in this browser until cache is cleared.
        if (typeof window !== 'undefined' && 'indexedDB' in window) {
          saveOriginalFileForChat(chatId, data.currentFile[0]).catch(() => {});
        }
      }
      // Also update the in-memory store so the translation page can use it instantly
      useDocumentTranslationStore.getState().setChatId(chatId);

      if (projectId) {
        moveChatToProject(chatId, projectId).catch(() => {});
      }

      setManualProgress(12, t("progress.translationStarted"));
      window.dispatchEvent(new Event("translations-updated"));
      // App Router gives no navigation-start hook for router.push, so the top
      // progress bar has to be told explicitly — this is the slowest, most
      // visible navigation in the app.
      startRouteProgress();
      router.push(`/translations/${chatId}`);
    } catch (err) {
      console.error("Translation failed:", err);
      // Prefer the server's explanation (e.g. an unsupported file type) over the
      // generic fallback — otherwise every failure looks identical to the user.
      const detail = err instanceof Error ? err.message.trim() : "";
      setError(detail ? `${t("progress.unexpectedError")} ${detail}` : t("progress.unexpectedError"));
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


  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentFileObj) {
      setError("Please select a file to translate.");
      return;
    }


    if (error) {
      toaster.error(t("ups"));
      return;
    }

    if (!token) {
      // Save file to storage before showing auth modal
      await handleSaveFileBeforeAuth();
      setShowAuthModal(true);
      return;
    }

    // ensure profile is loaded and check email
    let profile = userProfile;
    if (!profile) {
      try {
        await fetchUserProfile();
      } catch (err) {
        console.error("Failed to fetch profile for email check", err);
      }
      profile = useUserStore.getState().userProfile;
    }

    if (profile && (!profile.email || profile.email.endsWith('@example.com'))) {
      setShowEmailModal(true);
      return;
    }

    handleSubmit(onSubmit, handleFormError)();
  };

  const handleNameConfirm = (editedItems: NameTranslationItem[]) => {
    setShowNameModal(false);
    const data = pendingTranslationData;
    setPendingTranslationData(null);
    if (!data) return;

    if (projectId) {
      const saved = pendingSavedNames;
      setPendingSavedNames([]);
      // Persist the newly confirmed names into the project glossary (non-blocking).
      if (editedItems.length > 0) {
        saveProjectNames(projectId, editedItems).catch((err) =>
          console.error("Failed to save project names:", err)
        );
      }
      // Translate with the full glossary: existing saved ∪ confirmed new.
      onSubmit(data, mergeNames(saved, editedItems));
    } else {
      onSubmit(data, editedItems);
    }
  };

  const handleNameSkip = () => {
    setShowNameModal(false);
    const data = pendingTranslationData;
    setPendingTranslationData(null);
    if (!data) return;

    if (projectId) {
      const saved = pendingSavedNames;
      setPendingSavedNames([]);
      // Skip adding the new names, but still apply the existing glossary.
      onSubmit(data, saved.map(stripId));
    } else {
      onSubmit(data, []);
    }
  };

  // Dismissing the modal (X / overlay / Esc) cancels without translating; the file stays loaded.
  const handleNameModalOpenChange = (open: boolean) => {
    if (isLoading) return;
    setShowNameModal(open);
    if (!open) {
      setPendingTranslationData(null);
      setPendingSavedNames([]);
    }
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
                {projectId && projectName && !translatedMarkdown && (
                  <p className="text-sm text-suliko-default-color font-medium mt-1">
                    {t("addingToProject", { name: projectName })}
                  </p>
                )}
              </div>
              {/* The name-detection toggle moved into the job panel's Names
                  block, where it has a title, a body and a visible glossary
                  count instead of a `title=` attribute no touch or keyboard
                  user could reach. */}
              {/* OCR Only Toggle - waishala */}
              {/* <div className="flex items-center gap-2">
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
              </div> */}
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
                      className="h-11 w-11 rounded-full border-2 hover:border-suliko-default-color hover:text-suliko-default-color transition-colors"
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
                /* Document column beside the job panel. The panel is a fixed
                   392px so the quote arithmetic stays put while the document
                   column absorbs the width. */
                <div className="flex flex-col items-start gap-6 lg:flex-row">
                  <div className="w-full min-w-0 lg:flex-1">
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

                  <aside className="flex w-full flex-col gap-4 lg:w-[392px] lg:shrink-0">
                    {!isOcrOnly && !watch("isSrt") && (
                      <DeliverableSelect value={outputFormat} onChange={setOutputFormat} />
                    )}
                    {!isOcrOnly && !watch("isSrt") && (
                      <NamesBlock
                        enabled={nameDetectionEnabled}
                        onToggle={toggleNameDetection}
                        projectId={projectId}
                        projectName={projectName}
                        savedCount={projectId ? projectGlossaryCount : undefined}
                      />
                    )}
                    <QuoteBlock
                      pageCount={quotedPageCount}
                      balance={userProfile?.balance ?? 0}
                      submitLabel={
                        isLoading || isDetectingNames
                          ? tButton("translating")
                          : t("quote.translateCta", { count: quotedPageCount ?? 0 })
                      }
                      onSubmitDisabled={
                        isLoading || isDetectingNames || (token ? !hasFile : false)
                      }
                      etaMin={quoteEtaMin}
                      etaMax={quoteEtaMax}
                    />
                  </aside>
                </div>
              )}

              {translatedMarkdown && (
                <TranslationSubmitButton
                  isLoading={isLoading || isDetectingNames}
                  hasResult={!!translatedMarkdown}
                  disabled={isLoading || isDetectingNames || (!token ? false : !hasFile)}
                  showShiftEnter={true}
                  formError={token ? getFormError() : null}
                  isHighlighted={isButtonHighlighted}
                  onTranslateMore={handleRemoveFile}
                />
              )}

              {/* Progress bar + step indicator */}
              {isLoading && (
                <div className="mt-4 space-y-3">
                  {/* Step indicator */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    {[
                      { label: t("progress.stepUploading"), threshold: 0 },
                      { label: t("progress.stepTranslating"), threshold: 15 },
                      { label: t("progress.stepReady"), threshold: 90 },
                    ].map((step, i, arr) => {
                      const isActive = loadingProgress >= step.threshold && (i === arr.length - 1 || loadingProgress < arr[i + 1].threshold);
                      const isDone = i < arr.length - 1 && loadingProgress >= arr[i + 1].threshold;
                      return (
                        <div key={step.label} className="flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full transition-colors duration-500 ${isDone ? "bg-green-500" : isActive ? "bg-suliko-default-color animate-pulse" : "bg-border"}`} />
                          <span className={isDone || isActive ? "text-foreground font-medium" : ""}>{step.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  {/* Progress bar */}
                  <ProgressBar
                    value={loadingProgress}
                    size="sm"
                    tone="brand"
                    label={t("progress.stepUploading")}
                  />
                  {/* Status message */}
                  {loadingMessage && (
                    <p className="text-xs text-center text-muted-foreground truncate">{loadingMessage}</p>
                  )}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      <NameReviewModal
        open={showNameModal}
        items={detectedNames}
        isSubmitting={isLoading}
        isProjectContext={!!projectId}
        onOpenChange={handleNameModalOpenChange}
        onConfirm={handleNameConfirm}
        onSkip={handleNameSkip}
      />
      {/* DISABLED: PageWarningModal - Splitting functionality is kept in repository but not used */}
      {/* <PageWarningModal
        isOpen={showPageWarning}
        onClose={() => setShowPageWarning(false)}
        pageCount={estimatedPageCount}
      /> */}
      {/* DISABLED: PageRangeSelector - Splitting functionality is kept in repository but not used */}
      {/* {realPageCount && realPageCount > 10 && (
        <PageRangeSelector
          isOpen={showPageRangeSelector}
          onClose={() => {
            setShowPageRangeSelector(false);
            // If no selection was made and modal is closed, don't block submission
            // User can reopen it if needed
          }}
          totalPages={realPageCount}
        />
      )} */}
      <EmailPromptModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onProceed={() => {
          setShowEmailModal(false);
          router.push("/profile");
        }}
        onContinueAnyway={() => {
          setShowEmailModal(false);
          handleSubmit(onSubmit, handleFormError)();
        }}
      />

    </>
  );
};

export default DocumentTranslationCard;
