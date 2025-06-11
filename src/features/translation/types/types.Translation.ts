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
  SourceLanguageId: number;
  OutputFormat: number;
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
  message: string;
  estimatedTimeMinutes: number;
  fileType: string;
  fileSizeKB: number;
}