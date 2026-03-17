import { Check, X, Copy } from "lucide-react";
import { useState } from "react";
import {
  ApplySuggestionResponse,
  Suggestion,
} from "../types/types.Translation";
import { useSuggestionsStore } from "../store/suggestionsStore";
import { useDocumentTranslationStore } from "../store/documentTranslationStore";
import { LoadingSpinner } from "@/features/ui/components/loading";
import { Textarea } from "@/features/ui/components/ui/textarea";
import {
  generateMoreSuggestions,
  settingUpSuggestions,
} from "../utils/settingUpSuggestions";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/features/ui/components/ui/dialog";
import { Button } from "@/features/ui/components/ui/button";
import { Skeleton } from "@/features/ui/components/ui/skeleton";

interface SuggestionsPanelProps {
  isSuggestionsLoading: boolean;
}

const SuggestionSkeletonCards = () => (
  <div className="flex flex-col gap-4 pb-2 sm:flex-row sm:overflow-x-auto">
    {Array.from({ length: 3 }).map((_, index) => (
      <div
        key={index}
        className="w-full sm:min-w-[260px] sm:max-w-[360px] rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800"
      >
        <div className="mb-3 flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="mb-2 h-4 w-5/6" />
        <Skeleton className="h-24 w-full" />
      </div>
    ))}
  </div>
);

const SuggestionsPanel: React.FC<SuggestionsPanelProps> = ({
  isSuggestionsLoading,
}) => {
  const {
    suggestions,
    removeSuggestion,
    acceptSuggestion,
    updateSuggestionText,
    hasGeneratedMore,
    setHasGeneratedMore,
    suggestionAccepted,
    setSuggestionAccepted,
    setSuggestionsLoading,
    focusedSuggestionId,
    setFocusedSuggestionId,
    setHoveredSuggestionOriginalText,
  } = useSuggestionsStore();
  const {
    translatedMarkdown,
    setTranslatedMarkdownWithoutZoomReset,
    jobId,
    chatId,
    currentTargetLanguageId,
  } = useDocumentTranslationStore();
  const { isTranslating } = useDocumentTranslationStore();
  const [loadingSuggestionId, setLoadingSuggestionId] = useState<string | null>(
    null
  );
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  // const [previewBackup, setPreviewBackup] = useState<string | null>(null);
  const t = useTranslations();
  const [previewSuggestionId, setPreviewSuggestionId] = useState<string | null>(
    null
  );

  const handleRemoveSuggestion = (id: string) => {
    removeSuggestion(id);
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (!text) return;
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
          document.execCommand('copy');
        } finally {
          document.body.removeChild(textarea);
        }
      }
    } catch { }
  };

  const canExactMatch = (suggestion: Suggestion, content: string) => {
    return content.includes(suggestion.originalText);
  };

  // const handleAcceptSuggestion = async (id: string) => {
  const handleAcceptSuggestion = async (id: string) => {
    setLoadingSuggestionId(id);
    try {
      const s = suggestions.find((sg: Suggestion) => sg.id === id)!;
      const currentContent = useDocumentTranslationStore.getState().translatedMarkdown;

      if (canExactMatch(s, currentContent)) {
        const newContent = currentContent.replaceAll(s.originalText, s.suggestedText);
        setTranslatedMarkdownWithoutZoomReset(newContent);
        acceptSuggestion(id);
        setSuggestionAccepted(true);
        if (focusedSuggestionId === id) {
          setFocusedSuggestionId(null);
        }
      } else {
        const { applySuggestion } = await import(
          "@/features/translation/services/suggestionsService"
        );
        const data: ApplySuggestionResponse = await applySuggestion({
          chatId: chatId,
          outputLanguageId: currentTargetLanguageId,
          editedOriginalText: s.originalText,
          editedSuggestedText: s.suggestedText,
          suggestion: s,
          targetLanguageId: currentTargetLanguageId,
          currentDocumentContent: currentContent,
        });
        if (data.success) {
          setTranslatedMarkdownWithoutZoomReset(data.updatedContent);
          acceptSuggestion(id);
          setSuggestionAccepted(true);
          if (focusedSuggestionId === id) {
            setFocusedSuggestionId(null);
          }
        } else {
          console.error("Failed to apply suggestion:", data.errorMessage);
        }
      }
    } catch (error) {
      console.error("Error applying suggestion:", error);
    } finally {
      setLoadingSuggestionId(null);
    }
  };
  //   setLoadingSuggestionId(id);
  //   try {
  //     const s = suggestions.find((sg: Suggestion) => sg.id === id)!;
  //     if (canExactMatch(s, translatedMarkdown)) {
  //       let newContent = translatedMarkdown;
  //       newContent = translatedMarkdown.replaceAll(
  //         s.originalText,
  //         s.suggestedText
  //       );
  //       setTranslatedMarkdownWithoutZoomReset(newContent);
  //       acceptSuggestion(id);
  //       setSuggestionAccepted(true);
  //       if (focusedSuggestionId === id) {
  //         setFocusedSuggestionId(null);
  //         // setPreviewBackup(null);
  //       }
  //     } else {
  //       const { applySuggestion } = await import(
  //         "@/features/translation/services/suggestionsService"
  //       );
  //       console.log("We Are Here");
  //       const data: ApplySuggestionResponse = await applySuggestion({
  //         chatId: chatId,
  //         outputLanguageId: currentTargetLanguageId,
  //         editedOriginalText: s.originalText,
  //         editedSuggestedText: s.suggestedText,
  //         suggestion: s,
  //         targetLanguageId: currentTargetLanguageId,
  //         currentDocumentContent: translatedMarkdown,
  //       });
  //       console.log("We Are Here 2", data);
  //       if (data.success) {
  //         setTranslatedMarkdownWithoutZoomReset(data.updatedContent);
  //         acceptSuggestion(id);
  //         setSuggestionAccepted(true);
  //         if (focusedSuggestionId === id) {
  //           setFocusedSuggestionId(null);
  //           // setPreviewBackup(null);
  //         }
  //       } else {
  //         console.error("Failed to apply suggestion:", data.errorMessage);
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error applying suggestion:", error);
  //   } finally {
  //     setLoadingSuggestionId(null);
  //   }
  // };

  const handleSuggestionTextChange = (id: string, newText: string) => {
    updateSuggestionText(id, newText);
  };

  // const handleTogglePreview = (id: string) => {
  //   if (focusedSuggestionId === id) {
  //     // Restore original content when turning preview off
  //     if (previewBackup !== null) {
  //       setTranslatedMarkdown(previewBackup);
  //     }
  //     setFocusedSuggestionId(null);
  //     setPreviewBackup(null);
  //   } else {
  //     setFocusedSuggestionId(id);
  //     const suggestion = suggestions.find((s: Suggestion) => s.id === id)!;
  //     const baseContent =
  //       previewBackup !== null ? previewBackup : translatedMarkdown;
  //     if (canExactMatch(suggestion, baseContent)) {
  //       if (previewBackup === null) {
  //         setPreviewBackup(translatedMarkdown);
  //       }

  //       // Use the same robust replacement logic for preview
  //       let highlighted = baseContent;

  //       // 1. Try direct replacement first
  //       if (baseContent.includes(suggestion.originalText)) {
  //         highlighted = baseContent.replaceAll(
  //           suggestion.originalText,
  //           `<span class="bg-yellow-200">${suggestion.suggestedText}</span>`
  //         );
  //       } else {
  //         // 2. Try normalized whitespace replacement
  //         const normalizeWhitespace = (text: string) =>
  //           text.replace(/\s+/g, " ").trim();
  //         const normalizedOriginal = normalizeWhitespace(
  //           suggestion.originalText
  //         );

  //         // Find the original text in the content with different spacing
  //         const regex = new RegExp(
  //           normalizedOriginal
  //             .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  //             .replace(/\s+/g, "\\s+"),
  //           "gi"
  //         );

  //         if (regex.test(baseContent)) {
  //           highlighted = baseContent.replace(
  //             regex,
  //             `<span class="bg-yellow-200">${suggestion.suggestedText}</span>`
  //           );
  //         } else {
  //           // 3. Last resort: try case-insensitive replacement
  //           const caseInsensitiveRegex = new RegExp(
  //             suggestion.originalText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  //             "gi"
  //           );
  //           highlighted = baseContent.replace(
  //             caseInsensitiveRegex,
  //             `<span class="bg-yellow-200">${suggestion.suggestedText}</span>`
  //           );
  //         }
  //       }

  //       setTranslatedMarkdown(highlighted);
  //     } else {
  //       // cannot preview if not exact match; revert focus state
  //       setFocusedSuggestionId(null);
  //     }
  //   }
  // };

  const handleGenerateMore = async () => {
    if (!jobId || hasGeneratedMore) return;

    setIsGeneratingMore(true);
    try {
      await generateMoreSuggestions(jobId);
    } catch (error) {
      console.error("Error generating more suggestions:", error);
    } finally {
      // Always disable after one use - no more suggestions available from backend
      setHasGeneratedMore(true);
      setIsGeneratingMore(false);
    }
  };

  // If there's no jobId, don't show anything
  if (!jobId) return null;
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="font-semibold text-suliko-default-color text-sm md:text-base">
          {t("SuggestionsPanel.title", { default: "Suggestions" })}
        </div>
        {suggestions.some((s: Suggestion) => canExactMatch(s, translatedMarkdown)) && (
          <button
            type="button"
            onClick={async () => {
              const instantSuggestions = suggestions.filter((s: Suggestion) => canExactMatch(s, translatedMarkdown));
              for (const s of instantSuggestions) {
                await handleAcceptSuggestion(s.id);
              }
            }}
            className="text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors whitespace-nowrap"
          >
            {t("SuggestionsPanel.acceptAllInstant", { default: "Accept all Instant" })}
          </button>
        )}
      </div>
      {(isTranslating || isSuggestionsLoading) && suggestions.length === 0 ? (
        <SuggestionSkeletonCards />
      ) : suggestions.length > 0 ? (
        <div className="flex flex-col gap-4 pb-2 sm:flex-row sm:overflow-x-auto">
          {suggestions.map((s: Suggestion, index: number) => (
            <div
              key={s.id}
              onMouseEnter={() => {
                if (canExactMatch(s, translatedMarkdown)) {
                  setHoveredSuggestionOriginalText(s.originalText);
                }
              }}
              onMouseLeave={() => {
                setHoveredSuggestionOriginalText(null);
              }}
              className="animate-slideUpScale bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 flex flex-col w-full sm:min-w-[260px] sm:max-w-[360px] gap-2 shadow-sm hover:shadow-md hover:border-suliko-default-color/30 transition-all duration-200"
              style={{ animationDelay: `${Math.min(index * 70, 280)}ms` }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold text-foreground" title={s.title}>
                  {s.title}
                </div>
                <div className="flex gap-1 items-center">
                  {/* Instant / Review badge */}
                  {canExactMatch(s, translatedMarkdown) ? (
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 whitespace-nowrap"
                      title={t("SuggestionsPanel.indicatorExact", { default: "Quick apply" })}
                    >
                      {t("SuggestionsPanel.instant", { default: "Instant" })}
                    </span>
                  ) : (
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 whitespace-nowrap"
                      title={t("SuggestionsPanel.indicatorNonExact", { default: "Server apply" })}
                    >
                      {t("SuggestionsPanel.review", { default: "Review" })}
                    </span>
                  )}
                  {/* <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePreview(s.id);
                    }}
                    disabled={
                      loadingSuggestionId === s.id ||
                      !canExactMatch(s, translatedMarkdown)
                    }
                    className={`p-1.5 rounded-md transition-colors group disabled:opacity-50 disabled:cursor-not-allowed ${
                      focusedSuggestionId === s.id
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    }`}
                    title={
                      focusedSuggestionId === s.id
                        ? t("SuggestionsPanel.hidePreview")
                        : t("SuggestionsPanel.showPreview")
                    }
                  >
                    {loadingSuggestionId === s.id ||
                    !canExactMatch(s, translatedMarkdown) ? (
                      <Eye className="w-4 cursor-not-allowed h-4 text-blue-600 dark:text-blue-500" />
                    ) : focusedSuggestionId === s.id ? (
                      <EyeOff className="w-4 cursor-pointer h-4 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300" />
                    ) : (
                      <Eye className="w-4 cursor-pointer h-4 text-blue-600 dark:text-blue-500 group-hover:text-blue-700 dark:group-hover:text-blue-400" />
                    )}
                  </button> */}
                  <button
                    type="button"
                    onClick={() => {
                      // Always open preview for any suggestion type
                      setPreviewSuggestionId(s.id);
                    }}
                    disabled={loadingSuggestionId === s.id}
                    className="p-1.5 rounded-md hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                    title={t("SuggestionsPanel.accept")}
                  >
                    {loadingSuggestionId === s.id ? (
                      <LoadingSpinner size="sm" variant="primary" />
                    ) : (
                      <Check className="w-4 cursor-pointer h-4 text-green-600 dark:text-green-500 group-hover:text-green-700 dark:group-hover:text-green-400" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveSuggestion(s.id)}
                    disabled={loadingSuggestionId === s.id}
                    className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                    title={t("SuggestionsPanel.reject")}
                  >
                    <X className="w-4 cursor-pointer h-4 text-red-500 dark:text-red-400 group-hover:text-red-600 dark:group-hover:text-red-300" />
                  </button>
                </div>
              </div>
              <div className="text-sm text-foreground mb-1 leading-relaxed">
                {s.description}
              </div>
              <div className="mt-auto space-y-1">
                {/* Diff: red = original (read-only), green = suggested (editable) */}
                <div className="text-xs rounded-md bg-background border border-border p-2 space-y-1 font-mono leading-relaxed">
                  <div className="line-clamp-2 text-red-600 dark:text-red-400 line-through opacity-80 select-none">
                    {s.originalText.slice(0, 120)}{s.originalText.length > 120 ? "…" : ""}
                  </div>
                  <div
                    contentEditable={loadingSuggestionId !== s.id}
                    suppressContentEditableWarning
                    onBlur={(e) => handleSuggestionTextChange(s.id, e.currentTarget.textContent || "")}
                    className="text-green-700 dark:text-green-400 outline-none focus:ring-1 focus:ring-green-500/40 rounded px-0.5 whitespace-pre-wrap break-words min-h-[1.2em] cursor-text"
                  >
                    {s.suggestedText}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="text-center text-muted-foreground">
            {t("SuggestionsPanel.noSuggestions", {
              default: "No suggestions available.",
            })}
          </div>
          <div className="text-center text-muted-foreground">
            <button
              type="button"
              onClick={() => {
                setSuggestionsLoading(true);
                settingUpSuggestions(jobId);
              }}
              className="text-suliko-default-color font-semibold text-sm md:text-base shadow-sm hover:bg-suliko-default-color/10 transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {t("SuggestionsPanel.retrySuggestions")}
            </button>
          </div>
        </div>
      )}
      {/* Generate More Suggestions Button */}
      <div className="mt-3 flex justify-start">
        <button
          type="button"
          onClick={handleGenerateMore}
          disabled={
            isGeneratingMore ||
            !jobId ||
            (suggestions.length === 0 && !suggestionAccepted) ||
            hasGeneratedMore
          }
          className="w-full sm:min-w-[260px] sm:max-w-[360px] flex flex-col items-center justify-center bg-white dark:bg-slate-900 border-2 border-dashed border-suliko-default-color/40 rounded-lg p-3 text-suliko-default-color font-semibold text-sm md:text-base shadow-sm hover:bg-suliko-default-color/10 transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isGeneratingMore ? (
            <div className="flex items-center gap-2">
              <LoadingSpinner size="sm" variant="primary" />
              {t("SuggestionsPanel.generating", {
                default: "Generating more suggestions...",
              })}
            </div>
          ) : hasGeneratedMore ? (
            <span>
              {t("SuggestionsPanel.allLoaded", {
                default: "All suggestions loaded",
              })}
            </span>
          ) : (
            <span>
              {t("SuggestionsPanel.generateMore", {
                default: "Generate more suggestions",
              })}
            </span>
          )}
        </button>
      </div>

      {/* Preview Modal for exact-match suggestions (flame icon) */}
      <Dialog
        open={!!previewSuggestionId}
        onOpenChange={(open) => {
          if (!open) setPreviewSuggestionId(null);
        }}
      >
        <DialogContent className="w-full sm:max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">
              {t("SuggestionsPanel.previewTitle", { default: "Suggestion Preview" })}
            </DialogTitle>
          </DialogHeader>

          {/* Two-column preview with headers and actions */}
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 md:gap-4">
            {/* Original */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Original
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const text = suggestions.find((sg) => sg.id === previewSuggestionId)?.originalText || "";
                    copyToClipboard(text);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title={"Copy"}
                >
                  <Copy className="h-3.5 w-3.5" />
                  {"Copy"}
                </button>
              </div>
              <div className="rounded-md border bg-background p-3 h-72 md:h-96 overflow-auto whitespace-pre-wrap text-sm font-mono">
                {suggestions.find((sg) => sg.id === previewSuggestionId)?.originalText || ""}
              </div>
            </div>

            {/* Suggested */}
            <div className="mt-4 md:mt-0">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Suggestion
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const text = suggestions.find((sg) => sg.id === previewSuggestionId)?.suggestedText || "";
                    copyToClipboard(text);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title={"Copy"}
                >
                  <Copy className="h-3.5 w-3.5" />
                  {"Copy"}
                </button>
              </div>
              <Textarea
                value={
                  (suggestions.find((sg) => sg.id === previewSuggestionId)?.suggestedText) || ""
                }
                onChange={(e) => {
                  if (previewSuggestionId) {
                    handleSuggestionTextChange(previewSuggestionId, e.target.value);
                  }
                }}
                className="text-sm font-mono h-72 md:h-96 resize-none"
                placeholder="Edit suggestion..."
              />
            </div>
          </div>

          <DialogFooter className="mt-4 flex !justify-center gap-2">
            <Button
              onClick={() => {
                if (previewSuggestionId) {
                  handleAcceptSuggestion(previewSuggestionId);
                }
                setPreviewSuggestionId(null);
              }}
              className="cursor-pointer"
            >
              {t("SuggestionsPanel.accept")}
            </Button>
            <Button
              onClick={() => setPreviewSuggestionId(null)}
              variant="outline"
              className="cursor-pointer"
            >
              {t("SuggestionsPanel.cancel", { default: "Cancel" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuggestionsPanel;
