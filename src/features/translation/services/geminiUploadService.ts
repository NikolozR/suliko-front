import { GeminiUploadResponse } from "@/features/translation/types/types.Translation";

export async function uploadFileToGemini(
  file: File
): Promise<GeminiUploadResponse> {
  const mimeType = file.type || "application/octet-stream";

  // Step 1: Init a resumable Gemini session (tiny JSON → returns upload URL).
  const initResponse = await fetch("/api/gemini-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      mimeType,
      fileSize: file.size,
    }),
  });

  if (!initResponse.ok) {
    const errorData = await initResponse.json().catch(() => ({}));
    throw new Error(
      errorData.error ||
        `Gemini upload init failed with status ${initResponse.status}`
    );
  }

  const { uploadUrl, displayName } = await initResponse.json();

  // Step 2: Stream raw bytes through our proxy to Gemini.
  // Sending raw binary (not multipart form) bypasses Next.js body-parser
  // limits, and the proxy avoids CORS issues with direct browser uploads.
  const proxyResponse = await fetch("/api/gemini-upload-proxy", {
    method: "POST",
    headers: {
      "Content-Type": mimeType,
      "x-goog-upload-url": uploadUrl,
      "x-file-mime-type": mimeType,
    },
    body: file,
  });

  if (!proxyResponse.ok) {
    const errorData = await proxyResponse.json().catch(() => ({}));
    throw new Error(
      errorData.error ||
        `Gemini upload failed with status ${proxyResponse.status}`
    );
  }

  const { fileUri } = await proxyResponse.json();

  if (!fileUri) {
    throw new Error("Gemini did not return a file URI");
  }

  return { fileUri, mimeType, displayName };
}
