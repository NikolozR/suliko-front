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
