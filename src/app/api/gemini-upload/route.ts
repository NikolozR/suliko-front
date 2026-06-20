import { del } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_UPLOAD_URL =
  "https://generativelanguage.googleapis.com/upload/v1beta/files";

// Receives a Vercel Blob URL, downloads the file (no incoming size limit on
// outgoing fetches from the server), then uploads to Gemini in one shot.
export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Gemini API key not configured" },
      { status: 500 }
    );
  }

  let body: { blobUrl: string; fileName: string; mimeType: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { blobUrl, fileName, mimeType } = body;
  if (!blobUrl || !fileName || !mimeType) {
    return NextResponse.json(
      { error: "Missing required fields: blobUrl, fileName, mimeType" },
      { status: 400 }
    );
  }

  // Fetch the file from Vercel Blob — outgoing request, no Vercel body limit.
  const blobResponse = await fetch(blobUrl);
  if (!blobResponse.ok) {
    return NextResponse.json(
      { error: "Failed to fetch file from Blob storage" },
      { status: 502 }
    );
  }
  const fileBuffer = await blobResponse.arrayBuffer();

  // Delete the blob immediately — it's only needed for this transfer.
  del(blobUrl).catch(() => {});

  // Init resumable upload session with Gemini.
  const initResponse = await fetch(
    `${GEMINI_UPLOAD_URL}?uploadType=resumable&key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": String(fileBuffer.byteLength),
        "X-Goog-Upload-Header-Content-Type": mimeType,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ file: { display_name: fileName } }),
    }
  );

  if (!initResponse.ok) {
    const errorText = await initResponse.text();
    console.error("[gemini-upload] Init failed:", errorText);
    return NextResponse.json(
      { error: "Failed to initiate Gemini upload" },
      { status: 502 }
    );
  }

  const uploadUrl = initResponse.headers.get("x-goog-upload-url");
  if (!uploadUrl) {
    return NextResponse.json(
      { error: "No upload URL returned by Gemini" },
      { status: 502 }
    );
  }

  // Upload all bytes in one request — outgoing from server, no size limit.
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
      "Content-Length": String(fileBuffer.byteLength),
      "Content-Type": mimeType,
    },
    body: fileBuffer,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error("[gemini-upload] Upload failed:", errorText);
    return NextResponse.json(
      { error: "Failed to upload file to Gemini" },
      { status: 502 }
    );
  }

  const uploadResult = await uploadResponse.json();
  const fileUri: string = uploadResult?.file?.uri;

  if (!fileUri) {
    return NextResponse.json(
      { error: "Gemini did not return a file URI" },
      { status: 502 }
    );
  }

  return NextResponse.json({ fileUri, mimeType, displayName: fileName });
}
