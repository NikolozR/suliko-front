import { NextRequest, NextResponse } from "next/server";

// Streams the raw file body directly to Gemini's resumable upload URL.
// Sending raw bytes (not multipart form) avoids Next.js body-parser size
// limits that would otherwise reject files larger than ~4 MB.
export async function POST(request: NextRequest) {
  const uploadUrl = request.headers.get("x-goog-upload-url");
  const mimeType =
    request.headers.get("x-file-mime-type") || "application/octet-stream";
  const contentLength = request.headers.get("content-length");

  if (!uploadUrl) {
    return NextResponse.json(
      { error: "Missing x-goog-upload-url header" },
      { status: 400 }
    );
  }

  const headers: Record<string, string> = {
    "X-Goog-Upload-Offset": "0",
    "X-Goog-Upload-Command": "upload, finalize",
    "Content-Type": mimeType,
  };
  if (contentLength) {
    headers["Content-Length"] = contentLength;
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers,
    // Stream the body directly — no buffering on our side.
    // @ts-expect-error: duplex is required when body is a ReadableStream in Node.js fetch
    body: request.body,
    duplex: "half",
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error("[gemini-upload-proxy] Upload failed:", errorText);
    return NextResponse.json(
      { error: `Failed to upload file to Gemini: ${uploadResponse.status}` },
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

  return NextResponse.json({ fileUri });
}
