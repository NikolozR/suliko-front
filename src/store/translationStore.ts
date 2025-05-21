import { create } from 'zustand';

interface TranslationState {
  originalText: string;
  translatedText: string;
  setOriginalText: (text: string) => void;
  setTranslatedText: (text: string) => void;
  reset: () => void;
}

export const useTranslationStore = create<TranslationState>()((set) => ({
  originalText: '',
  translatedText: '',
  setOriginalText: (text) => set({ originalText: text }),
  setTranslatedText: (text) => set({ translatedText: text }),
  reset: () => set({ originalText: '', translatedText: '' }),
})); 