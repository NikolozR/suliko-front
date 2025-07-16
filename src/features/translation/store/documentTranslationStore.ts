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
  realPageCount: number | null;
  isCountingPages: boolean;
  setCurrentSourceLanguageId: (languageId: number) => void;
  setCurrentTargetLanguageId: (languageId: number) => void;
  setOriginalTargetLanguageId: (languageId: number) => void;
  setSourceLanguageId: (languageId: number) => void;
  setCurrentFile: (file: FileList | null) => void;
  setTranslatedMarkdown: (text: string) => void;
  setSuggestions: (suggestions: Suggestion[]) => void;
  setShouldResetZoom: (shouldReset: boolean) => void;
  setJobId: (jobId: string) => void;
  setRealPageCount: (pageCount: number | null) => void;
  setIsCountingPages: (isLoading: boolean) => void;
  reset: () => void;
}

export const useDocumentTranslationStore = create<DocumentTranslationState>()(
  persist(
    (set) => ({
      currentFile: null,
      translatedMarkdown: '',
      suggestions: [],
      currentSourceLanguageId: 0,
      currentTargetLanguageId: 1,
      originalTargetLanguageId: 1,
      sourceLanguageId: 0,
      shouldResetZoom: false,
      jobId: '',
      realPageCount: null,
      isCountingPages: false,
      setJobId: (jobId: string) => set({ jobId: jobId }),
      setCurrentSourceLanguageId: (languageId) => set({ currentSourceLanguageId: languageId }),
      setCurrentTargetLanguageId: (languageId) => {
        set({ currentTargetLanguageId: languageId });
      },
      setOriginalTargetLanguageId: (languageId) => set({ originalTargetLanguageId: languageId }),
      setSourceLanguageId: (languageId) => set({ sourceLanguageId: languageId }),
      setCurrentFile: (file) => set({ currentFile: file, realPageCount: null }),
      setTranslatedMarkdown: (text) => set({ translatedMarkdown: text, shouldResetZoom: true }),
      setSuggestions: (suggestions) => set({ suggestions }),
      setShouldResetZoom: (shouldReset) => set({ shouldResetZoom: shouldReset }),
      setRealPageCount: (pageCount: number | null) => set({ realPageCount: pageCount }),
      setIsCountingPages: (isLoading: boolean) => set({ isCountingPages: isLoading }),
      reset: () => set({ 
        currentFile: null, 
        translatedMarkdown: '', 
        suggestions: [],
        shouldResetZoom: false,
        currentSourceLanguageId: 0,
        currentTargetLanguageId: 1,
        originalTargetLanguageId: 1,
        sourceLanguageId: 0,
        jobId: '',
        realPageCount: null,
        isCountingPages: false,
      }),
    }),
    {
      name: 'suliko-document-translation',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        currentFile: null,
        translatedMarkdown: state.translatedMarkdown,
        suggestions: state.suggestions,
        currentTargetLanguageId: state.currentTargetLanguageId,
        currentSourceLanguageId: state.currentSourceLanguageId,
        originalTargetLanguageId: state.originalTargetLanguageId,
        sourceLanguageId: state.sourceLanguageId,
        shouldResetZoom: state.shouldResetZoom,
        jobId: state.jobId,
        realPageCount: state.realPageCount,
        isCountingPages: state.isCountingPages,
      }),
      version: 1,
    }
  )
); 