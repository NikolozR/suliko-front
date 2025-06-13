import { create } from 'zustand';
import { Suggestion } from '../types/types.Translation';

interface SuggestionsState {
  suggestions: Suggestion[];
  setSuggestions: (suggestions: Suggestion[]) => void;
  removeSuggestion: (id: string) => void;
  acceptSuggestion: (id: string) => void;
  updateSuggestionText: (id: string, newText: string) => void;
  reset: () => void;
}

export const useSuggestionsStore = create<SuggestionsState>()((set) => ({
  suggestions: [],
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
  reset: () => set({ 
    suggestions: [],
  }),
})); 