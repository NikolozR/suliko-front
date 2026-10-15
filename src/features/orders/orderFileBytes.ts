"use client";

import { useEffect, useState } from "react";
import { fetchOrderFile } from "./api";
import { learnPdfPages } from "./orderFilePages";
import type { OrderFile } from "./types";

/**
 * The bytes of an order's file, for showing it on the page.
 *
 * The files last looked at are kept, so going back and forth between an
 * original and its translation does not fetch each again. A handful only:
 * these are whole files held in memory.
 */
const KEPT = 4;
const kept = new Map<string, File>();

function keep(key: string, file: File): void {
  kept.delete(key);
  kept.set(key, file);
  while (kept.size > KEPT) kept.delete(kept.keys().next().value as string);
}

export type OrderFileBytes = { status: "loading" } | { status: "failed" } | { status: "ok"; file: File };

type Settled = { key: string; file: File } | { key: string; failed: true };

/** One file of an order, fetched: loading, then the file or a failure. */
export function useOrderFile(
  slug: string,
  orderId: number,
  documentId: number,
  file: OrderFile,
): OrderFileBytes {
  const key = `${slug}/${orderId}/${documentId}/${file.id}`;
  const [settled, setSettled] = useState<Settled | null>(null);

  useEffect(() => {
    const known = kept.get(key);
    if (known) {
      setSettled({ key, file: known });
      return;
    }
    let cancelled = false;
    fetchOrderFile(slug, orderId, documentId, file).then((result) => {
      if (cancelled) return;
      if (result.status === "ok") {
        keep(key, result.file);
        setSettled({ key, file: result.file });
        // The bytes are here anyway: a PDF too large to count unopened is counted now.
        void learnPdfPages(file.id, result.file);
      } else {
        setSettled({ key, failed: true });
      }
    });
    return () => {
      cancelled = true;
    };
    // `key` names the file; the rest are its parts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // What was fetched for another file is not this file's.
  if (settled?.key !== key) return { status: "loading" };
  return "failed" in settled ? { status: "failed" } : { status: "ok", file: settled.file };
}
