export interface PassportTemplateField {
  key: string;
  label: string;
  description: string;
  order: number;
}

export interface PassportTemplate {
  id: string;
  name: string;
  country: string;
  docx_file_url: string;
  fields: PassportTemplateField[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExtractedFields {
  [key: string]: string;
}

export interface OcrResponse {
  success: boolean;
  extractedFields: ExtractedFields;
  fieldConfidence: Record<string, number>;
  overallConfidence: number;
  judgeIterations: number;
  rawOcrText: string;
  errorMessage?: string;
}

export interface PreviewResponse {
  success: boolean;
  pageImages: string[];
  errorMessage?: string;
}
