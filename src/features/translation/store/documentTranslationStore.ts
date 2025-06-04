import { create } from 'zustand';

interface DocumentTranslationState {
  currentFile: FileList | null;
  translatedMarkdown: string;
  currentSourceLanguageId: number;
  currentTargetLanguageId: number;
  originalTargetLanguageId: number;
  sourceLanguageId: number;
  shouldResetZoom: boolean;
  setCurrentSourceLanguageId: (languageId: number) => void;
  setCurrentTargetLanguageId: (languageId: number) => void;
  setOriginalTargetLanguageId: (languageId: number) => void;
  setSourceLanguageId: (languageId: number) => void;
  setCurrentFile: (file: FileList | null) => void;
  setTranslatedMarkdown: (text: string) => void;
  setShouldResetZoom: (shouldReset: boolean) => void;
  reset: () => void;
}

export const useDocumentTranslationStore = create<DocumentTranslationState>()((set) => ({
  currentFile: null,
  translatedMarkdown: '',
  currentSourceLanguageId: 0,
  currentTargetLanguageId: 2,
  originalTargetLanguageId: 2,
  sourceLanguageId: 0,
  shouldResetZoom: false,
  setCurrentSourceLanguageId: (languageId) => set({ currentSourceLanguageId: languageId }),
  setCurrentTargetLanguageId: (languageId) => set({ currentTargetLanguageId: languageId }),
  setOriginalTargetLanguageId: (languageId) => set({ originalTargetLanguageId: languageId }),
  setSourceLanguageId: (languageId) => set({ sourceLanguageId: languageId }),
  setCurrentFile: (file) => set({ currentFile: file }),
  setTranslatedMarkdown: (text) => set({ translatedMarkdown: text, shouldResetZoom: true }),
  setShouldResetZoom: (shouldReset) => set({ shouldResetZoom: shouldReset }),
  reset: () => set({ 
    currentFile: null, 
    translatedMarkdown: '', 
    shouldResetZoom: false,
    currentSourceLanguageId: 0,
    currentTargetLanguageId: 2,
    originalTargetLanguageId: 2,
    sourceLanguageId: 0
  }),
})); 