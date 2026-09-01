"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { estimateDurationMs } from "@/features/translation/utils/translationEta";

type TranslateFn = (
  key: string,
  values?: Record<string, string | number | Date>
) => string;

interface UseDocumentLoadingProgressParams {
  isLoading: boolean;
  t: TranslateFn;
  currentFile: File | null;
  estimatedPageCount: number;
  estimatedMinutes: number;
  estimatedCost: string;
  estimatedWordCount: number;
}

interface UseDocumentLoadingProgressReturn {
  loadingProgress: number;
  loadingMessage: string;
  setOverrideMessage: (message: string | null) => void;
  setManualProgress: (progress: number, message?: string) => void;
  reset: () => void;
}

/**
 * The message ladder, shared with the translation wait page so both surfaces
 * narrate a job in the same order.
 */
export const PROGRESS_MESSAGE_KEYS = [
  "starting",
  "documentType",
  "documentInfo",
  "wordCount",
  "estimatedTime",
  "estimatedCost",
  "preparing",
  "analyzing",
  "translating",
  "firstPageDone",
  "checkingMistakes",
  "stillChecking",
  "enhancing",
  "finalizing",
  "waiting",
  "thankYou",
] as const;

const MIN_PROGRESS = 5;
/** Never claim completion from a simulated curve — only real events do that. */
const MAX_SIMULATED_PROGRESS = 97;

const createAnchorPoints = (totalDurationMs: number) =>
  PROGRESS_MESSAGE_KEYS.map((key, index) => {
    const ratio = (index + 1) / PROGRESS_MESSAGE_KEYS.length;
    return {
      progress: Math.round(
        MIN_PROGRESS + (MAX_SIMULATED_PROGRESS - MIN_PROGRESS) * ratio
      ),
      time: totalDurationMs * ratio,
      messageKey: `progress.${key}`,
    };
  });

export function useDocumentLoadingProgress(
  params: UseDocumentLoadingProgressParams
): UseDocumentLoadingProgressReturn {
  const { isLoading, estimatedPageCount } = params;

  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [loadingMessage, setLoadingMessage] = useState<string>("");

  /**
   * Everything the ticker reads lives in a ref rather than the effect's
   * dependency array. These values change identity on almost every render
   * (`t` and `currentFile` especially), and re-running the effect restarted the
   * animation from `startTime = now` — which snapped the bar back to 0 and
   * replayed the message ladder from "starting".
   */
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const overrideMessageRef = useRef<string | null>(null);
  /**
   * Progress reported by real events (upload finished, OCR running, result
   * loading). It acts as a floor rather than a one-off write: the 50ms ticker
   * used to overwrite every manual value within a frame, which made the whole
   * OCR flow's progress reporting invisible.
   */
  const manualRef = useRef<{ progress: number; message: string | null } | null>(
    null
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      clearTimer();
      manualRef.current = null;
      overrideMessageRef.current = null;
      setLoadingProgress(0);
      setLoadingMessage("");
      return;
    }

    const estimatedDurationMs = estimateDurationMs(estimatedPageCount);
    const anchorPoints = createAnchorPoints(estimatedDurationMs);

    const getSimulatedProgress = (elapsedTime: number) => {
      if (elapsedTime <= 0) return 0;
      if (elapsedTime >= estimatedDurationMs) return MAX_SIMULATED_PROGRESS;

      const currentIndex = anchorPoints.findIndex(
        (point) => point.time >= elapsedTime
      );
      const anchor =
        currentIndex === -1 ? anchorPoints[anchorPoints.length - 1] : anchorPoints[currentIndex];

      if (currentIndex <= 0) {
        return anchor.progress * (elapsedTime / anchor.time);
      }

      const previous = anchorPoints[currentIndex - 1];
      const timeRatio =
        (elapsedTime - previous.time) / (anchor.time - previous.time);
      return previous.progress + (anchor.progress - previous.progress) * timeRatio;
    };

    const resolveSimulatedMessage = (elapsedTime: number) => {
      const {
        t,
        currentFile,
        estimatedPageCount: pages,
        estimatedMinutes,
        estimatedCost,
        estimatedWordCount,
      } = paramsRef.current;

      if (elapsedTime > estimatedDurationMs) return t("progress.longerThanUsual");

      const anchor =
        anchorPoints.find((point) => point.time >= elapsedTime) ||
        anchorPoints[anchorPoints.length - 1];

      switch (anchor.messageKey) {
        case "progress.documentInfo":
          return t(anchor.messageKey, { data: pages || 0 }).replace(
            "pages",
            pages > 1 ? "pages" : "page"
          );
        case "progress.wordCount":
          return t(anchor.messageKey, {
            data: estimatedWordCount || (pages > 0 ? pages * 483 : 0),
          });
        case "progress.estimatedTime":
          return t(anchor.messageKey, {
            data: estimatedMinutes || (pages > 0 ? pages * 2 : 0),
          });
        case "progress.estimatedCost":
          return t(anchor.messageKey, {
            data:
              estimatedCost && estimatedCost !== "0.00"
                ? estimatedCost
                : pages > 0
                ? (pages * 0.1).toFixed(2)
                : "0.00",
          });
        case "progress.documentType":
          return t(anchor.messageKey, {
            data: currentFile?.name.split(".").pop()?.toLowerCase() || "unknown",
          });
        default:
          return t(anchor.messageKey);
      }
    };

    const startTime = Date.now();

    timerRef.current = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      const simulated = getSimulatedProgress(elapsedTime);
      const manual = manualRef.current;

      // Real progress wins; the simulated curve keeps creeping above it so the
      // bar still shows life during a long phase we can't measure.
      setLoadingProgress(Math.max(simulated, manual?.progress ?? 0));

      if (overrideMessageRef.current) {
        setLoadingMessage(overrideMessageRef.current);
      } else if (manual?.message && manual.progress > simulated) {
        setLoadingMessage(manual.message);
      } else {
        setLoadingMessage(resolveSimulatedMessage(elapsedTime));
      }
    }, 50);

    return clearTimer;
  }, [isLoading, estimatedPageCount, clearTimer]);

  const setOverrideMessage = useCallback((message: string | null) => {
    overrideMessageRef.current = message;
    if (message) setLoadingMessage(message);
  }, []);

  const setManualProgress = useCallback((progress: number, message?: string) => {
    manualRef.current = {
      progress,
      message: typeof message === "string" ? message : null,
    };
    // Paint immediately rather than waiting up to a tick for the interval.
    setLoadingProgress((prev) => Math.max(prev, progress));
    if (typeof message === "string") setLoadingMessage(message);
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    manualRef.current = null;
    overrideMessageRef.current = null;
    setLoadingProgress(0);
    setLoadingMessage("");
  }, [clearTimer]);

  return {
    loadingProgress,
    loadingMessage,
    setOverrideMessage,
    setManualProgress,
    reset,
  };
}
