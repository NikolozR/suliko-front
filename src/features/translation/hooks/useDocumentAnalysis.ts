import { useCallback, useEffect, useRef, useState } from "react";
import { analyzeDocument } from "../services/analysisService";
import { DocumentAnalysis } from "../types/types.Translation";

export type AnalysisStatus = "idle" | "loading" | "ready" | "failed";

interface Options {
  fileUri: string | null | undefined;
  mimeType: string | null | undefined;
  sourceLanguageId: number;
  targetLanguageId: number;
  outputLanguageId: number;
  /** False skips the analysis entirely (OCR-only, subtitles, signed out). */
  enabled: boolean;
}

/**
 * Runs /Document/analyze as soon as a file is prepared, and again when the
 * language pair changes, because the suggested renderings depend on it.
 *
 * `waitForResult` lets the submit path reuse a request that is already in
 * flight instead of asking for the names a second time.
 */
export function useDocumentAnalysis({
  fileUri,
  mimeType,
  sourceLanguageId,
  targetLanguageId,
  outputLanguageId,
  enabled,
}: Options) {
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const pending = useRef<Promise<DocumentAnalysis | null> | null>(null);

  useEffect(() => {
    setAnalysis(null);

    if (!enabled || !fileUri || !mimeType) {
      setStatus("idle");
      pending.current = null;
      return;
    }

    const controller = new AbortController();
    setStatus("loading");

    const request = analyzeDocument({
      fileUri,
      mimeType,
      sourceLanguageId,
      targetLanguageId,
      outputLanguageId,
      signal: controller.signal,
    });
    pending.current = request;

    request.then((result) => {
      // A newer file or language pair has taken over; this answer is stale.
      if (controller.signal.aborted) return;
      setAnalysis(result);
      setStatus(result ? "ready" : "failed");
    });

    return () => controller.abort();
  }, [enabled, fileUri, mimeType, sourceLanguageId, targetLanguageId, outputLanguageId]);

  const waitForResult = useCallback(
    async () => (pending.current ? pending.current : null),
    []
  );

  return { status, analysis, waitForResult };
}
