import { create } from 'zustand';
import { Suggestion } from '@/features/translation';

interface ChatSuggestionsState {
  suggestions: Suggestion[];
  suggestionsLoading: boolean;
  hasGeneratedMore: boolean;
  suggestionAccepted: boolean;
  focusedSuggestionId: string | null;
  setSuggestions: (suggestions: Suggestion[]) => void;
  addSuggestions: (newSuggestions: Suggestion[]) => void;
  removeSuggestion: (id: string) => void;
  acceptSuggestion: (id: string) => void;
  updateSuggestionText: (id: string, newText: string) => void;
  setHasGeneratedMore: (value: boolean) => void;
  setFocusedSuggestionId: (id: string | null) => void;
  setSuggestionAccepted: (value: boolean) => void;
  setSuggestionsLoading: (value: boolean) => void;
  reset: () => void;
}

export const useChatSuggestionsStore = create<ChatSuggestionsState>()((set) => ({
  suggestions: [],
  suggestionsLoading: false,
  hasGeneratedMore: false,
  suggestionAccepted: false,
  focusedSuggestionId: null,
  setSuggestions: (suggestions) => set({ suggestions }),
  addSuggestions: (newSuggestions) => set((state) => {
    const existingIds = new Set(state.suggestions.map(s => s.id));
    const uniqueNewSuggestions = newSuggestions.filter(s => !existingIds.has(s.id));
    const combined = [...state.suggestions, ...uniqueNewSuggestions];
    return { suggestions: combined.slice(0, 10) };
  }),
  removeSuggestion: (id) => set((state) => ({ 
    suggestions: state.suggestions.filter((s) => s.id !== id) 
  })),
  acceptSuggestion: (id) => set((state) => ({ 
    suggestions: state.suggestions.filter((s) => s.id !== id) 
  })),
  updateSuggestionText: (id, newText) => set((state) => ({
    suggestions: state.suggestions.map((s) => 
      s.id === id ? { ...s, suggestedText: newText } : s
    )
  })),
  setHasGeneratedMore: (value) => set({ hasGeneratedMore: value }),
  setFocusedSuggestionId: (id) => set({ focusedSuggestionId: id }),
  setSuggestionAccepted: (value) => set({ suggestionAccepted: value }),
  setSuggestionsLoading: (value) => set({ suggestionsLoading: value }),
  reset: () => set({ 
    suggestions: [],
    hasGeneratedMore: false,
    suggestionAccepted: false,
    focusedSuggestionId: null,
    suggestionsLoading: false,
  }),
}));


