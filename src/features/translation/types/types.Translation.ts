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