/**
 * Browser half of src/lib/notaryBlob.ts: sends a file too big for a Vercel
 * function (4.5 MB request cap) straight to a private Blob store, and hands back
 * the address the notary routes then read it from.
 */
import { upload } from '@vercel/blob/client';

/** Under Vercel's 4.5 MB body cap with room for the other form fields. */
export const DIRECT_UPLOAD_LIMIT_BYTES = 4 * 1024 * 1024;

export interface UploadedBlob {
  url: string;
  name: string;
}

export function needsBlobUpload(files: File[]): boolean {
  return files.reduce((sum, f) => sum + f.size, 0) > DIRECT_UPLOAD_LIMIT_BYTES;
}

export async function uploadToNotaryBlob(file: File): Promise<UploadedBlob> {
  // The store gets an address-safe name; the visitor's own name travels beside it.
  const safeName = file.name.replace(/[^\w.-]+/g, '_').slice(-80);
  const result = await upload(`notary/${safeName}`, file, {
    access: 'private',
    handleUploadUrl: '/api/notary-upload/blob',
    multipart: file.size > 8 * 1024 * 1024,
  });
  return { url: result.url, name: file.name };
}

/**
 * Puts the files on a form for /api/notary-upload. Small ones ride along as
 * they always did; when together they would pass the function's body cap, each
 * goes to the Blob store and the form carries their addresses in `blob_files`.
 * Throws when a file cannot be uploaded, so the caller shows its usual error.
 */
export async function appendNotaryFiles(form: FormData, files: File[]): Promise<void> {
  if (!needsBlobUpload(files)) {
    files.forEach((file) => form.append('files', file, file.name));
    return;
  }
  const uploaded: UploadedBlob[] = [];
  for (const file of files) uploaded.push(await uploadToNotaryBlob(file));
  form.append('blob_files', JSON.stringify(uploaded));
}
