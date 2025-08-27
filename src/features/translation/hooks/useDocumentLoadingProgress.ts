"use client";

import { useEffect, useRef, useState } from "react";

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

const createAnchorPoints = (totalDurationMs: number) => {
  const messageOrder = [
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
  ];

  const minProgress = 5;
  const maxProgress = 97;
  const steps = messageOrder.length;

  return messageOrder.map((key, index) => {
    const ratio = (index + 1) / steps;
    const progress = Math.round(minProgress + (maxProgress - minProgress) * ratio);
    const time = totalDurationMs * ratio;
    return {
      progress,
      time,
      messageKey: `progress.${key}`,
    };
  });
};

export function useDocumentLoadingProgress(
  params: UseDocumentLoadingProgressParams
): UseDocumentLoadingProgressReturn {
  const {
    isLoading,
    t,
    currentFile,
    estimatedPageCount,
    estimatedMinutes,
    estimatedCost,
    estimatedWordCount,
  } = params;

  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [overrideMessage, setOverrideMessage] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    if (!isLoading) {
      clearTimer();
      setLoadingProgress(0);
      setLoadingMessage("");
      return;
    }

    const estimatedDurationMs = 4 * 60 * 1000;
    const anchorPoints = createAnchorPoints(estimatedDurationMs);
    const finalProgress = Math.floor(Math.random() * 3) + 97;

    const getCurrentTarget = (elapsedTime: number) => {
      if (elapsedTime <= 0) return 0;
      if (elapsedTime >= estimatedDurationMs) return finalProgress;

      const currentAnchor =
        anchorPoints.find((point) => point.time >= elapsedTime) ||
        anchorPoints[anchorPoints.length - 1];

      if (currentAnchor === anchorPoints[0]) {
        const timeRatio = elapsedTime / currentAnchor.time;
        return currentAnchor.progress * timeRatio;
      }

      const previousAnchor =
        anchorPoints[Math.max(anchorPoints.indexOf(currentAnchor) - 1, 0)];
      const timeRatio =
        (elapsedTime - previousAnchor.time) /
        (currentAnchor.time - previousAnchor.time);
      const progressDiff = currentAnchor.progress - previousAnchor.progress;
      return previousAnchor.progress + progressDiff * timeRatio;
    };

    const startTime = Date.now();
    const interval = 50;

    timerRef.current = setInterval(() => {
      const elapsedTime = Date.now() - startTime;

      if (elapsedTime > estimatedDurationMs) {
        setLoadingMessage(t("progress.longerThanUsual"));
        setLoadingProgress(finalProgress);
        return;
      }

      const currentAnchor =
        anchorPoints.find((point) => point.time >= elapsedTime) ||
        anchorPoints[anchorPoints.length - 1];

      if (overrideMessage) {
        setLoadingMessage(overrideMessage);
      } else {
        const msgKey = currentAnchor.messageKey;
        if (msgKey === "progress.documentInfo") {
          setLoadingMessage(
            t(msgKey, { data: estimatedPageCount || 0 }).replace(
              "pages",
              estimatedPageCount > 1 ? "pages" : "page"
            )
          );
        } else if (msgKey === "progress.wordCount") {
          const words =
            estimatedWordCount || (estimatedPageCount > 0 ? estimatedPageCount * 483 : 0);
          setLoadingMessage(t(msgKey, { data: words }));
        } else if (msgKey === "progress.estimatedTime") {
          const minutes =
            estimatedMinutes || (estimatedPageCount > 0 ? estimatedPageCount * 2 : 0);
          setLoadingMessage(t(msgKey, { data: minutes }));
        } else if (msgKey === "progress.estimatedCost") {
          const cost =
            estimatedCost && estimatedCost !== "0.00"
              ? estimatedCost
              : estimatedPageCount > 0
              ? (estimatedPageCount * 0.1).toFixed(2)
              : "0.00";
          setLoadingMessage(t(msgKey, { data: cost }));
        } else if (msgKey === "progress.documentType") {
          const ext = currentFile?.name.split(".").pop()?.toLowerCase() || "unknown";
          setLoadingMessage(t(msgKey, { data: ext }));
        } else {
          setLoadingMessage(t(msgKey));
        }
      }

      const targetProgress = getCurrentTarget(elapsedTime);
      if (targetProgress >= finalProgress) {
        setLoadingProgress(finalProgress);
        setLoadingMessage(t("progress.longerThanUsual"));
        return;
      }

      setLoadingProgress(targetProgress);
    }, interval);

    return () => clearTimer();
  }, [
    isLoading,
    t,
    currentFile,
    estimatedPageCount,
    estimatedMinutes,
    estimatedCost,
    estimatedWordCount,
    overrideMessage,
  ]);

  const setManualProgress = (progress: number, message?: string) => {
    setLoadingProgress(progress);
    if (typeof message === "string") setLoadingMessage(message);
  };

  const reset = () => {
    clearTimer();
    setLoadingProgress(0);
    setLoadingMessage("");
    setOverrideMessage(null);
  };

  return {
    loadingProgress,
    loadingMessage,
    setOverrideMessage,
    setManualProgress,
    reset,
  };
}


