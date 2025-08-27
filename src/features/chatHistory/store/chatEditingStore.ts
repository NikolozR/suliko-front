import { create } from 'zustand';

interface ChatEditingState {
  translatedMarkdown: string;
  jobId: string; // translation/job id to fetch suggestions
  currentTargetLanguageId: number;
  currentSourceLanguageId: number;
  isTranslating: boolean;
  setTranslatedMarkdown: (text: string) => void;
  setTranslatedMarkdownWithoutZoomReset: (text: string) => void;
  setJobId: (jobId: string) => void;
  setCurrentTargetLanguageId: (id: number) => void;
  setCurrentSourceLanguageId: (id: number) => void;
  setIsTranslating: (value: boolean) => void;
  reset: () => void;
}

export const useChatEditingStore = create<ChatEditingState>()((set) => ({
  translatedMarkdown: '',
  jobId: '',
  currentTargetLanguageId: 1,
  currentSourceLanguageId: 0,
  isTranslating: false,
  setTranslatedMarkdown: (text) => {
    set({ translatedMarkdown: text });
  },
  setTranslatedMarkdownWithoutZoomReset: (text) => {
    set({ translatedMarkdown: text });
  },
  setJobId: (jobId) => set({ jobId }),
  setCurrentTargetLanguageId: (id) => set({ currentTargetLanguageId: id }),
  setCurrentSourceLanguageId: (id) => set({ currentSourceLanguageId: id }),
  setIsTranslating: (value) => set({ isTranslating: value }),
  reset: () => set({
    translatedMarkdown: '',
    jobId: '',
    currentTargetLanguageId: 1,
    currentSourceLanguageId: 0,
    isTranslating: false,
  }),
}));


