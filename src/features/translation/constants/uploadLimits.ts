/**
 * The one place the document upload size limit is defined.
 *
 * There used to be three disagreeing numbers: the zod schema allowed 50MB,
 * `handleFileChange` toasted a hard error above 10MB, and the dropzone copy
 * stated no limit at all. A user could pass the schema, pass the toast, and
 * still fail at the upload itself.
 *
 * 4.5MB is set from observed behaviour — files above roughly 4MB are reported
 * as blocked in production. See the note on MAX_DOCUMENT_UPLOAD_BYTES below
 * for why that number is worth re-testing rather than treated as permanent.
 */

/**
 * Hard ceiling for a document translation upload.
 *
 * NOTE — this is almost certainly lower than the architecture allows.
 *
 * The bytes do not cross our own API: `openUploadSession` posts a few hundred
 * bytes of JSON to /api/gemini-upload and the browser then PUTs the file
 * straight to Google, specifically so Vercel's ~4.5MB request body cap stops
 * being the ceiling. On that path the real limit is Gemini's, which is far
 * higher.
 *
 * The only 4MB rule in the client is `PROXY_FALLBACK_LIMIT_BYTES` in
 * geminiUploadService, and it applies solely to the fallback used when the
 * browser cannot reach Google at all. So if uploads above ~4MB really are
 * failing in production, the direct upload is silently failing and every file
 * is going through the proxy — which would mean the whole point of that change
 * is not working, and the fix belongs there rather than in this constant.
 *
 * `logDirectUploadFailure` in geminiUploadService now makes that case loud.
 * Once a >4.5MB upload is confirmed working end to end, raise this.
 */
export const MAX_DOCUMENT_UPLOAD_BYTES = 4.5 * 1024 * 1024;

export const MAX_DOCUMENT_UPLOAD_MB = MAX_DOCUMENT_UPLOAD_BYTES / (1024 * 1024);

/** Formats a byte count for user-facing copy, e.g. "4.5 MB", "820 KB". */
export const formatBytes = (bytes: number): string =>
  bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MB`;
