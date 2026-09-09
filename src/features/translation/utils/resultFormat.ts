/**
 * What format a finished translation is actually in.
 *
 * The download used to decide this from `currentFile` — the file sitting in the upload
 * form right now. In the live flow that happens to be the document being translated, so it
 * looked correct. Opening an old translation from history it is not: it is whatever the
 * user has since picked, or nothing at all. An SRT translation opened from history was
 * offered as a document, and a document opened while an SRT sat in the form was offered
 * as subtitles.
 *
 * The server already says what it produced, on `translationResult.outputFormat`, and that
 * is the answer for a result — the request format is not, because the server does not
 * always return what was asked for (an HTML output that fails to build comes back as
 * Markdown).
 */

/** `DocumentFormat` on the API. Numbers are the contract; do not renumber. */
export const DOCUMENT_FORMAT = {
  Pdf: 0,
  Word: 1,
  Markdown: 2,
  Srt: 3,
  Txt: 4,
  Html: 5,
  RichPdf: 6,
} as const;

/**
 * Whether a finished translation is subtitles, and so downloads as `.srt` rather than
 * going through the document format picker.
 *
 * `outputFormat` wins when present. The file name is only a fallback, for records written
 * before the format was carried on the result — without it, those would silently start
 * downloading as plain documents.
 */
export function isSrtResult(
  outputFormat: number | null | undefined,
  originalFileName?: string | null,
): boolean {
  if (typeof outputFormat === "number") {
    return outputFormat === DOCUMENT_FORMAT.Srt;
  }

  return originalFileName?.split(".").pop()?.toLowerCase() === "srt";
}
