import { useState, useMemo } from "react";
import { ApplySuggestionResponse, Suggestion } from "../types/types.Translation";

interface DocumentSnapshot {
  translatedMarkdown: string;
  chatId: string;
  targetLanguageId: number;
}

interface SuggestionActionsConfig {
  suggestions: Suggestion[];
  translatedMarkdown: string;
  removeSuggestion: (id: string) => void;
  updateSuggestionText: (id: string, newText: string) => void;
  setSuggestionAccepted: (val: boolean) => void;
  focusedSuggestionId: string | null;
  setFocusedSuggestionId: (id: string | null) => void;
  setTranslatedMarkdown: (text: string) => void;
  getDocumentState: () => DocumentSnapshot;
}

export function useSuggestionActions({
  suggestions,
  translatedMarkdown,
  removeSuggestion,
  updateSuggestionText,
  setSuggestionAccepted,
  focusedSuggestionId,
  setFocusedSuggestionId,
  setTranslatedMarkdown,
  getDocumentState,
}: SuggestionActionsConfig) {
  const [loadingSuggestionId, setLoadingSuggestionId] = useState<string | null>(null);
  const [previewSuggestionId, setPreviewSuggestionId] = useState<string | null>(null);

  const exactMatchIds = useMemo(
    () => new Set(
      suggestions
        .filter((s) => s.originalText && translatedMarkdown.includes(s.originalText))
        .map((s) => s.id)
    ),
    [suggestions, translatedMarkdown]
  );

  const copyToClipboard = async (text: string) => {
    if (!text) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.cssText = "position:fixed;left:-9999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try { document.execCommand("copy"); } finally { document.body.removeChild(textarea); }
      }
    } catch { /* silent */ }
  };

  const handleAcceptSuggestion = async (id: string) => {
    setLoadingSuggestionId(id);
    try {
      const s = suggestions.find((sg) => sg.id === id)!;
      const { translatedMarkdown: currentContent, chatId, targetLanguageId } = getDocumentState();

      if (currentContent.includes(s.originalText)) {
        setTranslatedMarkdown(currentContent.replaceAll(s.originalText, s.suggestedText));
        removeSuggestion(id);
        setSuggestionAccepted(true);
        if (focusedSuggestionId === id) setFocusedSuggestionId(null);
      } else {
        const { applySuggestion } = await import(
          "@/features/translation/services/suggestionsService"
        );
        const data: ApplySuggestionResponse = await applySuggestion({
          chatId,
          outputLanguageId: targetLanguageId,
          targetLanguageId,
          editedOriginalText: s.originalText,
          editedSuggestedText: s.suggestedText,
          suggestion: s,
          currentDocumentContent: currentContent,
        });
        if (data.success) {
          setTranslatedMarkdown(data.updatedContent);
          removeSuggestion(id);
          setSuggestionAccepted(true);
          if (focusedSuggestionId === id) setFocusedSuggestionId(null);
        }
      }
    } catch (error) {
      console.error("Error applying suggestion:", error);
    } finally {
      setLoadingSuggestionId(null);
    }
  };

  const handleTextChange = (id: string, newText: string) => {
    updateSuggestionText(id, newText);
  };

  return {
    loadingSuggestionId,
    previewSuggestionId,
    setPreviewSuggestionId,
    exactMatchIds,
    copyToClipboard,
    handleAcceptSuggestion,
    handleTextChange,
  };
}
