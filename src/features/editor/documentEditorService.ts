import { fetchWithAuth } from "@/features/chatHistory/services/chatService";
import type { WordPageSetup } from "@/features/translation/utils/wordPage";

/** Why the server could not give the editor a document. */
export class EditorConversionError extends Error {
  constructor(
    message: string,
    /** The server's word for it (`unreadable`, `too_large`, ...) or `unavailable` when it did not answer. */
    readonly reason: string,
  ) {
    super(message);
    this.name = "EditorConversionError";
  }
}

/**
 * A translation (the HTML the translation service sent, or a Word file) as the text the
 * editor opens: its own JSON. The browser editor cannot read either itself, so Api24 does.
 * HTML is laid out on `page` when one is given (the paper the original was printed on).
 */
export async function toSfdt(
  file: Blob,
  fileName: string,
  page?: WordPageSetup | null,
): Promise<string> {
  const form = new FormData();
  form.append("file", file, fileName);
  if (page) {
    form.append("pageWidth", String(page.width));
    form.append("pageHeight", String(page.height));
    form.append("marginTop", String(page.margins.top));
    form.append("marginRight", String(page.margins.right));
    form.append("marginBottom", String(page.margins.bottom));
    form.append("marginLeft", String(page.margins.left));
  }

  let response: Response;
  try {
    response = await fetchWithAuth("/document-editor/to-sfdt", { method: "POST", body: form });
  } catch (error) {
    throw new EditorConversionError(
      error instanceof Error ? error.message : "The editor could not be reached.",
      "unavailable",
    );
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new EditorConversionError(
      `The server could not open the document (${response.status}).`,
      body.error ?? (response.status === 429 ? "rate_limited" : "unavailable"),
    );
  }
  const text = await response.text();
  if (!text.trim()) throw new EditorConversionError("The server sent no document.", "unavailable");
  return text;
}

/**
 * The Word file as a PDF laid out the way Word lays it out. Throws `EditorConversionError`
 * when the server cannot (it says `license` when its Syncfusion licence does not cover it);
 * the caller then makes the PDF from the HTML as before.
 */
export async function toPdf(docx: Blob, fileName = "translation.docx"): Promise<Blob> {
  const form = new FormData();
  form.append("file", docx, fileName);

  let response: Response;
  try {
    response = await fetchWithAuth("/document-editor/to-pdf", { method: "POST", body: form });
  } catch (error) {
    throw new EditorConversionError(
      error instanceof Error ? error.message : "The PDF could not be made.",
      "unavailable",
    );
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new EditorConversionError(
      `The server could not make the PDF (${response.status}).`,
      body.error ?? (response.status === 429 ? "rate_limited" : "unavailable"),
    );
  }
  const pdf = await response.blob();
  if (pdf.size === 0) throw new EditorConversionError("The server sent no PDF.", "unavailable");
  return new Blob([pdf], { type: "application/pdf" });
}

/** A translation's HTML as the editor's document. */
export function htmlToSfdt(html: string, page?: WordPageSetup | null): Promise<string> {
  return toSfdt(new Blob([html], { type: "text/html" }), "translation.html", page);
}
