import { NextResponse } from 'next/server';
import { handleUploadPresigned, type HandleUploadPresignedBody } from '@vercel/blob/client';
import { issueSignedToken } from '@vercel/blob';
import { MAX_NOTARY_BLOB_BYTES, isAllowedNotaryPath } from '@/lib/notaryBlob';

/**
 * Hands the browser a short-lived signed address to put ONE file into the
 * private notary folder of the Blob store. The store signs in with the
 * project's own identity (BLOB_STORE_ID), so there is no secret token. The
 * file itself never passes through here, which is the point: this site's
 * functions refuse bodies over 4.5 MB.
 *
 * Open to visitors without an account, like the forms it serves, so the signed
 * address only allows what those forms allow: the notary folder, the same file types,
 * one file of at most 20 MB.
 */
export async function POST(request: Request) {
  if (!process.env.BLOB_STORE_ID) {
    console.error('[notary-upload/blob] BLOB_STORE_ID is not set');
    return NextResponse.json({ error: 'Large uploads are not configured' }, { status: 503 });
  }

  try {
    const body = (await request.json()) as HandleUploadPresignedBody;
    const result = await handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pathname) => {
        if (!isAllowedNotaryPath(pathname)) {
          throw new Error('This kind of file cannot be uploaded');
        }
        return {
          token: await issueSignedToken({
            pathname,
            operations: ['put'],
            maximumSizeInBytes: MAX_NOTARY_BLOB_BYTES,
            validUntil: Date.now() + 15 * 60 * 1000,
          }),
          urlOptions: { addRandomSuffix: true },
        };
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Upload refused' }, { status: 400 });
  }
}
