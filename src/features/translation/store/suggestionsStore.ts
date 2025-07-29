import { create } from 'zustand';
import { Suggestion } from '../types/types.Translation';

interface SuggestionsState {
  suggestions: Suggestion[];
  hasGeneratedMore: boolean;
  setSuggestions: (suggestions: Suggestion[]) => void;
  addSuggestions: (newSuggestions: Suggestion[]) => void;
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
  addSuggestions: (newSuggestions) => set((state) => {
    // Filter out duplicates based on id and limit to maximum 10 suggestions
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
  reset: () => set({ 
    suggestions: [],
    hasGeneratedMore: false,
  }),
})); 