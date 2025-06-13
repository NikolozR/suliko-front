import { create } from 'zustand';
import { Suggestion } from '../types/types.Translation';

interface SuggestionsState {
  suggestions: Suggestion[];
  setSuggestions: (suggestions: Suggestion[]) => void;
  removeSuggestion: (id: string) => void;
  applySuggestion: (id: string) => void;
  reset: () => void;
}

export const useSuggestionsStore = create<SuggestionsState>()((set) => ({
  suggestions: [],
  setSuggestions: (suggestions) => set({ suggestions }),
  removeSuggestion: (id) => set((state) => ({ 
    suggestions: state.suggestions.filter((s) => s.id !== id) 
  })),
  applySuggestion: (id) => set((state) => ({ 
    suggestions: state.suggestions.filter((s) => s.id !== id) 
  })),
  reset: () => set({ 
    suggestions: [],
  }),
})); 