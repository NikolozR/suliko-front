import { GeminiUploadResponse } from "@/features/translation/types/types.Translation";

// 2 MB — keeps each request well under Vercel's 4.5 MB serverless body limit.
const CHUNK_SIZE = 2 * 1024 * 1024;

export async function uploadFileToGemini(
  file: File
): Promise<GeminiUploadResponse> {
  const mimeType = file.type || "application/octet-stream";

  // Step 1: Init a resumable Gemini session → get upload URL.
  const initResponse = await fetch("/api/gemini-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName: file.name, mimeType, fileSize: file.size }),
  });

  if (!initResponse.ok) {
    const errorData = await initResponse.json().catch(() => ({}));
    throw new Error(
      errorData.error ||
        `Gemini upload init failed with status ${initResponse.status}`
    );
  }

  const { uploadUrl, displayName } = await initResponse.json();

  // Step 2: Upload in ~2 MB chunks through our proxy.
  // Chunking keeps every request under Vercel's 4.5 MB body limit.
  const buffer = await file.arrayBuffer();
  const totalSize = buffer.byteLength;
  let offset = 0;
  let fileUri = "";

  while (offset < totalSize) {
    const end = Math.min(offset + CHUNK_SIZE, totalSize);
    const chunk = buffer.slice(offset, end);
    const isLastChunk = end === totalSize;

    const chunkResponse = await fetch("/api/gemini-upload-proxy", {
      method: "POST",
      headers: {
        "Content-Type": mimeType,
        "x-goog-upload-url": uploadUrl,
        "x-file-mime-type": mimeType,
        "x-upload-offset": String(offset),
        "x-is-last-chunk": String(isLastChunk),
      },
      body: chunk,
    });

    if (!chunkResponse.ok) {
      const errorData = await chunkResponse.json().catch(() => ({}));
      throw new Error(
        errorData.error ||
          `Gemini upload failed with status ${chunkResponse.status}`
      );
    }

    if (isLastChunk) {
      const result = await chunkResponse.json();
      fileUri = result.fileUri;
    }

    offset = end;
  }

  if (!fileUri) {
    throw new Error("Gemini did not return a file URI");
  }

  return { fileUri, mimeType, displayName };
}
