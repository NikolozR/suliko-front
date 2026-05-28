import { GeminiUploadResponse } from "@/features/translation/types/types.Translation";

export async function uploadFileToGemini(
  file: File
): Promise<GeminiUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/gemini-upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Gemini upload failed with status ${response.status}`
    );
  }

  return response.json() as Promise<GeminiUploadResponse>;
}
