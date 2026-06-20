import { GeminiUploadResponse } from "@/features/translation/types/types.Translation";

export async function uploadFileToGemini(
  file: File
): Promise<GeminiUploadResponse> {
  const mimeType = file.type || "application/octet-stream";

  // Step 1: Get a resumable upload URL from our server (tiny JSON request —
  // avoids routing the large file payload through Next.js).
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
      errorData.error || `Gemini upload init failed with status ${initResponse.status}`
    );
  }

  const { uploadUrl, displayName } = await initResponse.json();

  // Step 2: Upload the file directly to Gemini using the authenticated URL.
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
      "Content-Type": mimeType,
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error("[gemini-upload] Direct upload failed:", errorText);
    throw new Error(`Failed to upload file to Gemini: ${uploadResponse.status}`);
  }

  const uploadResult = await uploadResponse.json();
  const fileUri: string = uploadResult?.file?.uri;

  if (!fileUri) {
    throw new Error("Gemini did not return a file URI");
  }

  return { fileUri, mimeType, displayName };
}
