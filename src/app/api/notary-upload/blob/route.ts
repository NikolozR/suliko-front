import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { MAX_NOTARY_BLOB_BYTES, isAllowedNotaryPath } from '@/lib/notaryBlob';

/**
 * Hands the browser a short-lived token to put ONE file into the private
 * notary folder of the Blob store. The file itself never passes through here,
 * which is the point: this site's functions refuse bodies over 4.5 MB.
 *
 * Open to visitors without an account, like the forms it serves, so the token
 * only allows what those forms allow: the notary folder, the same file types,
 * one file of at most 20 MB.
 */
export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('[notary-upload/blob] BLOB_READ_WRITE_TOKEN is not set');
    return NextResponse.json({ error: 'Large uploads are not configured' }, { status: 503 });
  }

  try {
    const body = (await request.json()) as HandleUploadBody;
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!isAllowedNotaryPath(pathname)) {
          throw new Error('This kind of file cannot be uploaded');
        }
        return {
          maximumSizeInBytes: MAX_NOTARY_BLOB_BYTES,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Upload refused' }, { status: 400 });
  }
}
