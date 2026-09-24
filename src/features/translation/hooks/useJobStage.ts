"use client";

import { useEffect, useRef, useState } from "react";
import { getStatus } from "../services/jobService";
import type { JobStage } from "../types/types.Translation";

/**
 * Polls a translation job and reports what it is doing.
 *
 * Deliberately narrow: the wait page at /translations/[id] has its own poll
 * tangled up with chat hydration, the duration estimator and result fetching,
 * and pulling all of that apart to share it would risk the page that currently
 * works. This covers the one thing /document needs while a job runs in place —
 * the stage, and whether it has finished.
 */

export type JobOutcome = "running" | "completed" | "failed";

interface JobState {
  stage: JobStage | null;
  outcome: JobOutcome;
  /** The server's message on failure, so the caller can show a real reason. */
  message: string | null;
}

const RUNNING_INTERVAL_MS = 3000;
const ERROR_INTERVAL_MS = 5000;

export function useJobStage(jobId: string | null): JobState {
  const [state, setState] = useState<JobState>({
    stage: null,
    outcome: "running",
    message: null,
  });

  // Polling is driven by a chain of timeouts rather than an interval, so a slow
  // response can never stack requests on top of each other.
  const cancelled = useRef(false);

  useEffect(() => {
    if (!jobId) {
      setState({ stage: null, outcome: "running", message: null });
      return;
    }

    cancelled.current = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      if (cancelled.current) return;
      try {
        const status = await getStatus(jobId);
        if (cancelled.current) return;

        if (status.status === "Completed") {
          setState({ stage: status.stage ?? "ready", outcome: "completed", message: null });
          return; // terminal — stop polling
        }
        if (status.status === "Failed") {
          setState({
            stage: status.stage ?? "failed",
            outcome: "failed",
            message: status.message || null,
          });
          return; // terminal
        }

        setState((prev) => ({
          // Keep the last known stage if a poll comes back without one, so the
          // list does not flicker back to nothing on a single odd response.
          stage: status.stage ?? prev.stage,
          outcome: "running",
          message: null,
        }));
        timer = setTimeout(poll, RUNNING_INTERVAL_MS);
      } catch {
        // A failed poll says nothing about the job — keep waiting, slower.
        if (!cancelled.current) timer = setTimeout(poll, ERROR_INTERVAL_MS);
      }
    };

    timer = setTimeout(poll, 1000);

    return () => {
      cancelled.current = true;
      if (timer) clearTimeout(timer);
    };
  }, [jobId]);

  return state;
}
