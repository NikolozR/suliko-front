/** What the Office portal returns (api.suliko.ge `/portal`), as far as the Orders page uses it. */

export type Organization = { slug: string; name: string };

export type AssignedDocument = {
  id: number;
  document_type_name: string | null;
  source_language: string;
  target_language: string;
  page_count: number;
};

export type AssignedOrder = {
  organization: Organization;
  /** The key: in every URL. Shared by all bureaus, so never shown. */
  order_id: number;
  /**
   * The order's number in its bureau, which is what people see. Missing only
   * from an Office API older than its per-bureau numbers (migration 0016).
   */
  order_number?: number | null;
  client_name: string;
  order_date: string;
  due_date: string | null;
  documents: AssignedDocument[];
};

export type OrderFile = {
  id: string;
  name: string;
  kind: string;
  content_type: string;
  size_bytes: number | null;
  created_at: string | null;
  uploaded_by_me: boolean;
  in_vault: boolean;
  downloadable: boolean;
};

/** One Suliko Translate job this translator started on a file of the document. */
export type OrderTranslation = {
  id: string;
  status: "processing" | "completed" | "failed";
  /** The bureau's file that went in, and the translation that came back. */
  source_file_id: string | null;
  result_file_id: string | null;
  /** What suliko.ge measured, which is what it charged. */
  page_count: number;
  /** 0 to 100 while it runs. */
  progress: number | null;
  error: string | null;
  /** On starting one only: the pages left on the balance, if known. */
  balance?: string | null;
};

export type AssignedDocumentDetail = AssignedDocument & {
  files_state: "ok" | "unavailable";
  files: OrderFile[];
  /** Missing from an Office API older than Suliko Translate in the portal. */
  translations?: OrderTranslation[];
};

export type AssignedOrderDetail = Omit<AssignedOrder, "documents"> & {
  documents: AssignedDocumentDetail[];
};
