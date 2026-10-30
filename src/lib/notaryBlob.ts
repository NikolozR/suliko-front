/**
 * Files for the notary section that are too big to pass through a Vercel
 * function. A function refuses a request body over 4.5 MB (413
 * FUNCTION_PAYLOAD_TOO_LARGE) before our code runs, so the browser sends such a
 * file straight to a private Vercel Blob store instead, and the routes that
 * need it read it back from there, server to server, where no such cap exists.
 *
 * Server side only. The browser half is src/shared/utils/notaryBlobUpload.ts.
 */
import { del, get } from '@vercel/blob';

/** Every notary upload lives under this folder of the store. */
export const NOTARY_BLOB_PREFIX = 'notary/';

/** Matches the UI's promise (10 MB) with room to spare; the store refuses more. */
export const MAX_NOTARY_BLOB_BYTES = 20 * 1024 * 1024;

/**
 * What one email may carry. Resend refuses messages over 40 MB, and attachments
 * grow by a third when encoded, so stay well under.
 */
export const MAX_NOTARY_ATTACHMENT_BYTES = 25 * 1024 * 1024;

/** Same list as the order wizard (notaryOrderConfig.ts), plus the upload form's .txt. */
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png'];

export function isAllowedNotaryPath(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  return lower.startsWith(NOTARY_BLOB_PREFIX) && ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/** Only addresses inside our own store's notary folder are ever fetched or deleted. */
export function isNotaryBlobUrl(raw: unknown): raw is string {
  if (typeof raw !== 'string') return false;
  try {
    const url = new URL(raw);
    return (
      url.protocol === 'https:' &&
      url.hostname.endsWith('.blob.vercel-storage.com') &&
      decodeURIComponent(url.pathname).startsWith(`/${NOTARY_BLOB_PREFIX}`)
    );
  } catch {
    return false;
  }
}

/** What the visitor called the file, made safe to show and to use as an attachment name. */
export function cleanFileName(raw: unknown, fallback = 'document'): string {
  const name = typeof raw === 'string' ? raw.replace(/[\\/\u0000-\u001f]/g, '_').trim() : '';
  return name.slice(0, 150) || fallback;
}

export interface NotaryBlobFile {
  url: string;
  name: string;
}

/** Reads the `blob_files` form field: a JSON list of { url, name }. Bad entries are dropped. */
export function parseBlobFiles(raw: unknown): NotaryBlobFile[] {
  if (typeof raw !== 'string' || !raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((item): item is { url: string; name?: unknown } => !!item && isNotaryBlobUrl((item as { url?: unknown }).url))
    .slice(0, 20)
    .map((item) => ({ url: item.url, name: cleanFileName(item.name) }));
}

export interface LoadedBlob {
  name: string;
  contentType: string;
  buffer: Buffer;
}

/** Downloads a stored file. Null when it is gone (expired, or already deleted). */
export async function loadNotaryBlob(file: NotaryBlobFile): Promise<LoadedBlob | null> {
  const result = await get(file.url, { access: 'private' });
  if (!result || result.statusCode !== 200) return null;
  const buffer = Buffer.from(await new Response(result.stream).arrayBuffer());
  return { name: file.name, contentType: result.blob.contentType, buffer };
}

/** Best effort: the files are only needed until the email is out. */
export async function deleteNotaryBlobs(files: NotaryBlobFile[]): Promise<void> {
  if (files.length === 0) return;
  try {
    await del(files.map((f) => f.url));
  } catch (err) {
    console.error('[notary-blob] could not delete uploaded files:', err);
  }
}
