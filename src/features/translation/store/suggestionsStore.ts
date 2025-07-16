import { create } from 'zustand';
import { Suggestion } from '../types/types.Translation';

interface SuggestionsState {
  suggestions: Suggestion[];
  hasGeneratedMore: boolean;
  setSuggestions: (suggestions: Suggestion[]) => void;
  removeSuggestion: (id: string) => void;
  acceptSuggestion: (id: string) => void;
  updateSuggestionText: (id: string, newText: string) => void;
  setHasGeneratedMore: (value: boolean) => void;
  reset: () => void;
}

export const useSuggestionsStore = create<SuggestionsState>()((set) => ({
  suggestions: [],
  hasGeneratedMore: false,
  setSuggestions: (suggestions) => set({ suggestions }),
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
  reset: () => set({ 
    suggestions: [],
    hasGeneratedMore: false,
  }),
})); 