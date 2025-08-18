import { create } from 'zustand';
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
  isTranslating: boolean;
  estimatedPageCount: number;
  estimatedMinutes: number;
  estimatedCost: string;
  estimatedWordCount: number;
  setCurrentSourceLanguageId: (languageId: number) => void;
  setCurrentTargetLanguageId: (languageId: number) => void;
  setOriginalTargetLanguageId: (languageId: number) => void;
  setSourceLanguageId: (languageId: number) => void;
  setCurrentFile: (file: FileList | null) => void;
  setTranslatedMarkdown: (text: string) => void;
  setTranslatedMarkdownWithoutZoomReset: (text: string) => void;
  setSuggestions: (suggestions: Suggestion[]) => void;
  setShouldResetZoom: (shouldReset: boolean) => void;
  setJobId: (jobId: string) => void;
  setRealPageCount: (pageCount: number | null) => void;
  setIsCountingPages: (isLoading: boolean) => void;
  setIsTranslating: (isTranslating: boolean) => void;
  setEstimatedPageCount: (pageCount: number) => void;
  setEstimatedMinutes: (minutes: number) => void;
  setEstimatedCost: (cost: string) => void;
  setEstimatedWordCount: (wordCount: number) => void;
  updateEstimations: (pageCount: number, minutes: number, cost: string, words: number) => void;
  reset: () => void;
}

export const useDocumentTranslationStore = create<DocumentTranslationState>()((set) => ({
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
  isTranslating: false,
  estimatedPageCount: 0,
  estimatedMinutes: 0,
  estimatedCost: '0.00',
  estimatedWordCount: 0,
  setJobId: (jobId: string) => set({ jobId: jobId }),
  setCurrentSourceLanguageId: (languageId) => set({ currentSourceLanguageId: languageId }),
  setCurrentTargetLanguageId: (languageId) => {
    set({ currentTargetLanguageId: languageId });
  },
  setOriginalTargetLanguageId: (languageId) => set({ originalTargetLanguageId: languageId }),
  setSourceLanguageId: (languageId) => set({ sourceLanguageId: languageId }),
  setCurrentFile: (file) => set({ currentFile: file, realPageCount: null }),
  setTranslatedMarkdown: (text) => {
    console.log('setTranslatedMarkdown');
    set({ translatedMarkdown: text, shouldResetZoom: true });
  },
  setTranslatedMarkdownWithoutZoomReset: (text) => {
    set({ translatedMarkdown: text });
  },
  setSuggestions: (suggestions) => set({ suggestions }),
  setShouldResetZoom: (shouldReset) => set({ shouldResetZoom: shouldReset }),
  setRealPageCount: (pageCount: number | null) => set({ realPageCount: pageCount }),
  setIsCountingPages: (isLoading: boolean) => set({ isCountingPages: isLoading }),
  setIsTranslating: (isTranslating: boolean) => set({ isTranslating }),
  // Estimation setters
  setEstimatedPageCount: (pageCount: number) => set({ estimatedPageCount: pageCount }),
  setEstimatedMinutes: (minutes: number) => set({ estimatedMinutes: minutes }),
  setEstimatedCost: (cost: string) => set({ estimatedCost: cost }),
  setEstimatedWordCount: (wordCount: number) => set({ estimatedWordCount: wordCount }), 
  updateEstimations: (pageCount: number, minutes: number, cost: string, words: number) => 
    set({ estimatedPageCount: pageCount, estimatedMinutes: minutes, estimatedCost: cost, estimatedWordCount: words }),
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
    isTranslating: false,
    // Reset estimation values
    estimatedPageCount: 0,
    estimatedMinutes: 0,
    estimatedCost: '0.00',
    estimatedWordCount: 0
  }),
})); 