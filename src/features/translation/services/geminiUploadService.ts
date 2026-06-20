import { upload } from "@vercel/blob/client";
import { GeminiUploadResponse } from "@/features/translation/types/types.Translation";

export async function uploadFileToGemini(
  file: File
): Promise<GeminiUploadResponse> {
  const mimeType = file.type || "application/octet-stream";

  // Step 1: Upload directly from the browser to Vercel Blob CDN.
  // This bypasses our Next.js server entirely, so Vercel's 4.5 MB
  // serverless body limit is never hit.
  const blob = await upload(file.name, file, {
    access: "public",
    handleUploadUrl: "/api/blob-upload-token",
  });

  // Step 2: Tell our server to fetch the file from Blob and forward it
  // to Gemini. Server-side outgoing requests have no body size limit.
  const response = await fetch("/api/gemini-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      blobUrl: blob.url,
      fileName: file.name,
      mimeType,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Gemini upload failed with status ${response.status}`
    );
  }

  return response.json() as Promise<GeminiUploadResponse>;
}
