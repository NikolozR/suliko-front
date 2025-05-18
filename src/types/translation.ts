export type TranslationResult = string | null;

export interface TranslateUserContentParams {
  Description: string;
  LanguageId: number;
  SourceLanguageId: number;
  Files: File[];
  IsPdf: boolean;
} 