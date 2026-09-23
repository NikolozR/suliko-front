/** Shapes returned by api.suliko.ge's /api/v1/portal endpoints (snake_case, as sent). */

export type FileKind = "source" | "translation";

/** ok — listed; not_linked — the bureau has no Google Drive; unavailable — Drive failed. */
export type FilesState = "ok" | "not_linked" | "unavailable";

export interface PortalOrganization {
  slug: string;
  name: string;
}

export interface PortalMe {
  is_translator: boolean;
  display_name: string | null;
  organizations: PortalOrganization[];
}

export interface LanguagePair {
  source_language: string;
  target_language: string;
}

export interface AssignedDocument extends LanguagePair {
  id: number;
  document_type_name: string | null;
  page_count: number;
}

export interface AssignedOrder {
  organization: PortalOrganization;
  order_id: number;
  client_name: string;
  order_date: string;
  due_date: string | null;
  documents: AssignedDocument[];
}

export interface OrderFile {
  id: string;
  name: string;
  kind: FileKind;
  content_type: string;
  size_bytes: number | null;
  created_at: string | null;
  uploaded_by_me: boolean;
}

export interface AssignedDocumentDetail extends AssignedDocument {
  files_state: FilesState;
  files: OrderFile[];
}

export interface AssignedOrderDetail extends Omit<AssignedOrder, "documents"> {
  documents: AssignedDocumentDetail[];
}

export interface PersonalFile {
  id: number;
  name: string;
  kind: FileKind;
  content_type: string;
  size_bytes: number;
  created_at: string;
}

export interface PersonalOrderSummary {
  id: number;
  client_name: string;
  due_date: string | null;
  created_at: string;
  language_pairs: LanguagePair[];
  source_file_count: number;
  translation_file_count: number;
}

export interface PersonalOrderDetail {
  id: number;
  client_name: string;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  language_pairs: LanguagePair[];
  files: PersonalFile[];
}

export interface PersonalOrderInput {
  client_name: string;
  due_date: string | null;
  notes: string | null;
  language_pairs: LanguagePair[];
}

/** Where a file lives: a document of a bureau's order, or a personal order. */
export type FileTarget =
  | { type: "assigned"; slug: string; orderId: number; documentId: number }
  | { type: "personal"; orderId: number };

// ── Admin (/api/v1/portal-admin) ────────────────────────────────────────────

export type TenantStatus = "trial" | "active" | "suspended";

export interface AdminOrganization {
  slug: string;
  name: string;
  status: TenantStatus;
  translator_count: number;
  shared_drive_id: string | null;
  drive_name: string | null;
}

export interface AdminDriveInfo {
  configured: boolean;
  service_account_email: string | null;
}

export interface AdminLink {
  slug: string;
  name: string;
  translator_id: number;
  translator_name: string | null;
}

export interface AdminTranslator {
  external_user_id: string;
  display_name: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  organizations: AdminLink[];
}

export interface AdminTranslatorInput {
  display_name: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
}

export type MatchReason = "phone" | "email" | "phone_and_email";

export interface DirectoryEntry {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  match: MatchReason | null;
  linked_to_other_account: boolean;
}

export interface DirectoryCandidates {
  organization: PortalOrganization;
  linked_translator_id: number | null;
  matches: DirectoryEntry[];
  search_results: DirectoryEntry[];
}
