"use client";

import { useEffect, useRef, useState } from "react";

import { searchTranslations, type TranslationHit } from "../services/searchService";

const DEBOUNCE_MS = 250;

/**
 * The person's translations matching `query`, a quarter-second after typing
 * stops. An empty query asks for nothing. Only the answer to what is in the
 * box now is kept; a slow earlier reply cannot overwrite a newer one.
 */
export function useTranslationSearch(query: string) {
  const [hits, setHits] = useState<TranslationHit[]>([]);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const latest = useRef("");

  useEffect(() => {
    const trimmed = query.trim();
    latest.current = trimmed;
    if (!trimmed) {
      setHits([]);
      setPending(false);
      setFailed(false);
      return;
    }
    const controller = new AbortController();
    setPending(true);
    const timer = window.setTimeout(async () => {
      try {
        const found = await searchTranslations(trimmed, controller.signal);
        if (latest.current === trimmed) {
          setHits(found);
          setFailed(false);
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError" && latest.current === trimmed) {
          setHits([]);
          setFailed(true);
        }
      } finally {
        if (latest.current === trimmed) setPending(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return { hits, pending, failed };
}
