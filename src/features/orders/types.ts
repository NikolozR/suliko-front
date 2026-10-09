/** What the Office portal returns (api.suliko.ge `/portal`), as far as the Orders tab uses it. */

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
  order_id: number;
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

export type AssignedDocumentDetail = AssignedDocument & {
  files_state: "ok" | "unavailable";
  files: OrderFile[];
};

export type AssignedOrderDetail = Omit<AssignedOrder, "documents"> & {
  documents: AssignedDocumentDetail[];
};

export type PortalMe = {
  is_translator: boolean;
  display_name: string | null;
  organizations: Organization[];
};
