import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface TextTranslationState {
  currentTextValue: string;
  originalText: string;
  translatedText: string;
  currentSourceLanguageId: number;
  currentTargetLanguageId: number;
  originalTargetLanguageId: number;
  sourceLanguageId: number;
  setCurrentSourceLanguageId: (languageId: number) => void;
  setCurrentTargetLanguageId: (languageId: number) => void;
  setOriginalTargetLanguageId: (languageId: number) => void;
  setSourceLanguageId: (languageId: number) => void;
  setCurrentTextValue: (text: string) => void;
  setOriginalText: (text: string) => void;
  setTranslatedText: (text: string) => void;
  reset: () => void;
}

export const useTextTranslationStore = create<TextTranslationState>()(
  persist(
    (set) => ({
      currentTextValue: '',
      originalText: '',
      translatedText: '',
      currentSourceLanguageId: 0,
      currentTargetLanguageId: 2,
      originalTargetLanguageId: 2,
      sourceLanguageId: 0,
      setCurrentSourceLanguageId: (languageId) => set({ currentSourceLanguageId: languageId }),
      setCurrentTargetLanguageId: (languageId) => set({ currentTargetLanguageId: languageId }),
      setOriginalTargetLanguageId: (languageId) => set({ originalTargetLanguageId: languageId }),
      setSourceLanguageId: (languageId) => set({ sourceLanguageId: languageId }),
      setCurrentTextValue: (text) => set({ currentTextValue: text }),
      setOriginalText: (text) => set({ originalText: text }),
      setTranslatedText: (text) => set({ translatedText: text }),
      reset: () => set({ 
        originalText: '', 
        translatedText: '', 
        currentTextValue: '',
        currentSourceLanguageId: 0,
        currentTargetLanguageId: 2,
        originalTargetLanguageId: 2,
        sourceLanguageId: 0
      }),
    }),
    {
      name: 'suliko-text-translation',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        currentTextValue: state.currentTextValue,
        originalText: state.originalText,
        translatedText: state.translatedText,
        currentTargetLanguageId: state.currentTargetLanguageId,
        currentSourceLanguageId: state.currentSourceLanguageId,
        originalTargetLanguageId: state.originalTargetLanguageId,
        sourceLanguageId: state.sourceLanguageId,
      }),
      version: 1,
    }
  )
); 