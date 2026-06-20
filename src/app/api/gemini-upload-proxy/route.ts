import { NextRequest, NextResponse } from "next/server";

// Receives one chunk of a resumable Gemini upload and forwards it.
// Chunked uploads keep each request well under Vercel's 4.5 MB body limit.
export async function POST(request: NextRequest) {
  const uploadUrl = request.headers.get("x-goog-upload-url");
  const mimeType =
    request.headers.get("x-file-mime-type") || "application/octet-stream";
  const offset = request.headers.get("x-upload-offset") ?? "0";
  const isLastChunk = request.headers.get("x-is-last-chunk") === "true";

  if (!uploadUrl) {
    return NextResponse.json(
      { error: "Missing x-goog-upload-url header" },
      { status: 400 }
    );
  }

  const chunkBuffer = await request.arrayBuffer();

  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "X-Goog-Upload-Offset": offset,
      "X-Goog-Upload-Command": isLastChunk ? "upload, finalize" : "upload",
      "Content-Length": String(chunkBuffer.byteLength),
      "Content-Type": mimeType,
    },
    body: chunkBuffer,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error("[gemini-upload-proxy] Chunk upload failed:", errorText);
    return NextResponse.json(
      { error: `Failed to upload chunk to Gemini: ${uploadResponse.status}` },
      { status: 502 }
    );
  }

  if (!isLastChunk) {
    return NextResponse.json({ success: true });
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
