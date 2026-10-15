import { useState, useMemo } from "react";
import { getSuggestionTarget, useSuggestionTarget } from "@/features/editor/suggestionTarget";
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

  // In the Word editor a suggestion is found in its document (a quote that runs across bold
  // or a link still matches); in the simple editor it is found in the HTML.
  const wordEditor = useSuggestionTarget();
  const exactMatchIds = useMemo(
    () => new Set(
      suggestions
        .filter((s) => s.originalText && (wordEditor ? wordEditor.has(s.originalText) : translatedMarkdown.includes(s.originalText)))
        .map((s) => s.id)
    ),
    [suggestions, translatedMarkdown, wordEditor]
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

      // The Word editor changes its own document (the page hears of it from the editor), which
      // keeps what the person has done to its layout. A quote it cannot find (the model may
      // know where it is) goes on to the ways below, and the document is opened again from the
      // result.
      const word = getSuggestionTarget();
      if (word && word.replace(s.originalText, s.suggestedText) > 0) {
        removeSuggestion(id);
        setSuggestionAccepted(true);
        if (focusedSuggestionId === id) setFocusedSuggestionId(null);
        return;
      }

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
