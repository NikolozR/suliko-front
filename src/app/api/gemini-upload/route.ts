import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_UPLOAD_URL =
  "https://generativelanguage.googleapis.com/upload/v1beta/files";

// This route only initiates the resumable upload session and returns the
// upload URL. The client then uploads the file directly to Gemini, which
// avoids routing large payloads through the Next.js server.
export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Gemini API key not configured" },
      { status: 500 }
    );
  }

  let body: { fileName: string; mimeType: string; fileSize: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { fileName, mimeType, fileSize } = body;
  if (!fileName || !mimeType || !fileSize) {
    return NextResponse.json(
      { error: "Missing required fields: fileName, mimeType, fileSize" },
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
        "X-Goog-Upload-Header-Content-Length": String(fileSize),
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

  return NextResponse.json({ uploadUrl, mimeType, displayName: fileName });
}
