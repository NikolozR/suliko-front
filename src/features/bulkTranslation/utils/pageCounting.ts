import { countPages } from "@/features/translation/services/countPagesService";
import { getExtension } from "./folderScanning";

/**
 * Page count drives both the price and the time estimate, so it has to be right — sending 1
 * for a 40-page document would undercharge the user and badly misreport progress.
 *
 * PDFs are counted in the browser. The server endpoint would also work, but it takes the
 * whole file as an upload: for a folder of fifty 8MB scans that is another 400MB pushed
 * over the wire purely to learn a number the browser can read from the file's own index.
 */
export const countPagesForFile = async (file: File): Promise<number> => {
  if (getExtension(file.name) === ".pdf") {
    const clientCount = await countPdfPagesInBrowser(file);
    if (clientCount !== null) return clientCount;
  }

  // Everything else (and any PDF we couldn't parse) falls back to the server, which is the
  // same path the single-document flow uses.
  try {
    const result = await countPages(file);
    return Math.max(1, result?.pageCount ?? 1);
  } catch {
    // A failed count must not block the batch; the backend clamps to at least one page.
    return 1;
  }
};

/**
 * Returns null when the PDF cannot be parsed locally — encrypted files being the common
 * case — so the caller can fall back to the server rather than reporting a wrong count.
 */
const countPdfPagesInBrowser = async (file: File): Promise<number | null> => {
  try {
    const { PDFDocument } = await import("pdf-lib");
    const bytes = await file.arrayBuffer();
    // Encrypted PDFs throw unless this is set; we only read the page count, never content.
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const count = pdf.getPageCount();
    return count > 0 ? count : null;
  } catch {
    return null;
  }
};
