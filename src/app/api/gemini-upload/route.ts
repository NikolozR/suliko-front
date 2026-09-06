import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/shared/constants/api";

/**
 * Compatibility shim for external integrations.
 *
 * This route used to hold Suliko's Gemini key and open upload sessions itself.
 * That moved to the backend (`POST /Document/prepare-upload`), and this file was
 * deleted along with the key — which broke third-party clients following the
 * File API integration guide, whose documented flow starts with a multipart
 * POST here. They began receiving Next's HTML 404 page.
 *
 * It is restored as a thin forwarder so those integrations work unchanged. It
 * holds no credentials: the caller's own Bearer token is passed straight
 * through, and the backend does the upload and the measuring.
 *
 * New integrations should call `POST {API_BASE_URL}/Document/prepare-upload`
 * directly. It is the same work with one less hop, it returns the page count
 * the translation will be billed for, and it is not subject to the ~4.5MB
 * request-body cap that Vercel imposes on this route — the reason the limit
 * note below exists.
 */

/** Mirrors the old response so existing clients need no change. */
interface LegacyUploadResponse {
  fileUri: string;
  mimeType: string;
  displayName: string;
  /** Not in the original contract; additive, and useful to callers. */
  pageCount?: number;
}

const DEPRECATION_NOTE =
  'Deprecated: POST ' + API_BASE_URL + '/Document/prepare-upload directly instead.';

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  // The other historical shape: JSON asking for a resumable session URL to send
  // bytes to directly. That existed only for our own browser and required the
  // Gemini key this route no longer has, so it cannot be served. Say so
  // precisely rather than failing as if the file were the problem.
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      {
        error:
          "This endpoint now accepts only multipart/form-data with a `file` field. " +
          "The JSON resumable-session form has been withdrawn. " +
          DEPRECATION_NOTE,
      },
      { status: 410, headers: { Deprecation: "true" } }
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

  // Logged so we can tell when the last external caller has migrated and this
  // file can go for good.
  console.warn(
    `[gemini-upload] Legacy shim used for "${file.name}" ` +
      `(${(file.size / 1024 / 1024).toFixed(1)}MB). ${DEPRECATION_NOTE}`
  );

  const forwarded = new FormData();
  forwarded.append("File", file); // prepare-upload names the field `File`

  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE_URL}/Document/prepare-upload`, {
      method: "POST",
      headers: { Authorization: authorization },
      body: forwarded,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the translation service" },
      { status: 502 }
    );
  }

  const raw = await upstream.text();
  let parsed: {
    success?: boolean;
    fileUri?: string;
    mimeType?: string;
    pageCount?: number;
    fileName?: string;
    errorMessage?: string;
  } | null = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    /* upstream returned something that is not JSON; handled below */
  }

  if (!upstream.ok || !parsed?.success || !parsed.fileUri) {
    return NextResponse.json(
      {
        error:
          parsed?.errorMessage ||
          (raw.trim() && !raw.trimStart().startsWith("<") ? raw.trim() : null) ||
          "Failed to upload file",
      },
      { status: upstream.status === 200 ? 502 : upstream.status }
    );
  }

  const body: LegacyUploadResponse = {
    fileUri: parsed.fileUri,
    mimeType: parsed.mimeType || file.type || "application/octet-stream",
    displayName: parsed.fileName || file.name,
    pageCount: parsed.pageCount,
  };

  return NextResponse.json(body, { headers: { Deprecation: "true" } });
}
