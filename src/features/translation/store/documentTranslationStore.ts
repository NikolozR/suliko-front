import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Suggestion } from '../types/types.Translation';

interface DocumentTranslationState {
  currentFile: FileList | null;
  translatedMarkdown: string;
  suggestions: Suggestion[];
  currentSourceLanguageId: number;
  currentTargetLanguageId: number;
  originalTargetLanguageId: number;
  sourceLanguageId: number;
  jobId: string;
  shouldResetZoom: boolean;
  setCurrentSourceLanguageId: (languageId: number) => void;
  setCurrentTargetLanguageId: (languageId: number) => void;
  setOriginalTargetLanguageId: (languageId: number) => void;
  setSourceLanguageId: (languageId: number) => void;
  setCurrentFile: (file: FileList | null) => void;
  setTranslatedMarkdown: (text: string) => void;
  setSuggestions: (suggestions: Suggestion[]) => void;
  setShouldResetZoom: (shouldReset: boolean) => void;
  setJobId: (jobId: string) => void;
  reset: () => void;
}

export const useDocumentTranslationStore = create<DocumentTranslationState>()(
  persist(
    (set) => ({
      currentFile: null,
      translatedMarkdown: '',
      suggestions: [],
      currentSourceLanguageId: 0,
      currentTargetLanguageId: 2,
      originalTargetLanguageId: 2,
      sourceLanguageId: 0,
      shouldResetZoom: false,
      jobId: '',
      setJobId: (jobId: string) => set({ jobId: jobId }),
      setCurrentSourceLanguageId: (languageId) => set({ currentSourceLanguageId: languageId }),
      setCurrentTargetLanguageId: (languageId) => set({ currentTargetLanguageId: languageId }),
      setOriginalTargetLanguageId: (languageId) => set({ originalTargetLanguageId: languageId }),
      setSourceLanguageId: (languageId) => set({ sourceLanguageId: languageId }),
      setCurrentFile: (file) => set({ currentFile: file }),
      setTranslatedMarkdown: (text) => set({ translatedMarkdown: text, shouldResetZoom: true }),
      setSuggestions: (suggestions) => set({ suggestions }),
      setShouldResetZoom: (shouldReset) => set({ shouldResetZoom: shouldReset }),
      reset: () => set({ 
        currentFile: null, 
        translatedMarkdown: '', 
        suggestions: [],
        shouldResetZoom: false,
        currentSourceLanguageId: 0,
        currentTargetLanguageId: 2,
        originalTargetLanguageId: 2,
        sourceLanguageId: 0,
        jobId: '',
      }),
    }),
    {
      name: 'document-translation-languages',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        currentSourceLanguageId: state.currentSourceLanguageId,
        currentTargetLanguageId: state.currentTargetLanguageId,
        originalTargetLanguageId: state.originalTargetLanguageId,
        sourceLanguageId: state.sourceLanguageId,
      }),
    }
  )
); 