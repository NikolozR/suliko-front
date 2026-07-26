import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/shared/constants/api";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_UPLOAD_URL =
  "https://generativelanguage.googleapis.com/upload/v1beta/files";
const GEMINI_UPLOAD_HOST = "generativelanguage.googleapis.com";

/**
 * This route only *opens* a Gemini resumable upload session; the browser then sends the
 * file bytes straight to Google. It deliberately never receives the file itself.
 *
 * Proxying the bytes through here used to fail for anything over ~4.5MB: Vercel caps a
 * serverless function's request body at that size and rejects it at the edge with a 413
 * before this handler ever runs. (`serverActions.bodySizeLimit` in next.config.ts does not
 * apply to route handlers.) Uploading direct-to-Google removes that ceiling entirely and
 * skips a full extra copy of every file.
 *
 * The session URL Google returns is safe to hand to the browser: it authenticates the
 * upload on its own and carries no API key. We assert that below rather than trusting it.
 */
export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Gemini API key not configured" },
      { status: 500 }
    );
  }

  // Opening a session spends Suliko's Gemini quota, so it requires a real logged-in user.
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let subscriptionCheck: Response;
  try {
    subscriptionCheck = await fetch(`${API_BASE_URL}/Subscription/me`, {
      headers: { Authorization: authorization },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: "Could not verify authentication" },
      { status: 502 }
    );
  }

  if (!subscriptionCheck.ok) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Legacy path: the client falls back to proxying bytes through here if it cannot reach
  // Google directly (e.g. the browser blocks the cross-origin upload). Only works below
  // Vercel's ~4.5MB body cap, which is exactly why it is the fallback and not the default.
  if (request.headers.get("content-type")?.includes("multipart/form-data")) {
    return proxyUpload(request);
  }

  let body: { fileName?: string; mimeType?: string; sizeBytes?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const displayName = body.fileName?.trim();
  const mimeType = body.mimeType?.trim() || "application/octet-stream";
  const sizeBytes = body.sizeBytes;

  if (!displayName) {
    return NextResponse.json({ error: "fileName is required" }, { status: 400 });
  }

  if (typeof sizeBytes !== "number" || !Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return NextResponse.json(
      { error: "sizeBytes must be a positive number" },
      { status: 400 }
    );
  }

  const initResponse = await fetch(
    `${GEMINI_UPLOAD_URL}?uploadType=resumable&key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": String(sizeBytes),
        "X-Goog-Upload-Header-Content-Type": mimeType,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ file: { display_name: displayName } }),
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

  const rawUploadUrl = initResponse.headers.get("x-goog-upload-url");
  if (!rawUploadUrl) {
    return NextResponse.json(
      { error: "No upload URL returned by Gemini" },
      { status: 502 }
    );
  }

  // Never hand the browser a URL that points somewhere unexpected or that carries
  // credentials, even if Google's response format changes.
  let uploadUrl: URL;
  try {
    uploadUrl = new URL(rawUploadUrl);
  } catch {
    return NextResponse.json(
      { error: "Gemini returned a malformed upload URL" },
      { status: 502 }
    );
  }

  if (uploadUrl.protocol !== "https:" || uploadUrl.hostname !== GEMINI_UPLOAD_HOST) {
    console.error("[gemini-upload] Unexpected upload host:", uploadUrl.hostname);
    return NextResponse.json(
      { error: "Gemini returned an unexpected upload host" },
      { status: 502 }
    );
  }

  for (const param of ["key", "apiKey", "api_key"]) {
    if (uploadUrl.searchParams.has(param)) {
      console.warn(
        "[gemini-upload] Stripping unexpected credential param from upload URL:",
        param
      );
      uploadUrl.searchParams.delete(param);
    }
  }

  return NextResponse.json({
    uploadUrl: uploadUrl.toString(),
    mimeType,
    displayName,
  });
}

/**
 * Streams the file through this function to Gemini and returns the finished file URI.
 * Subject to Vercel's request-body cap, so it is only reachable as a fallback.
 */
async function proxyUpload(request: NextRequest): Promise<NextResponse> {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const mimeType = file.type || "application/octet-stream";
  const fileBuffer = await file.arrayBuffer();

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
      body: JSON.stringify({ file: { display_name: file.name } }),
    }
  );

  const uploadUrl = initResponse.ok
    ? initResponse.headers.get("x-goog-upload-url")
    : null;

  if (!uploadUrl) {
    console.error("[gemini-upload] Fallback init failed:", await initResponse.text());
    return NextResponse.json(
      { error: "Failed to initiate Gemini upload" },
      { status: 502 }
    );
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
      "Content-Type": mimeType,
    },
    body: fileBuffer,
  });

  if (!uploadResponse.ok) {
    console.error("[gemini-upload] Fallback upload failed:", await uploadResponse.text());
    return NextResponse.json(
      { error: "Failed to upload file to Gemini" },
      { status: 502 }
    );
  }

  const fileUri: string | undefined = (await uploadResponse.json())?.file?.uri;
  if (!fileUri) {
    return NextResponse.json(
      { error: "Gemini did not return a file URI" },
      { status: 502 }
    );
  }

  return NextResponse.json({ fileUri, mimeType, displayName: file.name });
}
