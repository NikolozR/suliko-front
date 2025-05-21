export type TranslationResult = string | null;

export interface TextTranslateUserContentParams {
  Description: string;
  LanguageId: number;
  SourceLanguageId: number;
  IsPdf: false;
} 

export interface TextTranslateUserContentResponse {
  text: string;
  files: null;
}