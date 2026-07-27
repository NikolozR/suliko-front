import { saveAs } from "file-saver";
import { getChatById } from "@/features/chatHistory";
import { BatchItem } from "../types/types.Bulk";

export type BulkDownloadFormat = "md" | "txt" | "docx" | "pdf";

export interface BulkDownloadProgress {
  completed: number;
  total: number;
  currentFile: string;
}

export interface BulkDownloadResult {
  /** Documents written into the zip. */
  succeeded: number;
  /** Documents that could not be fetched or converted, with the reason. */
  failed: Array<{ fileName: string; reason: string }>;
}

/**
 * PDF generation renders each document through html2canvas, which is far slower than the
 * other formats and holds a full canvas in memory while it works. Past this many documents
 * the UI warns before starting rather than appearing to freeze.
 */
export const PDF_SLOW_THRESHOLD = 15;

const markdownToHtml = async (content: string): Promise<string> => {
  // Translations come back as either HTML or Markdown depending on the chosen output
  // format, and the HTML ones must not be run through the Markdown parser again.
  if (content.trimStart().startsWith("<")) return content;

  const { marked } = await import("marked");
  return marked(content, { async: false });
};

/** Word-compatible wrapper, matching the single-document DOCX export. */
const buildDocxHtml = (bodyHtml: string): string => `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <style>
    body  { font-family: Calibri, sans-serif; font-size: 11pt; }
    h1    { font-size: 16pt; }
    h2    { font-size: 14pt; }
    h3    { font-size: 12pt; }
    p     { margin: 0 0 8pt 0; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1pt solid #aaa; padding: 4pt 8pt; }
  </style>
</head>
<body>${bodyHtml}</body>
</html>`;

const convertContent = async (
  content: string,
  format: BulkDownloadFormat,
  fileName: string
): Promise<Blob | string> => {
  switch (format) {
    case "md":
      return content;

    case "txt":
      // Strip tags so an HTML-format translation still downloads as readable plain text.
      return content.replace(/<[^>]+>/g, "");

    case "docx": {
      const html = await markdownToHtml(content);
      // @ts-expect-error html-docx-js ships no types
      const htmlDocx = (await import("html-docx-js/dist/html-docx")).default;
      return htmlDocx.asBlob(buildDocxHtml(html)) as Blob;
    }

    case "pdf": {
      const html = await markdownToHtml(content);
      const { generatePdfBlobFromHtml } = await import(
        "@/features/translation/utils/html2pdf-client"
      );
      return generatePdfBlobFromHtml(html, fileName);
    }
  }
};

/**
 * Rewrites a source path to the translated output path, preserving folder structure.
 * "contracts/2024/lease.pdf" with suffix "translated" becomes
 * "contracts/2024/lease_translated.docx".
 */
export const buildOutputPath = (
  relativePath: string,
  fileName: string,
  format: BulkDownloadFormat,
  translatedSuffix: string
): string => {
  const source = relativePath || fileName;
  const lastSlash = source.lastIndexOf("/");
  const folder = lastSlash === -1 ? "" : source.slice(0, lastSlash + 1);
  const base = source.slice(lastSlash + 1).replace(/\.[^/.]+$/, "");

  return `${folder}${base}_${translatedSuffix}.${format}`;
};

/**
 * Zip entries must be unique. Two source files that differ only by extension
 * (report.doc and report.pdf) collapse onto the same output name, and JSZip would
 * silently keep only the last one — losing a translation the user paid for.
 */
const makeUnique = (path: string, taken: Set<string>): string => {
  if (!taken.has(path)) {
    taken.add(path);
    return path;
  }

  const dot = path.lastIndexOf(".");
  const base = dot === -1 ? path : path.slice(0, dot);
  const ext = dot === -1 ? "" : path.slice(dot);

  let counter = 2;
  let candidate = `${base} (${counter})${ext}`;
  while (taken.has(candidate)) {
    counter += 1;
    candidate = `${base} (${counter})${ext}`;
  }

  taken.add(candidate);
  return candidate;
};

/**
 * A finished translation that can go into a zip.
 *
 * Deliberately not tied to a batch: the same download works for a project's translations,
 * which arrive as chats and have no batch, no ordering and no folder structure.
 */
export interface DownloadableDocument {
  /** The chat holding the translated content. */
  chatId: string;
  /** Name to base the output filename on, normally the original upload's name. */
  fileName: string;
  /** Folder path to mirror in the zip. Absent for documents not uploaded as a folder. */
  relativePath?: string | null;
}

/**
 * Fetches each translation, converts it to the chosen format, and saves them as one zip,
 * mirroring folder structure where the documents have any.
 */
export const downloadDocumentsAsZip = async (
  documents: DownloadableDocument[],
  format: BulkDownloadFormat,
  zipName: string,
  translatedSuffix: string,
  onProgress?: (progress: BulkDownloadProgress) => void
): Promise<BulkDownloadResult> => {
  const completed = documents;

  if (completed.length === 0) {
    return { succeeded: 0, failed: [] };
  }

  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const takenPaths = new Set<string>();
  const failed: BulkDownloadResult["failed"] = [];
  let succeeded = 0;

  // Sequential rather than parallel: PDF conversion is CPU-bound and renders through the
  // DOM, so running several at once makes the whole tab unresponsive without finishing
  // any sooner.
  for (const [index, item] of completed.entries()) {
    onProgress?.({
      completed: index,
      total: completed.length,
      currentFile: item.fileName,
    });

    try {
      const chat = await getChatById(item.chatId);
      const content = chat.data?.translationResult?.translatedContent;

      if (!content) {
        failed.push({
          fileName: item.fileName,
          reason: "No translated content was returned",
        });
        continue;
      }

      const outputPath = makeUnique(
        buildOutputPath(
          item.relativePath || item.fileName,
          item.fileName,
          format,
          translatedSuffix
        ),
        takenPaths
      );

      const converted = await convertContent(content, format, outputPath);
      zip.file(outputPath, converted);
      succeeded += 1;
    } catch (error) {
      failed.push({
        fileName: item.fileName,
        reason: error instanceof Error ? error.message : "Conversion failed",
      });
    }
  }

  onProgress?.({
    completed: completed.length,
    total: completed.length,
    currentFile: "",
  });

  if (succeeded === 0) {
    return { succeeded, failed };
  }

  // A manifest of what didn't make it, so a partial download is self-explaining rather
  // than leaving the user to work out which documents are missing.
  if (failed.length > 0) {
    zip.file(
      "_missing-documents.txt",
      [
        "These documents could not be included in this download:",
        "",
        ...failed.map((f) => `- ${f.fileName}: ${f.reason}`),
      ].join("\n")
    );
  }

  const blob = await zip.generateAsync({ type: "blob" });

  // Statically imported, unlike the other libraries here. file-saver is CommonJS, and
  // `await import("file-saver")` puts the function on `.default` while leaving `.saveAs`
  // undefined — so destructuring it dynamically silently yields undefined and the call
  // fails at the very end, after every document has already been converted. The static
  // form goes through webpack's named-export interop and is what the rest of the codebase
  // uses.
  saveAs(blob, `${zipName}.zip`);

  return { succeeded, failed };
};

/** Downloads the finished translations in a batch, keeping the uploaded folder structure. */
export const downloadBatchAsZip = async (
  items: BatchItem[],
  format: BulkDownloadFormat,
  zipName: string,
  translatedSuffix: string,
  onProgress?: (progress: BulkDownloadProgress) => void
): Promise<BulkDownloadResult> => {
  const documents: DownloadableDocument[] = items
    .filter((item) => item.status === "Completed" && item.chatId)
    .map((item) => ({
      chatId: item.chatId!,
      fileName: item.fileName,
      relativePath: item.relativePath,
    }));

  return downloadDocumentsAsZip(
    documents,
    format,
    zipName,
    translatedSuffix,
    onProgress
  );
};
