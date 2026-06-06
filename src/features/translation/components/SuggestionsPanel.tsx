import { Check, X, Copy } from "lucide-react";
import { useState } from "react";
import { Suggestion } from "../types/types.Translation";
import { useSuggestionsStore } from "../store/suggestionsStore";
import { useDocumentTranslationStore } from "../store/documentTranslationStore";
import { LoadingSpinner } from "@/features/ui/components/loading";
import { Skeleton } from "@/features/ui/components/ui/skeleton";
import { generateMoreSuggestions, settingUpSuggestions } from "../utils/settingUpSuggestions";
import { useTranslations } from "next-intl";
import { useSuggestionActions } from "../hooks/useSuggestionActions";
import { SuggestionPreviewDialog } from "./SuggestionPreviewDialog";

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
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="font-semibold text-suliko-default-color text-sm md:text-base">
          {t("SuggestionsPanel.title", { default: "Suggestions" })}
        </div>
        {suggestions.some((s: Suggestion) => exactMatchIds.has(s.id)) && (
          <button
            type="button"
            onClick={async () => {
              for (const s of suggestions.filter((s: Suggestion) => exactMatchIds.has(s.id))) {
                await handleAcceptSuggestion(s.id);
              }
            }}
            className="text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors whitespace-nowrap"
          >
            {t("SuggestionsPanel.acceptAllInstant", { default: "Accept all Instant" })}
          </button>
        )}
      </div>

      {showSkeleton ? (
        <SuggestionSkeletonCards />
      ) : suggestions.length > 0 ? (
        <div className="flex flex-col gap-4 pb-2 sm:flex-row sm:overflow-x-auto">
          {suggestions.map((s: Suggestion, index: number) => (
            <div
              key={s.id}
              onMouseEnter={() => {
                if (exactMatchIds.has(s.id)) setHoveredSuggestionOriginalText(s.originalText);
              }}
              onMouseLeave={() => setHoveredSuggestionOriginalText(null)}
              className="animate-slideUpScale bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 flex flex-col w-full sm:min-w-[260px] sm:max-w-[360px] gap-2 shadow-sm hover:shadow-md hover:border-suliko-default-color/30 transition-all duration-200"
              style={{ animationDelay: `${Math.min(index * 70, 280)}ms` }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold text-foreground" title={s.title}>{s.title}</div>
                <div className="flex gap-1 items-center">
                  {exactMatchIds.has(s.id) ? (
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
                  <button
                    type="button"
                    onClick={() => setPreviewSuggestionId(s.id)}
                    disabled={loadingSuggestionId === s.id}
                    className="p-1.5 rounded-md hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                    title={t("SuggestionsPanel.accept")}
                  >
                    {loadingSuggestionId === s.id
                      ? <LoadingSpinner size="sm" variant="primary" />
                      : <Check className="w-4 cursor-pointer h-4 text-green-600 dark:text-green-500 group-hover:text-green-700 dark:group-hover:text-green-400" />
                    }
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSuggestion(s.id)}
                    disabled={loadingSuggestionId === s.id}
                    className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                    title={t("SuggestionsPanel.reject")}
                  >
                    <X className="w-4 cursor-pointer h-4 text-red-500 dark:text-red-400 group-hover:text-red-600 dark:group-hover:text-red-300" />
                  </button>
                </div>
              </div>
              <div className="text-sm text-foreground mb-1 leading-relaxed">{s.description}</div>
              <div className="mt-auto space-y-1">
                <div className="text-xs rounded-md bg-background border border-border p-2 space-y-1 font-mono leading-relaxed">
                  <div className="line-clamp-2 text-red-600 dark:text-red-400 line-through opacity-80 select-none">
                    {s.originalText.slice(0, 120)}{s.originalText.length > 120 ? "…" : ""}
                  </div>
                  <div
                    contentEditable={loadingSuggestionId !== s.id}
                    suppressContentEditableWarning
                    onBlur={(e) => handleTextChange(s.id, e.currentTarget.textContent || "")}
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
          disabled={isGeneratingMore || !jobId || (suggestions.length === 0 && !suggestionAccepted) || hasGeneratedMore}
          className="w-full sm:min-w-[260px] sm:max-w-[360px] flex flex-col items-center justify-center bg-white dark:bg-slate-900 border-2 border-dashed border-suliko-default-color/40 rounded-lg p-3 text-suliko-default-color font-semibold text-sm md:text-base shadow-sm hover:bg-suliko-default-color/10 transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
