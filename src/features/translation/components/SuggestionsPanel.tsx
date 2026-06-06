import { useState } from "react";
import { useSuggestionsStore } from "../store/suggestionsStore";
import { useDocumentTranslationStore } from "../store/documentTranslationStore";
import { LoadingSpinner } from "@/features/ui/components/loading";
import { Skeleton } from "@/features/ui/components/ui/skeleton";
import { generateMoreSuggestions, settingUpSuggestions } from "../utils/settingUpSuggestions";
import { useTranslations } from "next-intl";
import { useSuggestionActions } from "../hooks/useSuggestionActions";
import { SuggestionCard } from "./SuggestionCard";
import { SuggestionPreviewDialog } from "./SuggestionPreviewDialog";
import { Suggestion } from "../types/types.Translation";

interface SuggestionsPanelProps {
  isSuggestionsLoading: boolean;
}

const SuggestionSkeletonCards = () => (
  <div className="flex flex-row gap-4 overflow-x-auto pb-2">
    {Array.from({ length: 3 }).map((_, index) => (
      <div
        key={index}
        className="min-w-[320px] max-w-[400px] rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800"
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

const SuggestionsPanel: React.FC<SuggestionsPanelProps> = ({ isSuggestionsLoading }) => {
  const {
    suggestions,
    suggestionsLoading,
    removeSuggestion,
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
    isTranslating,
  } = useDocumentTranslationStore();

  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const t = useTranslations();

  const {
    loadingSuggestionId,
    previewSuggestionId,
    setPreviewSuggestionId,
    exactMatchIds,
    copyToClipboard,
    handleAcceptSuggestion,
    handleTextChange,
  } = useSuggestionActions({
    suggestions,
    translatedMarkdown,
    removeSuggestion,
    updateSuggestionText,
    setSuggestionAccepted,
    focusedSuggestionId,
    setFocusedSuggestionId,
    setTranslatedMarkdown: setTranslatedMarkdownWithoutZoomReset,
    getDocumentState: () => {
      const s = useDocumentTranslationStore.getState();
      return { translatedMarkdown: s.translatedMarkdown, chatId: s.chatId, targetLanguageId: s.currentTargetLanguageId };
    },
  });

  const handleGenerateMore = async () => {
    if (!jobId || hasGeneratedMore) return;
    setIsGeneratingMore(true);
    try {
      await generateMoreSuggestions(jobId);
    } finally {
      setHasGeneratedMore(true);
      setIsGeneratingMore(false);
    }
  };

  if (!jobId) return null;

  const showSkeleton = (isTranslating || isSuggestionsLoading || suggestionsLoading) && suggestions.length === 0;

  return (
    <div className="mt-6">
      <div className="font-semibold mb-2 text-suliko-default-color text-sm md:text-base">
        {t("SuggestionsPanel.title", { default: "Suggestions" })}
      </div>

      {showSkeleton ? (
        <SuggestionSkeletonCards />
      ) : suggestions.length > 0 ? (
        <div className="flex flex-row gap-4 overflow-x-auto pb-2">
          {suggestions.map((s: Suggestion, index: number) => (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              isExactMatch={exactMatchIds.has(s.id)}
              isLoading={loadingSuggestionId === s.id}
              onOpenPreview={() => setPreviewSuggestionId(s.id)}
              onReject={() => removeSuggestion(s.id)}
              onTextChange={(text) => handleTextChange(s.id, text)}
              onMouseEnter={() => {
                if (exactMatchIds.has(s.id)) setHoveredSuggestionOriginalText(s.originalText);
              }}
              onMouseLeave={() => setHoveredSuggestionOriginalText(null)}
              index={index}
              t={t}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="text-center text-muted-foreground">
            {t("SuggestionsPanel.noSuggestions", { default: "No suggestions available." })}
          </div>
          <div className="text-center">
            <button
              type="button"
              onClick={async () => {
                setSuggestionsLoading(true);
                await settingUpSuggestions(jobId);
                setSuggestionsLoading(false);
              }}
              className="text-suliko-default-color font-semibold text-sm md:text-base shadow-sm hover:bg-suliko-default-color/10 transition-all duration-200 focus:outline-none cursor-pointer"
            >
              {t("SuggestionsPanel.retrySuggestions")}
            </button>
          </div>
        </div>
      )}

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
          className="min-w-[320px] max-w-[400px] flex flex-col items-center justify-center bg-white dark:bg-slate-900 border-2 border-dashed border-suliko-default-color/40 rounded-lg p-3 text-suliko-default-color font-semibold text-sm md:text-base shadow-sm hover:bg-suliko-default-color/10 transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isGeneratingMore ? (
            <div className="flex items-center gap-2">
              <LoadingSpinner size="sm" variant="primary" />
              {t("SuggestionsPanel.generating", { default: "Generating more suggestions..." })}
            </div>
          ) : hasGeneratedMore ? (
            <span>{t("SuggestionsPanel.allLoaded", { default: "All suggestions loaded" })}</span>
          ) : (
            <span>{t("SuggestionsPanel.generateMore", { default: "Generate more suggestions" })}</span>
          )}
        </button>
      </div>

      <SuggestionPreviewDialog
        open={!!previewSuggestionId}
        suggestion={suggestions.find((s) => s.id === previewSuggestionId)}
        onOpenChange={(open) => { if (!open) setPreviewSuggestionId(null); }}
        onAccept={async () => {
          if (previewSuggestionId) await handleAcceptSuggestion(previewSuggestionId);
          setPreviewSuggestionId(null);
        }}
        onTextChange={(text) => { if (previewSuggestionId) handleTextChange(previewSuggestionId, text); }}
        copyToClipboard={copyToClipboard}
        t={t}
      />
    </div>
  );
};

export default SuggestionsPanel;
