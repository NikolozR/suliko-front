export type TranslationResult = string | null;

export interface TextTranslateUserContentParams {
  UserText: string;
  LanguageId: number;
  SourceLanguageId: number;
}

export interface TextTranslateUserContentResponse {
  text: string;
  files: null;
}

export interface  DocumentTranslateUserContentParams {
  File: File;
  TargetLanguageId: number;
  OutputLanguageId: number;
  OutputFormat: number;
  model: number;
}

export interface JobStatusResponse {
  jobId: string;
  status: string;
  progress: number;
  message: string;
  estimatedRemainingMinutes: number;
}

export interface JobResultResponseOnError {
  jobId: string;
  status: string;
  message: string;
}

export interface DocumentTranslationResponse {
  jobId: string;
  chatId: string;
  message: string;
  estimatedTimeMinutes: number;
  fileType: string;
  fileSizeKB: number;
  model: string;
}


export interface Suggestion {
  id: string;
  title: string;
  description: string;
  type: number;
  originalText: string;
  suggestedText: string;
  priority: number;
}

export interface SuggestionsResponse {
  jobId: string;
  suggestionCount: number;
  suggestions: Suggestion[];
  message: string;
}

export interface SuggestionsResponseProcessing {
  jobId: string;
  status: string;
  message: string;
}

export interface ApplySuggestionParams {
  chatId: string;
  suggestion: Suggestion;
  targetLanguageId: number;
  outputLanguageId: number;
  editedOriginalText: string;
  editedSuggestedText: string;
  currentDocumentContent: string;
}


export interface ApplySuggestionResponse {
  updatedContent: string;
  success: boolean;
  errorMessage: string | null;
  newSuggestions: Suggestion[];
  changeDescription: string;
}