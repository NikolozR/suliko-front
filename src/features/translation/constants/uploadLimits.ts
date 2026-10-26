/**
 * The one place the document upload size limit is defined.
 *
 * There used to be three disagreeing numbers: the zod schema allowed 50MB,
 * `handleFileChange` toasted a hard error above 10MB, and the dropzone copy
 * stated no limit at all. A file could pass the schema, pass the toast, and
 * still fail at the upload itself.
 */

/**
 * Hard ceiling for a document translation upload — the backend's own limit on
 * POST /Document/prepare-upload, which rejects anything larger with a 400.
 *
 * This was 4.5MB while the browser uploaded straight to Google. That path
 * never worked: it failed for every file, 0.2MB included, and each upload
 * silently fell back to a Vercel-hosted proxy capped at 4MB — which is why
 * larger files looked "blocked". The bytes now go to our own API instead, so
 * neither Vercel's request-body cap nor Google's CORS behaviour is in the
 * path, and the real limit is the backend's.
 */
export const MAX_DOCUMENT_UPLOAD_BYTES = 20 * 1024 * 1024;

export const MAX_DOCUMENT_UPLOAD_MB = MAX_DOCUMENT_UPLOAD_BYTES / (1024 * 1024);

/** Formats a byte count for user-facing copy, e.g. "4.5 MB", "820 KB". */
export const formatBytes = (bytes: number): string =>
  bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MB`;

/**
 * What the document upload takes. The picker's `accept`, the drop zone and the
 * drop handler all read this list, so a file the picker would have refused can
 * no longer get in by being dragged.
 */
export const ACCEPTED_DOCUMENT_EXTENSIONS = [
  "pdf", "docx", "doc", "txt", "md", "markdown", "srt", "jpg", "jpeg", "png",
] as const;

export const DOCUMENT_ACCEPT_ATTRIBUTE = ACCEPTED_DOCUMENT_EXTENSIONS.map((e) => `.${e}`).join(",");

export const isAcceptedDocumentName = (name: string): boolean => {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return (ACCEPTED_DOCUMENT_EXTENSIONS as readonly string[]).includes(ext);
};

/**
 * While a file is still being dragged the browser shows only its MIME type,
 * never its name, and an empty type is common for .md and .srt. So a drag is
 * judged "unsupported" only when every item has a real type we do not take.
 */
const ACCEPTED_DRAG_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "image/jpeg",
  "image/png",
  "application/x-subrip",
]);

export const isDragLikelyUnsupported = (items: DataTransferItemList | undefined): boolean => {
  if (!items || items.length === 0) return false;
  return Array.from(items).every((i) => i.kind === "file" && i.type !== "" && !ACCEPTED_DRAG_TYPES.has(i.type));
};
