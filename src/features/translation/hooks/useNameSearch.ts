import { useCallback, useEffect, useRef } from "react";
import { findNames } from "../services/findNamesService";
import type { NameTranslationItem } from "../types/types.Translation";

interface Options {
  fileUri: string | null | undefined;
  mimeType: string | null | undefined;
  sourceLanguageId: number;
  targetLanguageId: number;
  /** False skips the search entirely (names review off, subtitles, signed out). */
  enabled: boolean;
}

/**
 * Looks for the names in a document as soon as the server holds it, and again when the language
 * pair changes (the suggested renderings depend on it), so the confirm-names dialog is usually
 * ready by the time translate is pressed.
 *
 * Nothing is shown while it runs: names are a review step, not a card on the page.
 * `waitForResult` lets the submit path reuse a search that is already in flight, and follows the
 * newest one when a language change has replaced the one it was asked about.
 */
export function useNameSearch({ fileUri, mimeType, sourceLanguageId, targetLanguageId, enabled }: Options) {
  const pending = useRef<Promise<NameTranslationItem[] | null> | null>(null);

  useEffect(() => {
    if (!enabled || !fileUri || !mimeType) {
      pending.current = null;
      return;
    }

    const controller = new AbortController();
    pending.current = findNames({
      fileUri,
      mimeType,
      sourceLanguageId,
      targetLanguageId,
      signal: controller.signal,
    });

    return () => controller.abort();
  }, [enabled, fileUri, mimeType, sourceLanguageId, targetLanguageId]);

  const waitForResult = useCallback(async (): Promise<NameTranslationItem[] | null> => {
    let request = pending.current;
    while (request) {
      const result = await request;
      if (result) return result;
      if (pending.current === request) return null;
      request = pending.current;
    }
    return null;
  }, []);

  return { waitForResult };
}
