// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import "server-only";

import { unstable_rethrow } from "next/navigation";

import { api } from "@office/shared/lib/api";

/**
 * Claude Translate from an order, mirroring `api/v1/claude_translate.py`.
 *
 * A person ticks source files and confirms; each becomes a queued job that a
 * separate Claude Code server picks up. The result is filed as a Word document
 * under the document's Translation files. Only organisations a superadmin
 * switched on have these routes (otherwise 403 `claude_translate_not_enabled`).
 */

export type ClaudeJobStatus = "queued" | "translating" | "translated" | "failed" | "cancelled";

export interface ClaudeJob {
  id: string;
  /** The source file, null once it has been removed. */
  file_id: string | null;
  file_name: string;
  document_id: number | null;
  status: ClaudeJobStatus;
  attempts: number;
  error: string | null;
  source_language: string;
  target_language: string;
  /** The Word document, once translated and while it is still there. */
  result_file_id: string | null;
  created_at: string | null;
  started_at: string | null;
  finished_at: string | null;
}

export interface ClaudeJobList {
  jobs: ClaudeJob[];
  /** A worker has asked for work lately. Jobs wait either way. */
  worker_online: boolean;
  worker_last_seen: string | null;
}

export interface ClaudePickableFile {
  id: string;
  name: string;
  content_type: string;
  size_bytes: number;
  document_id: number;
  source_language: string;
  target_language: string;
  /** False for a file only the Order Vault can open. */
  downloadable: boolean;
  job_status: ClaudeJobStatus | null;
  /** A finished translation of this file is still on the document. */
  has_output: boolean;
}

export interface ClaudePickable {
  files: ClaudePickableFile[];
  instructions: string | null;
}

const base = (orderId: number) => `/api/v1/orders/${orderId}/claude-translate`;

export async function listClaudeFiles(orderId: number): Promise<ClaudePickable> {
  return api<ClaudePickable>(`${base(orderId)}/files`);
}

export async function listClaudeJobs(orderId: number): Promise<ClaudeJobList> {
  return api<ClaudeJobList>(`${base(orderId)}/jobs`);
}

export async function createClaudeJobs(
  orderId: number,
  files: string[],
  confirmRetranslate: boolean,
): Promise<ClaudeJob[]> {
  return api<ClaudeJob[]>(`${base(orderId)}/jobs`, {
    method: "POST",
    body: { files, confirm_retranslate: confirmRetranslate },
  });
}

export async function retryClaudeJob(orderId: number, jobId: string): Promise<ClaudeJob> {
  return api<ClaudeJob>(`${base(orderId)}/jobs/${encodeURIComponent(jobId)}/retry`, {
    method: "POST",
  });
}

export async function cancelClaudeJob(orderId: number, jobId: string): Promise<ClaudeJob> {
  return api<ClaudeJob>(`${base(orderId)}/jobs/${encodeURIComponent(jobId)}/cancel`, {
    method: "POST",
  });
}

/**
 * The order's jobs, or null when they cannot be read (the API predates the
 * feature, or the switch was turned off a moment ago). The order page shows
 * nothing in that case rather than failing with it.
 */
export async function listClaudeJobsIfAvailable(orderId: number): Promise<ClaudeJobList | null> {
  try {
    return await listClaudeJobs(orderId);
  } catch (error) {
    unstable_rethrow(error);
    return null;
  }
}
