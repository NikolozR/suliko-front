import { Check, X } from "lucide-react";
import { useState } from "react";
import { Suggestion } from "../types/types.Translation";
import { useSuggestionsStore } from "../store/suggestionsStore";
import { useDocumentTranslationStore } from "../store/documentTranslationStore";
import { LoadingSpinner } from "@/features/ui/components/loading";
import { Textarea } from "@/features/ui/components/ui/textarea";
import {
  generateMoreSuggestions,
  settingUpSuggestions,
} from "../utils/settingUpSuggestions";
import { useTranslations } from "next-intl";

interface SuggestionsPanelProps {
  isSuggestionsLoading: boolean;
}

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
    setFocusedSuggestionId,
    suggestionAccepted,
    setSuggestionAccepted,
    setSuggestionsLoading,
  } = useSuggestionsStore();
  const { translatedMarkdown, setTranslatedMarkdown, jobId } =
    useDocumentTranslationStore();
  const { isTranslating } = useDocumentTranslationStore();
  const [loadingSuggestionId, setLoadingSuggestionId] = useState<string | null>(
    null
  );
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const t = useTranslations();

  const handleRemoveSuggestion = (id: string) => {
    removeSuggestion(id);
  };

  const handleHoverSuggestion = (id: string | null) => {
    setFocusedSuggestionId(id);
  };

  const handleAcceptSuggestion = async (id: string) => {
    setLoadingSuggestionId(id);
    try {
      // const data = await applySuggestion({
      //   translatedContent: translatedMarkdown,
      //   suggestionId: id,
      //   suggestion: suggestions.find((s: Suggestion) => s.id === id)!,
      //   targetLanguageId: currentTargetLanguageId,
      // });
      setTranslatedMarkdown(
        translatedMarkdown.replace(
          suggestions.find((s: Suggestion) => s.id === id)!.originalText,
          suggestions.find((s: Suggestion) => s.id === id)!.suggestedText
        )
      );
      acceptSuggestion(id);
      setSuggestionAccepted(true);
    } catch (error) {
      console.error("Error applying suggestion:", error);
    } finally {
      setLoadingSuggestionId(null);
    }
  };

  const handleSuggestionTextChange = (id: string, newText: string) => {
    updateSuggestionText(id, newText);
  };

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
      <div className="font-semibold mb-2 text-suliko-default-color text-sm md:text-base">
        {t("SuggestionsPanel.title", { default: "Suggestions" })}
      </div>
      {(isTranslating || isSuggestionsLoading) && suggestions.length === 0 ? (
        <div className="flex justify-center items-center py-8">
          <LoadingSpinner size="md" variant="primary" />
        </div>
      ) : suggestions.length > 0 ? (
        <div className="flex flex-row gap-4 overflow-x-auto pb-2">
          {suggestions.map((s: Suggestion) => (
            <div
              key={s.id}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 flex flex-col min-w-[320px] max-w-[400px] gap-2 shadow-sm hover:shadow-md hover:border-suliko-default-color/30 transition-all duration-200"
              onMouseEnter={() => handleHoverSuggestion(s.id)}
              onMouseLeave={() => handleHoverSuggestion(null)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold text-foreground" title={s.title}>
                  {s.title}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleAcceptSuggestion(s.id)}
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
              <div className="text-sm text-foreground mb-2 leading-relaxed">
                {s.description}
              </div>
              <Textarea
                value={s.suggestedText || ""}
                onChange={(e) =>
                  handleSuggestionTextChange(s.id, e.target.value)
                }
                className="text-xs font-mono resize-none min-h-[80px] max-h-[200px]"
                placeholder={t("SuggestionsPanel.editPlaceholder")}
                disabled={loadingSuggestionId === s.id}
              />
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
          className="min-w-[320px] max-w-[400px] flex flex-col items-center justify-center bg-white dark:bg-slate-900 border-2 border-dashed border-suliko-default-color/40 rounded-lg p-3 text-suliko-default-color font-semibold text-sm md:text-base shadow-sm hover:bg-suliko-default-color/10 transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
    </div>
  );
};

export default SuggestionsPanel;
