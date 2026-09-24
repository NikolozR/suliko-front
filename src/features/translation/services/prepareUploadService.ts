import { API_BASE_URL } from "@/shared/constants/api";
import { PrepareUploadResponse } from "@/features/translation/types/types.Translation";
import { reaccessToken, useAuthStore } from "@/features/auth";

/**
 * Hands a document to the backend, which uploads it to Gemini and measures it.
 *
 * This replaces the browser-to-Google resumable upload. That path never
 * actually worked: `sendBytesToGoogle` failed for every file — 0.2MB
 * included — and every upload silently fell back to a Vercel proxy capped at
 * 4MB, which is why anything larger appeared to be "blocked". The bytes now go
 * to our own API, so neither Vercel's body cap nor Google's CORS behaviour is
 * in the path, and the ceiling is the backend's 20MB.
 *
 * The page count in the response is the number the server bills. Anything the
 * client derives — the pdf.js count behind the preview, or /Document/count-pages
 * — is for display only and is ignored by `translate-with-uri`.
 */

export interface PrepareUploadOptions {
  /** Fraction of bytes sent, 0..1. Fires while the file goes to our API. */
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
}

/** Raised when the server rejects the file itself, so callers can show why. */
export class PrepareUploadError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "PrepareUploadError";
  }
}

const ENDPOINT = `${API_BASE_URL}/Document/prepare-upload`;

/**
 * XHR rather than fetch, because only XHR reports upload progress — which
 * matters here now that the whole file crosses the wire before the quote can
 * be shown.
 */
function send(
  file: File,
  bearer: string,
  options?: PrepareUploadOptions,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("File", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", ENDPOINT, true);
    xhr.setRequestHeader("Authorization", `Bearer ${bearer}`);

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
      resolve({ status: xhr.status, body: xhr.responseText });
    };
    xhr.onerror = () => {
      cleanup();
      reject(new Error("Could not reach the translation service"));
    };
    xhr.onabort = () => {
      cleanup();
      reject(new DOMException("Upload aborted", "AbortError"));
    };

    xhr.send(form);
  });
}

/** Pulls the server's own explanation out of a failure, falling back sanely. */
function readError(body: string, status: number): string {
  try {
    const parsed = JSON.parse(body);
    const message = parsed?.errorMessage ?? parsed?.message ?? parsed?.title;
    if (typeof message === "string" && message.trim()) return message;
  } catch {
    if (body.trim()) return body.trim();
  }
  return status === 502
    ? "The translation service could not accept this file. Please try again."
    : "This file could not be prepared for translation.";
}

export async function prepareDocumentUpload(
  file: File,
  options?: PrepareUploadOptions,
): Promise<PrepareUploadResponse> {
  const { token, refreshToken } = useAuthStore.getState();
  if (!token) throw new Error("No token found");

  let result = await send(file, token, options);

  if (result.status === 401 && refreshToken) {
    try {
      const next = (await reaccessToken(refreshToken)) as {
        token: string;
        refreshToken: string;
      };
      const { setToken, setRefreshToken } = useAuthStore.getState();
      setToken(next.token);
      setRefreshToken(next.refreshToken);
      // Re-send the whole request, body included. The old countPages retry
      // reissued a bodyless GET here and silently failed.
      result = await send(file, next.token, options);
    } catch {
      useAuthStore.getState().reset();
      throw new Error("Token refresh failed");
    }
  }

  if (result.status < 200 || result.status >= 300) {
    throw new PrepareUploadError(readError(result.body, result.status), result.status);
  }

  const data = JSON.parse(result.body) as PrepareUploadResponse;
  if (!data.success || !data.fileUri) {
    throw new PrepareUploadError(
      data.errorMessage || "This file could not be prepared for translation.",
      result.status,
    );
  }
  return data;
}
