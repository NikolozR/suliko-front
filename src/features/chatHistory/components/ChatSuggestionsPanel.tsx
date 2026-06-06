import { Check, X, Copy, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { Suggestion } from "@/features/translation";
import { useChatSuggestionsStore } from "../store/chatSuggestionsStore";
import { useChatEditingStore } from "../store/chatEditingStore";
import { LoadingSpinner } from "@/features/ui/components/loading";
import { useTranslations } from "next-intl";
import { useSuggestionActions } from "@/features/translation/hooks/useSuggestionActions";
import { SuggestionPreviewDialog } from "@/features/translation/components/SuggestionPreviewDialog";

interface ChatSuggestionsPanelProps {
  isSuggestionsLoading: boolean;
}

const ChatSuggestionsPanel: React.FC<ChatSuggestionsPanelProps> = ({ isSuggestionsLoading }) => {
  const {
    suggestions,
    removeSuggestion,
    updateSuggestionText,
    setSuggestionAccepted,
    focusedSuggestionId,
    setFocusedSuggestionId,
    setHoveredSuggestionOriginalText,
  } = useChatSuggestionsStore();

  const {
    translatedMarkdown,
    setTranslatedMarkdownWithoutZoomReset,
    jobId,
    currentTargetLanguageId,
    chatId,
    isTranslating,
  } = useChatEditingStore();

  const [isGettingSuggestions, setIsGettingSuggestions] = useState(false);
  const [suggestionsNotAvailable, setSuggestionsNotAvailable] = useState(false);
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
      const s = useChatEditingStore.getState();
      return { translatedMarkdown: s.translatedMarkdown, chatId: s.chatId, targetLanguageId: s.currentTargetLanguageId };
    },
  });

  const handleGetSuggestions = async () => {
    if (!jobId || isGettingSuggestions) return;
    setIsGettingSuggestions(true);
    setSuggestionsNotAvailable(false);
    try {
      const [{ settingUpChatSuggestions }, { regenerateSuggestions }] = await Promise.all([
        import("@/features/chatHistory/utils/settingUpSuggestions"),
        import("@/features/translation/services/suggestionsService"),
      ]);

      const fetchResult = await settingUpChatSuggestions(jobId);
      if (fetchResult === "success") return;

      if (!chatId || !currentTargetLanguageId) {
        setSuggestionsNotAvailable(true);
        return;
      }

      try {
        await regenerateSuggestions({
          jobId,
          chatId,
          targetLanguageId: currentTargetLanguageId,
          outputLanguageId: currentTargetLanguageId,
        });
      } catch {
        setSuggestionsNotAvailable(true);
        return;
      }

      await settingUpChatSuggestions(jobId, { waitForNew: true });
    } catch {
      // suggestions remain empty — user can retry
    } finally {
      setIsGettingSuggestions(false);
    }
  };

  if (!jobId) return null;

  const showSpinner = (isTranslating || isSuggestionsLoading) && suggestions.length === 0;

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

      {showSpinner ? (
        <div className="flex justify-center items-center py-8">
          <LoadingSpinner size="md" variant="primary" />
        </div>
      ) : suggestions.length > 0 ? (
        <div className="flex flex-col gap-4 pb-2 sm:flex-row sm:overflow-x-auto">
          {suggestions.map((s: Suggestion) => (
            <div
              key={s.id}
              onMouseEnter={() => {
                if (exactMatchIds.has(s.id)) setHoveredSuggestionOriginalText(s.originalText);
              }}
              onMouseLeave={() => setHoveredSuggestionOriginalText(null)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 flex flex-col w-full sm:min-w-[260px] sm:max-w-[360px] gap-2 shadow-sm hover:shadow-md hover:border-suliko-default-color/30 transition-[box-shadow,border-color] duration-200"
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
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            {suggestionsNotAvailable
              ? t("SuggestionsPanel.suggestionsNotAvailable", { default: "Suggestions are not available for this document." })
              : t("SuggestionsPanel.noSuggestions", { default: "No suggestions available." })
            }
          </p>
          {!suggestionsNotAvailable && (
            <button
              type="button"
              onClick={handleGetSuggestions}
              disabled={isGettingSuggestions}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGettingSuggestions ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("SuggestionsPanel.generating", { default: "Generating..." })}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {t("SuggestionsPanel.getSuggestions", { default: "Get Suggestions" })}
                </>
              )}
            </button>
          )}
        </div>
      )}

      <div className="mt-3" />

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

export default ChatSuggestionsPanel;
