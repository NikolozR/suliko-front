import { Check, X, Flame, Clock } from "lucide-react";
import { useState } from "react";
import { ApplySuggestionResponse, Suggestion } from "@/features/translation";
import { useChatSuggestionsStore } from "../store/chatSuggestionsStore";
import { useChatEditingStore } from "../store/chatEditingStore";
import { LoadingSpinner } from "@/features/ui/components/loading";
import { Textarea } from "@/features/ui/components/ui/textarea";
import { useTranslations } from "next-intl";

interface ChatSuggestionsPanelProps {
  isSuggestionsLoading: boolean;
}

const ChatSuggestionsPanel: React.FC<ChatSuggestionsPanelProps> = ({
  isSuggestionsLoading,
}) => {
  const {
    suggestions,
    removeSuggestion,
    acceptSuggestion,
    updateSuggestionText,
    setSuggestionAccepted,
    focusedSuggestionId,
    setFocusedSuggestionId,
  } = useChatSuggestionsStore();

  const {
    translatedMarkdown,
    setTranslatedMarkdownWithoutZoomReset,
    jobId,
    currentTargetLanguageId,
  } = useChatEditingStore();
  const { isTranslating } = useChatEditingStore();

  const [loadingSuggestionId, setLoadingSuggestionId] = useState<string | null>(
    null
  );
  const t = useTranslations();

  const handleRemoveSuggestion = (id: string) => {
    removeSuggestion(id);
  };

  const canExactMatch = (suggestion: Suggestion, content: string) => {
    return content.includes(suggestion.originalText);
  };

  const handleAcceptSuggestion = async (id: string) => {
    setLoadingSuggestionId(id);
    try {
      const s = suggestions.find((sg: Suggestion) => sg.id === id)!;
      if (canExactMatch(s, translatedMarkdown)) {
        let newContent = translatedMarkdown;
        newContent = translatedMarkdown.replaceAll(
          s.originalText,
          s.suggestedText
        );
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
          translatedContent: translatedMarkdown,
          suggestionId: id,
          suggestion: s,
          targetLanguageId: currentTargetLanguageId,
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

  const handleSuggestionTextChange = (id: string, newText: string) => {
    updateSuggestionText(id, newText);
  };


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
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold text-foreground" title={s.title}>
                  {s.title}
                </div>
                <div className="flex gap-1 items-center">
                  <span
                    className="p-1.5 rounded-md"
                    title={
                      canExactMatch(s, translatedMarkdown)
                        ? t("SuggestionsPanel.indicatorExact", {
                            default: "Exact match: quick apply",
                          })
                        : t("SuggestionsPanel.indicatorNonExact", {
                            default: "Non-exact: server apply",
                          })
                    }
                  >
                    {canExactMatch(s, translatedMarkdown) ? (
                      <Flame className="w-4 h-4 text-orange-500" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-500" />
                    )}
                  </span>
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
                onChange={(e) => handleSuggestionTextChange(s.id, e.target.value)}
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
        </div>
      )}
      <div className="mt-3" />
    </div>
  );
};

export default ChatSuggestionsPanel;


