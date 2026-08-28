"use client";

import { useEffect, useState } from "react";
import type { OrderReference } from "./notaryOrderApi";
import { loadReference, sourcesFor } from "./notaryReferenceData";

/**
 * The partner catalogue, shared by every component that quotes or claims a
 * price. `loadReference` de-dupes concurrent callers and caches for 6 h, so
 * mounting this in several places costs one request.
 */
export function useNotaryReference() {
  const [reference, setReference] = useState<OrderReference | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    loadReference().then(({ reference: ref }) => {
      if (!mounted) return;
      setReference(ref);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return {
    reference,
    loading,
    /** Languages with at least one published pair — what we can actually sell. */
    languages: reference ? sourcesFor(reference) : [],
    directions: reference?.language_pairs.length ?? 0,
  };
}
