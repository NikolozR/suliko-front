"use server";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { getTranslations } from "next-intl/server";

import {
  cancelClaudeJob,
  createClaudeJobs,
  listClaudeFiles,
  listClaudeJobs,
  retryClaudeJob,
  type ClaudeJob,
  type ClaudeJobList,
  type ClaudePickable,
} from "@office/features/orders/claude";
import { ApiError } from "@office/shared/lib/api";

/**
 * Server actions behind Claude Translate on an order.
 *
 * Each returns a plain result rather than throwing: a refusal here is a
 * sentence the person has to read ("these files are already waiting"), not an
 * error digest.
 */

type Failure = {
  ok: false;
  error: string;
  /** Set when the way forward is to confirm translating files again. */
  needsConfirmation?: boolean;
};

const isId = (value: unknown): value is number => Number.isInteger(value) && Number(value) > 0;
const isFileId = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z0-9_-]{8,100}$/.test(value);
const isJobId = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z0-9_-]{8,40}$/.test(value);

async function explain(error: unknown): Promise<Failure> {
  const t = await getTranslations("claudeTranslate.errors");
  if (!(error instanceof ApiError)) return { ok: false, error: t("unavailable") };
  if (error.code === "claude_translate_not_enabled") return { ok: false, error: t("notEnabled") };
  if (error.code === "claude_retranslate_needs_confirmation") {
    return { ok: false, needsConfirmation: true, error: error.detail };
  }
  if (error.status === 404) return { ok: false, error: t("gone") };
  if (error.status === 403) return { ok: false, error: t("noAccess") };
  // 409 and 422 carry the API's own explanation ("already waiting", "kept in the vault").
  if (error.status === 409 || error.status === 422) return { ok: false, error: error.detail };
  return { ok: false, error: t("unavailable") };
}

/** What the dialog lists: the order's Source files and what is known about each. */
export async function loadClaudeFilesAction(
  orderId: number,
): Promise<({ ok: true } & ClaudePickable) | Failure> {
  if (!isId(orderId)) return explain(null);
  try {
    return { ok: true, ...(await listClaudeFiles(orderId)) };
  } catch (error) {
    return explain(error);
  }
}

/** The order's jobs. The panel asks again every few seconds while one is active. */
export async function loadClaudeJobsAction(
  orderId: number,
): Promise<({ ok: true } & ClaudeJobList) | Failure> {
  if (!isId(orderId)) return explain(null);
  try {
    return { ok: true, ...(await listClaudeJobs(orderId)) };
  } catch (error) {
    return explain(error);
  }
}

export async function startClaudeJobsAction(input: {
  orderId: number;
  fileIds: string[];
  confirmRetranslate: boolean;
}): Promise<{ ok: true; jobs: ClaudeJob[] } | Failure> {
  const fileIds = [...new Set(input.fileIds)];
  if (
    !isId(input.orderId) ||
    fileIds.length === 0 ||
    fileIds.length > 50 ||
    !fileIds.every(isFileId)
  ) {
    return explain(null);
  }
  try {
    return {
      ok: true,
      jobs: await createClaudeJobs(input.orderId, fileIds, input.confirmRetranslate === true),
    };
  } catch (error) {
    return explain(error);
  }
}

export async function retryClaudeJobAction(
  orderId: number,
  jobId: string,
): Promise<{ ok: true; job: ClaudeJob } | Failure> {
  if (!isId(orderId) || !isJobId(jobId)) return explain(null);
  try {
    return { ok: true, job: await retryClaudeJob(orderId, jobId) };
  } catch (error) {
    return explain(error);
  }
}

export async function cancelClaudeJobAction(
  orderId: number,
  jobId: string,
): Promise<{ ok: true; job: ClaudeJob } | Failure> {
  if (!isId(orderId) || !isJobId(jobId)) return explain(null);
  try {
    return { ok: true, job: await cancelClaudeJob(orderId, jobId) };
  } catch (error) {
    return explain(error);
  }
}
