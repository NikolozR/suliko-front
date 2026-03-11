import { Check, X, Flame, Clock, Copy } from "lucide-react";
import { useState } from "react";
import { ApplySuggestionResponse, Suggestion } from "@/features/translation";
import { useChatSuggestionsStore } from "../store/chatSuggestionsStore";
import { useChatEditingStore } from "../store/chatEditingStore";
import { LoadingSpinner } from "@/features/ui/components/loading";
import { Textarea } from "@/features/ui/components/ui/textarea";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/features/ui/components/ui/dialog";
import { Button } from "@/features/ui/components/ui/button";

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
    setHoveredSuggestionOriginalText,
  } = useChatSuggestionsStore();

  const {
    translatedMarkdown,
    setTranslatedMarkdownWithoutZoomReset,
    jobId,
    currentTargetLanguageId,
    chatId,
  } = useChatEditingStore();
  const { isTranslating } = useChatEditingStore();

  const [loadingSuggestionId, setLoadingSuggestionId] = useState<string | null>(null);
  const [previewSuggestionId, setPreviewSuggestionId] = useState<string | null>(null);
  const t = useTranslations();

  const handleRemoveSuggestion = (id: string) => {
    removeSuggestion(id);
  };

  const canExactMatch = (suggestion: Suggestion, content: string) => {
    return content.includes(suggestion.originalText);
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (!text) return;
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
          document.execCommand("copy");
        } finally {
          document.body.removeChild(textarea);
        }
      }
    } catch { }
  };

  const handleAcceptSuggestion = async (id: string) => {
    setLoadingSuggestionId(id);
    try {
      const s = suggestions.find((sg: Suggestion) => sg.id === id)!;
      const currentContent = useChatEditingStore.getState().translatedMarkdown;

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
              onMouseEnter={() => {
                if (canExactMatch(s, translatedMarkdown)) {
                  setHoveredSuggestionOriginalText(s.originalText);
                }
              }}
              onMouseLeave={() => {
                setHoveredSuggestionOriginalText(null);
              }}
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
                    onClick={() => setPreviewSuggestionId(s.id)}
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

      {/* Preview modal — opens when clicking ✓ on any suggestion */}
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
                  title="Copy"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
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
                  title="Copy"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </button>
              </div>
              <Textarea
                value={suggestions.find((sg) => sg.id === previewSuggestionId)?.suggestedText || ""}
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

export default ChatSuggestionsPanel;
