import { NameTranslationItem } from "@/features/translation/types/types.Translation";

/** Mirrors the backend BatchItemStatus constants. */
export type BatchItemStatus =
  | "Pending"
  | "Running"
  | "Completed"
  | "Failed"
  | "Cancelled";

/** Mirrors the backend BatchStatus constants. */
export type BatchStatus =
  | "Queued"
  | "Running"
  | "Completed"
  | "CompletedWithErrors"
  | "Cancelled";

/**
 * A file picked up from the user's folder, before it has been uploaded or queued.
 * Everything here lives only in the browser until the batch is submitted.
 */
export interface StagedDocument {
  /** Stable per-session id; the File object itself can't be used as a React key. */
  id: string;
  file: File;
  /** Path within the chosen folder, e.g. "contracts/2024/lease.pdf". */
  relativePath: string;
  /** Resolved lazily — PDFs are read in the browser, everything else asks the server. */
  pageCount: number | null;
  settings: DocumentSettings;
  upload: UploadState;
}

/** The per-document choices the user can edit, individually or via select-all. */
export interface DocumentSettings {
  targetLanguageId: number;
  /** 0 means "let the model detect it", matching the single-document flow. */
  sourceLanguageId: number;
  outputFormat: number;
  model: number;
  /** Free-text notes and translator instructions. */
  instructions: string;
  /** Confirmed proper-name spellings applied to this document. */
  nameTranslations: NameTranslationItem[];
}

export interface UploadState {
  status: "idle" | "uploading" | "uploaded" | "error";
  /** 0..1, reported by the direct-to-Google upload. */
  progress: number;
  fileUri?: string;
  mimeType?: string;
  error?: string;
}

export interface CreateBatchItemRequest {
  fileName: string;
  relativePath: string;
  fileUri: string;
  mimeType: string;
  pageCount: number;
  targetLanguageId: number;
  outputLanguageId: number;
  sourceLanguageId: number | null;
  outputFormat: number;
  model: number;
  instructions: string | null;
  nameTranslations: NameTranslationItem[];
}

export interface CreateBatchRequest {
  projectId: string;
  name: string | null;
  items: CreateBatchItemRequest[];
}

export interface BatchItem {
  id: string;
  sortOrder: number;
  fileName: string;
  relativePath: string | null;
  status: BatchItemStatus;
  attemptCount: number;
  errorMessage: string | null;
  jobId: string | null;
  chatId: string | null;
  targetLanguageId: number;
  sourceLanguageId: number | null;
  pageCount: number;
  startedAt: string | null;
  completedAt: string | null;
  nextAttemptAt: string | null;
}

export interface Batch {
  id: string;
  projectId: string;
  name: string | null;
  status: BatchStatus;
  totalItems: number;
  pendingCount: number;
  runningCount: number;
  completedCount: number;
  failedCount: number;
  cancelledCount: number;
  progressPercent: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  items: BatchItem[];
}

export interface BatchResponse {
  success: boolean;
  data: Batch;
}

export interface BatchListResponse {
  success: boolean;
  data: Batch[];
}
