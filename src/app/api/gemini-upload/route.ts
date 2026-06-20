import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_UPLOAD_URL =
  "https://generativelanguage.googleapis.com/upload/v1beta/files";

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Gemini API key not configured" },
      { status: 500 }
    );
  }

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
  const displayName = file.name;
  const fileBuffer = await file.arrayBuffer();

  // Start resumable upload session
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

  const uploadUrl = initResponse.headers.get("x-goog-upload-url");
  if (!uploadUrl) {
    return NextResponse.json(
      { error: "No upload URL returned by Gemini" },
      { status: 502 }
    );
  }

  // Upload the file bytes
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

  return NextResponse.json({ fileUri, mimeType, displayName });
}
