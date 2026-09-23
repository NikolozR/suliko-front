import type { Language } from "@/features/translation/services/languageService";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Names suliko.ge uses that differ from the browser's English language names. */
const NAME_ALIASES: Record<string, string[]> = {
  persian: ["farsi"],
  "norwegian bokmål": ["norwegian"],
};

/**
 * The suliko.ge language for an order's ISO code.
 *
 * Orders store ISO codes ("ka", "en"); suliko.ge languages carry only a numeric
 * id and an English name, so they are matched by that name. Returns null when
 * nothing matches, and the dialog then asks the user to pick.
 */
export function sulikoLanguageFor(code: string, languages: Language[]): Language | null {
  let english: string | undefined;
  try {
    english = new Intl.DisplayNames(["en"], { type: "language" }).of(code);
  } catch {
    english = undefined;
  }
  if (!english) return null;

  const wanted = [english.toLowerCase(), ...(NAME_ALIASES[english.toLowerCase()] ?? [])];
  const normalized = (language: Language) => language.name.trim().toLowerCase();
  return (
    languages.find((language) => wanted.includes(normalized(language))) ??
    // "Chinese (Simplified)" and the like.
    languages.find((language) => wanted.some((name) => normalized(language).startsWith(`${name} `))) ??
    null
  );
}

export function translatedFileName(sourceName: string, languageName: string): string {
  const base = sourceName.replace(/\.[^/.]+$/, "") || "document";
  return `${base} (${languageName}).docx`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * A translation result as a Word document, ready to attach to an order.
 *
 * suliko.ge returns HTML for both deliverables; the translation screen turns it
 * into Word in the browser, and this does the same with the same styling, so
 * an attached file matches what the user would have downloaded themselves.
 */
export async function resultToDocx(result: string, fileName: string): Promise<File> {
  const trimmed = result.trim();
  let body: string;
  if (trimmed.startsWith("<")) {
    body = trimmed.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? trimmed;
  } else {
    body = trimmed
      .split(/\n{2,}/)
      .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
      .join("");
  }

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <style>
    body  { font-family: Calibri, sans-serif; font-size: 11pt; }
    h1    { font-size: 16pt; }
    h2    { font-size: 14pt; }
    h3    { font-size: 12pt; }
    p     { margin: 0 0 8pt 0; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1pt solid #aaa; padding: 4pt 8pt; }
  </style>
</head>
<body>${body}</body>
</html>`;

  // @ts-expect-error html-docx-js's dist build ships no type declarations
  const htmlDocx = (await import("html-docx-js/dist/html-docx")).default;
  const blob: Blob = htmlDocx.asBlob(html);
  return new File([blob], fileName, { type: DOCX_MIME });
}
