"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fetchOrderFile } from "./api";
import type { OrderFile } from "./types";

/**
 * How many pages a PDF of an order really has.
 *
 * The order carries a page count of its own, the bureau's, which is what the
 * work is counted in and need not be the file's: a "1 page" document can be a
 * four-page PDF. Nothing on the server knows the file's count, so it is read
 * from the file here, once, and remembered in this browser (a file's id never
 * comes to mean another file).
 */

type PagesState = {
  pages: Record<string, number>;
  learned: (fileId: string, count: number) => void;
};

export const useOrderFilePages = create<PagesState>()(
  persist(
    (set) => ({
      pages: {},
      learned: (fileId, count) => set((state) => ({ pages: { ...state.pages, [fileId]: count } })),
    }),
    { name: "suliko:order-file-pages" },
  ),
);

const isPdf = (name: string) => /\.pdf$/i.test(name);

/** Read a PDF's page count and remember it. Anything else, or a PDF that will not open, is left unknown. */
export async function learnPdfPages(fileId: string, file: File): Promise<void> {
  if (!isPdf(file.name) || useOrderFilePages.getState().pages[fileId]) return;
  try {
    const { pdfjs } = await import("react-pdf");
    // The same worker the document viewer sets up.
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
    const opened = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const count = opened.numPages;
    await opened.destroy();
    if (count > 0) useOrderFilePages.getState().learned(fileId, count);
  } catch {
    // Not knowing costs one small figure beside the file's size.
  }
}

/**
 * Small PDFs are counted as soon as the order is on screen, which means
 * fetching them. Larger ones are counted when someone opens them: fetching a
 * 20 MB scan to print one figure would be poor use of a phone's data.
 */
const COUNTED_UNOPENED_BYTES = 3 * 1024 * 1024;

/** In flight, so two parts of the page asking about one file fetch it once. */
const counting = new Set<string>();

export async function countPagesUnopened(
  slug: string,
  orderId: number,
  documentId: number,
  file: OrderFile,
): Promise<void> {
  if (
    !isPdf(file.name) ||
    !file.downloadable ||
    (file.size_bytes ?? Infinity) > COUNTED_UNOPENED_BYTES ||
    useOrderFilePages.getState().pages[file.id] ||
    counting.has(file.id)
  ) {
    return;
  }
  counting.add(file.id);
  try {
    const loaded = await fetchOrderFile(slug, orderId, documentId, file);
    if (loaded.status === "ok") await learnPdfPages(file.id, loaded.file);
  } finally {
    counting.delete(file.id);
  }
}
