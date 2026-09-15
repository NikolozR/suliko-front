"use client";

import { useEffect, useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getUserProfile } from "@/features/auth/services/userService";
import { useUserStore } from "@/features/auth/store/userStore";
import { getResult, getStatus } from "@/features/translation/services/jobService";
import { uploadOrderFile } from "../services/ordersService";
import type { FileTarget } from "../types/types.Orders";
import { resultToDocx, translatedFileName } from "../utils/translationFile";

/**
 * Suliko translations started from an order, followed until their result is
 * attached to that order's Translated versions.
 *
 * Kept in localStorage so a job survives navigation and reloads: opening the
 * order again picks up where the watcher left off. The watcher itself is
 * module-level, so a job keeps going while the user moves around the app.
 */

export interface OrderTranslationJob {
  jobId: string;
  chatId: string;
  target: FileTarget;
  sourceFileName: string;
  /** English name, used in the attached file's name. */
  targetLanguageName: string;
  /** The name as the user picked it, in their interface language. */
  targetLanguageLabel: string;
  startedAt: number;
  /** translating — polling the job; attaching — building the Word file and uploading it. */
  phase: "translating" | "attaching" | "failed";
  progress: number;
  error: string | null;
}

interface OrderTranslationsState {
  jobs: OrderTranslationJob[];
  add: (job: OrderTranslationJob) => void;
  update: (jobId: string, patch: Partial<OrderTranslationJob>) => void;
  remove: (jobId: string) => void;
}

export const useOrderTranslationsStore = create<OrderTranslationsState>()(
  persist(
    (set) => ({
      jobs: [],
      add: (job) => set((state) => ({ jobs: [...state.jobs, job] })),
      update: (jobId, patch) =>
        set((state) => ({
          jobs: state.jobs.map((job) => (job.jobId === jobId ? { ...job, ...patch } : job)),
        })),
      remove: (jobId) => set((state) => ({ jobs: state.jobs.filter((job) => job.jobId !== jobId) })),
    }),
    { name: "suliko-order-translations" },
  ),
);

/** Fired on window when a translation lands in an order, so open pages reload their files. */
export const ORDER_FILES_CHANGED = "suliko:order-files-changed";

export function targetKey(target: FileTarget): string {
  return target.type === "assigned"
    ? `assigned:${target.slug}:${target.orderId}:${target.documentId}`
    : `personal:${target.orderId}`;
}

const POLL_INTERVAL_MS = 4000;
const watching = new Set<string>();

function job(jobId: string): OrderTranslationJob | undefined {
  return useOrderTranslationsStore.getState().jobs.find((entry) => entry.jobId === jobId);
}

async function followJob(jobId: string): Promise<void> {
  const { update, remove } = useOrderTranslationsStore.getState();
  try {
    while (job(jobId)?.phase === "translating") {
      const status = await getStatus(jobId);
      if (status.status === "Completed") {
        update(jobId, { phase: "attaching", progress: 100 });
        break;
      }
      if (status.status === "Failed" || status.stage === "failed") {
        throw new Error(status.message || "The translation failed.");
      }
      update(jobId, { progress: Math.min(99, Math.max(0, Math.round(status.progress ?? 0))) });
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    const current = job(jobId);
    // Dismissed while polling, or already failed.
    if (!current || current.phase !== "attaching") return;

    const result = await getResult(jobId);
    if (!(result instanceof Blob)) {
      throw new Error(result.message || "The translation result is not available.");
    }
    const file = await resultToDocx(
      await result.text(),
      translatedFileName(current.sourceFileName, current.targetLanguageName),
    );
    await uploadOrderFile(current.target, file, "translation");

    remove(jobId);
    window.dispatchEvent(new CustomEvent(ORDER_FILES_CHANGED));

    // The job debited pages; show the new balance.
    getUserProfile()
      .then((profile) => useUserStore.getState().setUserProfile(profile))
      .catch(() => undefined);
  } catch (error) {
    if (job(jobId)) update(jobId, { phase: "failed", error: (error as Error).message });
  }
}

/** Start following a job, unless something is already following it. */
export function watchOrderTranslation(jobId: string): void {
  if (watching.has(jobId)) return;
  watching.add(jobId);
  void followJob(jobId).finally(() => watching.delete(jobId));
}

export function retryOrderTranslation(jobId: string): void {
  // Back to polling: a job that already completed reports Completed at once and
  // goes straight to attaching.
  useOrderTranslationsStore.getState().update(jobId, { phase: "translating", error: null });
  watchOrderTranslation(jobId);
}

/** The jobs for one file target, followed for as long as the caller is mounted or longer. */
export function useOrderTranslationJobs(target: FileTarget): OrderTranslationJob[] {
  const key = targetKey(target);
  const all = useOrderTranslationsStore((state) => state.jobs);
  const jobs = useMemo(() => all.filter((entry) => targetKey(entry.target) === key), [all, key]);

  useEffect(() => {
    for (const entry of jobs) {
      if (entry.phase !== "failed") watchOrderTranslation(entry.jobId);
    }
  }, [jobs]);

  return jobs;
}
