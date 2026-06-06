import { useChatSuggestionsStore } from "../store/chatSuggestionsStore";
import { useChatEditingStore } from "../store/chatEditingStore";
import { LoadingSpinner } from "@/features/ui/components/loading";
import { useTranslations } from "next-intl";
import { useSuggestionActions } from "@/features/translation/hooks/useSuggestionActions";
import { SuggestionCard } from "@/features/translation/components/SuggestionCard";
import { SuggestionPreviewDialog } from "@/features/translation/components/SuggestionPreviewDialog";
import { Suggestion } from "@/features/translation";

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
    isTranslating,
  } = useChatEditingStore();

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

  if (!jobId) return null;

  const showSpinner = (isTranslating || isSuggestionsLoading) && suggestions.length === 0;

  return (
    <div className="mt-6">
      <div className="font-semibold mb-2 text-suliko-default-color text-sm md:text-base">
        {t("SuggestionsPanel.title", { default: "Suggestions" })}
      </div>

      {showSpinner ? (
        <div className="flex justify-center items-center py-8">
          <LoadingSpinner size="md" variant="primary" />
        </div>
      ) : suggestions.length > 0 ? (
        <div className="flex flex-row gap-4 overflow-x-auto pb-2">
          {suggestions.map((s: Suggestion) => (
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
              t={t}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground">
          {t("SuggestionsPanel.noSuggestions", { default: "No suggestions available." })}
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
