export type TranslationResult = string | null;

/** DocumentFormat.Html — forced so the editor exercises the HTML render path. Set back to 0 to revert. */
export const DEFAULT_DOCUMENT_OUTPUT_FORMAT = 5;

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

/** Stages the backend reports. Null on jobs created before that shipped. */
export type JobStage =
  | "queued"
  | "translating"
  | "rebuilding"
  | "ready"
  | "failed";

export interface JobStatusResponse {
  jobId: string;
  status: string;
  progress: number;
  message: string;
  estimatedRemainingMinutes: number;
  /** Null for jobs started before the backend began reporting stages. */
  stage?: JobStage | null;
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

export type NameTranslationType = "Person" | "Organization";

export interface NameTranslationItem {
  original: string;
  translation: string;
  type: NameTranslationType;
}

export interface DocumentTranslateWithUriParams {
  fileUri: string;
  mimeType: string;
  fileName?: string;
  TargetLanguageId: number;
  OutputLanguageId: number;
  OutputFormat: number;
  model: number;
  pageCount?: number;
  nameTranslations?: NameTranslationItem[];
}

/**
 * Response from POST /Document/prepare-upload. `pageCount` is authoritative —
 * it is what the server bills, and it ignores whatever the client sends to
 * translate-with-uri.
 */
export interface PrepareUploadResponse {
  success: boolean;
  fileUri: string;
  mimeType: string;
  pageCount: number;
  fileName: string;
  errorMessage: string | null;
}