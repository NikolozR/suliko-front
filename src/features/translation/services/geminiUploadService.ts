import { GeminiUploadResponse } from "@/features/translation/types/types.Translation";
import { reaccessToken, useAuthStore } from "@/features/auth";

export interface GeminiUploadOptions {
  /** Fraction of bytes sent, 0..1. Only fires while the file is going to Google. */
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
}

/** Vercel rejects serverless request bodies above this, so the proxy can't carry more. */
const PROXY_FALLBACK_LIMIT_BYTES = 4 * 1024 * 1024;

/** Raised when the browser could not reach Google at all, as opposed to being refused. */
class DirectUploadUnreachableError extends Error {}

/**
 * Opens a resumable upload session on our own API. The response is just a session URL —
 * the bytes never pass through Vercel, which is what keeps files over ~4.5MB working.
 */
async function openUploadSession(file: File): Promise<string> {
  const payload = JSON.stringify({
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: file.size,
  });

  const { token, refreshToken } = useAuthStore.getState();
  if (!token) {
    throw new Error("No token found");
  }

  const send = (bearer: string) =>
    fetch("/api/gemini-upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bearer}`,
      },
      body: payload,
    });

  let response = await send(token);

  if (response.status === 401 && refreshToken) {
    try {
      const newTokens = (await reaccessToken(refreshToken)) as {
        token: string;
        refreshToken: string;
      };
      const { setToken, setRefreshToken } = useAuthStore.getState();
      setToken(newTokens.token);
      setRefreshToken(newTokens.refreshToken);
      response = await send(newTokens.token);
    } catch {
      useAuthStore.getState().reset();
      throw new Error("Token refresh failed");
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Could not start upload (status ${response.status})`
    );
  }

  const { uploadUrl } = (await response.json()) as { uploadUrl?: string };
  if (!uploadUrl) {
    throw new Error("No upload URL returned");
  }

  return uploadUrl;
}

/**
 * Sends the file straight to Google. Uses XHR rather than fetch because only XHR reports
 * upload progress, which matters when a batch is pushing many multi-megabyte files.
 */
function sendBytesToGoogle(
  uploadUrl: string,
  file: File,
  options?: GeminiUploadOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl, true);
    xhr.setRequestHeader("X-Goog-Upload-Offset", "0");
    xhr.setRequestHeader("X-Goog-Upload-Command", "upload, finalize");
    xhr.setRequestHeader(
      "Content-Type",
      file.type || "application/octet-stream"
    );

    const onAbort = () => xhr.abort();
    options?.signal?.addEventListener("abort", onAbort);

    const cleanup = () => options?.signal?.removeEventListener("abort", onAbort);

    if (options?.onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          options.onProgress?.(event.loaded / event.total);
        }
      };
    }

    xhr.onload = () => {
      cleanup();

      if (xhr.status < 200 || xhr.status >= 300) {
        reject(
          new Error(
            `Gemini rejected the upload (status ${xhr.status}): ${xhr.responseText.slice(0, 200)}`
          )
        );
        return;
      }

      try {
        const fileUri = JSON.parse(xhr.responseText)?.file?.uri;
        if (!fileUri) {
          reject(new Error("Gemini did not return a file URI"));
          return;
        }
        resolve(fileUri);
      } catch {
        reject(new Error("Could not parse Gemini's upload response"));
      }
    };

    xhr.onerror = () => {
      cleanup();
      // No status here means the request never completed — almost always a dropped
      // connection, or a CORS rejection on the direct-to-Google request. Distinguished
      // from a real rejection so the caller knows the proxy is worth trying.
      reject(new DirectUploadUnreachableError("Could not reach Gemini"));
    };

    xhr.onabort = () => {
      cleanup();
      reject(new DOMException("Upload aborted", "AbortError"));
    };

    xhr.send(file);
  });
}

/**
 * Last-resort path that pushes the bytes through our own API instead of straight to
 * Google. Kept only for the case where the browser cannot make the cross-origin request.
 */
async function uploadViaProxy(file: File): Promise<GeminiUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const { token } = useAuthStore.getState();
  const response = await fetch("/api/gemini-upload", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Upload failed with status ${response.status}`
    );
  }

  return response.json() as Promise<GeminiUploadResponse>;
}

export async function uploadFileToGemini(
  file: File,
  options?: GeminiUploadOptions
): Promise<GeminiUploadResponse> {
  const uploadUrl = await openUploadSession(file);

  try {
    const fileUri = await sendBytesToGoogle(uploadUrl, file, options);
    return {
      fileUri,
      mimeType: file.type || "application/octet-stream",
      displayName: file.name,
    };
  } catch (error) {
    const unreachable = error instanceof DirectUploadUnreachableError;
    const fitsThroughProxy = file.size <= PROXY_FALLBACK_LIMIT_BYTES;

    if (!unreachable || !fitsThroughProxy) {
      if (unreachable) {
        throw new Error(
          `Could not reach Gemini to upload "${file.name}", and at ${(file.size / 1024 / 1024).toFixed(1)}MB it is too large to send through the server instead.`
        );
      }
      throw error;
    }

    console.warn(
      "[gemini-upload] Direct upload unreachable, falling back to server proxy"
    );
    return uploadViaProxy(file);
  }
}
