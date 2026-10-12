import { DEFAULT_WORD_PAGE, type WordPageSetup } from "./wordPage";

/**
 * The paper and margins of the document that was translated, so its Word
 * translation is laid out on the same page and takes about as many of them.
 *
 * Read from a PDF (page size, margins from where its text sits) or a Word
 * file (its own page setup). Anything else, a scan whose page is not a sheet
 * of paper, or a file that will not open gets A4 with 2 cm margins.
 */

const CM = 72 / 2.54;
const INCH = 72;

/** Narrower than Word's "Narrow" (1.27 cm) is a guess gone wrong: header or footer text. */
const MIN_MARGIN = 0.5 * INCH;
/** Wider than 3 cm is a page that is not full, not a margin. */
const MAX_MARGIN = 3 * CM;

/** Paper sizes, in points, portrait. */
const PAPER: [number, number][] = [
  [21 * CM, 29.7 * CM], // A4
  [8.5 * INCH, 11 * INCH], // US Letter
  [8.5 * INCH, 14 * INCH], // US Legal
  [14.8 * CM, 21 * CM], // A5
  [29.7 * CM, 42 * CM], // A3
];

const near = (a: number, b: number) => Math.abs(a - b) <= b * 0.03;
const clampMargin = (points: number) => Math.min(MAX_MARGIN, Math.max(MIN_MARGIN, points));

/**
 * A page size as a sheet of paper. A photo or a scan made into a PDF often
 * has a page the size of the image in pixels; that becomes A4, turned the
 * same way.
 */
function asPaper(width: number, height: number): { width: number; height: number } {
  const landscape = width > height;
  for (const [short, long] of PAPER) {
    const [w, h] = landscape ? [long, short] : [short, long];
    if (near(width, w) && near(height, h)) return { width: w, height: h };
  }
  const [a4Short, a4Long] = PAPER[0];
  return landscape ? { width: a4Long, height: a4Short } : { width: a4Short, height: a4Long };
}

/** How many pages of a PDF are looked at for its margins. */
const PAGES_MEASURED = 8;

async function pdfPage(file: File): Promise<WordPageSetup | null> {
  const { pdfjs } = await import("react-pdf");
  // The same worker the document viewer sets up.
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  try {
    const first = (await pdf.getPage(1)).getViewport({ scale: 1 });
    const paper = asPaper(first.width, first.height);

    // The text's distance from each edge, at its closest on any page. The
    // fullest page shows where the bottom margin is; one side is used for
    // both, since ragged text never reaches the right one.
    let side = Infinity;
    let top = Infinity;
    let bottom = Infinity;
    for (let n = 1; n <= Math.min(pdf.numPages, PAGES_MEASURED); n++) {
      const page = await pdf.getPage(n);
      const viewport = page.getViewport({ scale: 1 });
      // Only a page of the original's own size says anything about its margins.
      if (!near(viewport.width, first.width) || !near(viewport.height, first.height)) continue;
      const content = await page.getTextContent();
      for (const item of content.items) {
        if (!("str" in item) || !item.str.trim()) continue;
        const [, , , , x, y] = item.transform;
        const [x1, y1] = viewport.convertToViewportPoint(x, y);
        const [x2, y2] = viewport.convertToViewportPoint(x + item.width, y + item.height);
        side = Math.min(side, Math.min(x1, x2), viewport.width - Math.max(x1, x2));
        top = Math.min(top, Math.min(y1, y2));
        bottom = Math.min(bottom, viewport.height - Math.max(y1, y2));
      }
    }
    // A scan has no text to measure by.
    if (!Number.isFinite(side)) return { ...paper, margins: DEFAULT_WORD_PAGE.margins };
    // Margins found on a page that was not paper-sized are in the wrong units.
    const scale = paper.width / first.width;
    const m = (points: number) => clampMargin(points * scale);
    return { ...paper, margins: { top: m(top), right: m(side), bottom: m(bottom), left: m(side) } };
  } finally {
    await pdf.destroy();
  }
}

const twipsAttribute = (tag: string, name: string): number | null => {
  const found = new RegExp(`\\sw:${name}="(-?\\d+)"`).exec(tag);
  return found ? Number(found[1]) / 20 : null;
};

async function wordFilePage(file: File): Promise<WordPageSetup | null> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const xml = await zip.file("word/document.xml")?.async("string");
  if (!xml) return null;
  // The last section's setup is the body's own; earlier ones are rare.
  const size = [...xml.matchAll(/<w:pgSz\b[^>]*>/g)].pop()?.[0];
  const margin = [...xml.matchAll(/<w:pgMar\b[^>]*>/g)].pop()?.[0];
  const width = size && twipsAttribute(size, "w");
  const height = size && twipsAttribute(size, "h");
  if (!width || !height) return null;
  const side = (name: string) => {
    const points = margin ? twipsAttribute(margin, name) : null;
    // Word allows a negative top or bottom margin: text may run into the header.
    return points === null ? DEFAULT_WORD_PAGE.margins.top : Math.max(MIN_MARGIN, Math.abs(points));
  };
  return { width, height, margins: { top: side("top"), right: side("right"), bottom: side("bottom"), left: side("left") } };
}

/** The original's page, or A4 with 2 cm margins when it cannot be told. */
export async function originalPageSetup(file: File | null | undefined): Promise<WordPageSetup> {
  if (!file) return DEFAULT_WORD_PAGE;
  try {
    const page = /\.pdf$/i.test(file.name) || file.type === "application/pdf"
      ? await pdfPage(file)
      : /\.docx$/i.test(file.name)
        ? await wordFilePage(file)
        : null;
    return page ?? DEFAULT_WORD_PAGE;
  } catch {
    // A file that will not open still gets its translation, on A4.
    return DEFAULT_WORD_PAGE;
  }
}
