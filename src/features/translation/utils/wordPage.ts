/**
 * A translation as a Word file, the way this site writes one, and back.
 *
 * The file is made from the editor's HTML (html-docx-js): the document proper
 * is empty and points at an embedded web page ("altChunk"), which Word draws.
 * So a Word file made here can be read back as the page it was made from.
 */

/**
 * A translation as HTML, whichever way it is kept: the translation service
 * sends Markdown or HTML, and the editor writes HTML.
 */
export function translationAsHtml(content: string): string {
  if (content.trimStart().startsWith("<")) return content;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { marked } = require("marked") as { marked: (src: string, options?: { async?: false }) => string };
  return marked(content, { async: false }) as string;
}

/** The translation's HTML as a page Word opens with the look of the editor. */
export const wordPage = (bodyHtml: string) => `<!DOCTYPE html>
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
<body>${bodyHtml}</body>
</html>`;

/** That page as a Word file. */
export async function wordBlob(bodyHtml: string): Promise<Blob> {
  // @ts-expect-error Type errors, nothing special
  const htmlDocx = (await import("html-docx-js/dist/html-docx")).default;
  return htmlDocx.asBlob(wordPage(bodyHtml)) as Blob;
}

/**
 * The web page inside a Word file that carries its text as one.
 *
 * Mammoth reads only the document proper, so such a file comes out blank
 * there. Returns null for a Word file that has no such part.
 */
export async function embeddedPageOf(buffer: ArrayBuffer): Promise<string | null> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buffer);
  // The page as it is (`afchunk.htm`, what this site writes)...
  const page = zip.file(/^word\/[^/]+\.html?$/i)[0];
  if (page) return page.async("string");

  // ...or wrapped as a web archive (`afchunk.mht`, what other builds of the
  // same library write): one HTML part between the MIME headers and the
  // closing boundary, with every "=" written as "=3D".
  const archive = zip.file(/^word\/[^/]+\.mht$/i)[0];
  if (!archive) return null;
  const packed = await archive.async("string");
  const start = packed.search(/<(!doctype|html)/i);
  if (start < 0) return null;
  const end = packed.lastIndexOf("------=mhtDocumentPart--");
  return packed.slice(start, end > start ? end : undefined).replace(/=3D/g, "=");
}
