/**
 * A translation as a Word file, the way this site writes one, and back.
 *
 * The file is made from the editor's HTML: the document proper is empty and
 * points at an embedded web page ("altChunk"), which Word draws. So a Word
 * file made here can be read back as the page it was made from.
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

/** A sheet of paper and its margins, in points (1/72 inch). */
export interface WordPageSetup {
  width: number;
  height: number;
  margins: { top: number; right: number; bottom: number; left: number };
}

const CM = 72 / 2.54;

/**
 * A4 with 2 cm margins, for when the original's page is not known. A file
 * that names no page is laid out on Word's own default, which in many
 * installs is US Letter with 2.54 cm margins: less room, so more pages.
 */
export const DEFAULT_WORD_PAGE: WordPageSetup = {
  width: 21 * CM,
  height: 29.7 * CM,
  margins: { top: 2 * CM, right: 2 * CM, bottom: 2 * CM, left: 2 * CM },
};

const NESTING_TAG = /<(\/?)(td|th|li|p)\b([^>]*)>/gi;

/**
 * The editor puts the text of every table cell and list item in a paragraph
 * of its own. Word gives each of those its usual space after, so every table
 * row and bullet grows by half a line. Word ignores `td p` in a style sheet,
 * so the margin goes on the paragraphs themselves.
 */
function tightenNestedParagraphs(html: string): string {
  let depth = 0;
  return html.replace(NESTING_TAG, (tag, closing: string, name: string, attributes: string) => {
    if (name.toLowerCase() !== "p") {
      depth = Math.max(0, depth + (closing ? -1 : 1));
      return tag;
    }
    if (closing || depth === 0) return tag;
    const style = /\sstyle\s*=\s*"([^"]*)"/i.exec(attributes);
    if (!style) return `<p style="margin:0"${attributes}>`;
    // First, so a margin the paragraph sets itself still wins.
    return `<p${attributes.replace(style[0], ` style="margin:0;${style[1]}"`)}>`;
  });
}

/**
 * The translation's HTML as a page Word opens with the look of the editor.
 *
 * Spaced like a printed document rather than a web page, so the translation
 * takes about as many pages as the original.
 */
export const wordPage = (bodyHtml: string) => `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <style>
    body   { font-family: Calibri, sans-serif; font-size: 11pt; }
    h1     { font-size: 14pt; margin: 6pt 0 3pt 0; }
    h2     { font-size: 13pt; margin: 6pt 0 3pt 0; }
    h3     { font-size: 12pt; margin: 6pt 0 3pt 0; }
    h4, h5, h6 { font-size: 11pt; margin: 6pt 0 3pt 0; }
    p      { margin: 0 0 4pt 0; }
    ul, ol { margin-top: 0; margin-bottom: 4pt; }
    li     { margin: 0; }
    table  { border-collapse: collapse; width: 100%; margin: 0 0 4pt 0; }
    td, th { border: 1pt solid #aaa; padding: 1pt 4pt; vertical-align: top; }
  </style>
</head>
<body>${tightenNestedParagraphs(bodyHtml)}</body>
</html>`;

const WORD_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Points as twentieths of a point, the unit of Word's page setup. */
const twips = (points: number) => Math.round(points * 20);

const CONTENT_TYPES = `<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="htm" ContentType="text/html"/>
</Types>`;

const PACKAGE_RELS = `<?xml version="1.0" encoding="utf-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="/word/document.xml" Id="R09c83fafc067488e"/>
</Relationships>`;

const DOCUMENT_RELS = `<?xml version="1.0" encoding="utf-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/aFChunk" Target="/word/afchunk.htm" Id="htmlChunk"/>
</Relationships>`;

/** The document proper: the embedded page, laid out on `page`. */
function documentXml(page: WordPageSetup): string {
  const { top, right, bottom, left } = page.margins;
  // Header and footer sit halfway into the margin, as Word places them.
  const header = twips(Math.min(top, bottom) / 2);
  const orient = page.width > page.height ? ` w:orient="landscape"` : "";
  return `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <w:altChunk r:id="htmlChunk"/>
    <w:sectPr>
      <w:pgSz w:w="${twips(page.width)}" w:h="${twips(page.height)}"${orient}/>
      <w:pgMar w:top="${twips(top)}" w:right="${twips(right)}" w:bottom="${twips(bottom)}" w:left="${twips(left)}" w:header="${header}" w:footer="${header}" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

/** That page as a Word file, on the original's paper when it is known. */
export async function wordBlob(bodyHtml: string, page: WordPageSetup = DEFAULT_WORD_PAGE): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  zip.file("[Content_Types].xml", CONTENT_TYPES);
  zip.file("_rels/.rels", PACKAGE_RELS);
  zip.file("word/document.xml", documentXml(page));
  zip.file("word/afchunk.htm", wordPage(bodyHtml));
  zip.file("word/_rels/document.xml.rels", DOCUMENT_RELS);
  const bytes = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
  return new Blob([bytes], { type: WORD_TYPE });
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
