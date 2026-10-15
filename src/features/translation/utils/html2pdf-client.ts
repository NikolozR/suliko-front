// src/features/translation/utils/html2pdf-client.ts

type Html2PdfInstance = {
  set: (options: unknown) => Html2PdfInstance;
  from: (input: string) => Html2PdfInstance;
  save: () => Promise<void>;
  outputPdf: (type: "blob") => Promise<Blob>;
};

type Html2PdfFactory = () => Html2PdfInstance;

const loadHtml2Pdf = async (): Promise<Html2PdfFactory> => {
  const html2pdfModule = await import("html2pdf.js");
  return (html2pdfModule.default || html2pdfModule) as Html2PdfFactory;
};

/**
 * Runs `draw` (anything that calls html2canvas) with the page set up so text lands where it belongs.
 *
 * html2canvas finds where to draw a line of text by measuring, in this page, a 1x1 picture it sets
 * on the baseline of some sample text. The site's CSS reset (Tailwind's preflight) makes every
 * picture a block, which drops that one onto a line of its own: every line was drawn about a third
 * of a line too low, and the last line of a document was cut through at the bottom of the PDF.
 *
 * The rule names html2canvas's own picture, so nothing on the page changes. It goes in the page's
 * head for the length of the drawing: html2pdf sanitizes the HTML it is given, and a style at the
 * start of it does not survive that.
 */
export const withHtml2CanvasBaselineFix = async <T,>(draw: () => Promise<T>): Promise<T> => {
  const style = document.createElement("style");
  style.textContent =
    'img[src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"] { display: inline !important; }';
  document.head.appendChild(style);
  try {
    return await draw();
  } finally {
    style.remove();
  }
};

/**
 * The look of a generated PDF. Every rule names `.pdf-document`, the box the content is drawn in:
 * html2pdf puts that box into the live page for the length of the drawing, so a rule for `body`
 * or `*` would restyle the whole site while a PDF is being made.
 *
 * Text is dark unless the document gives it a colour of its own (red text stays red).
 * `hr.page-break` is where the original document's page ended: the next page starts a new sheet.
 */
const PDF_STYLES = `
  .pdf-document {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 13px;
    line-height: 1.6;
    color: #111;
    background-color: #fff;
  }
  .pdf-document, .pdf-document * { box-sizing: border-box; }
  .pdf-document hr.page-break {
    page-break-before: always;
    visibility: hidden;
    height: 0;
    margin: 0;
    border: none;
  }
  .pdf-document :is(h1, h2, h3, h4, h5, h6) { page-break-after: avoid; }
  .pdf-document :is(p, li, blockquote, pre) { orphans: 3; widows: 3; }
  .pdf-document :is(table, figure, img) { page-break-inside: avoid; }
`;

/**
 * Styling and layout for generated PDFs.
 *
 * Shared by the single-file download and the bulk zip so a document exported on its own and
 * the same document exported inside a batch come out identical.
 */
const buildPdfDocument = (htmlContent: string, filename: string) => {
  // html2pdf sanitizes the HTML it is given, and a style at the very start of it is thrown away
  // there. Inside the box it is kept.
  const source = `<div class="pdf-document"><style>${PDF_STYLES}</style>${htmlContent}</div>`;

  const options = {
    margin: [15, 12, 15, 12] as const,
    filename,
    image: {
      type: "jpeg" as const,
      quality: 0.98,
    },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc: Document) => {
        // Remove dark-mode class so CSS variables resolve to light-mode values
        clonedDoc.documentElement.classList.remove('dark');
        clonedDoc.documentElement.setAttribute('style', 'color-scheme: light;');
        clonedDoc.body.setAttribute(
          'style',
          'background-color:#fff !important; color:#111 !important;'
        );
      },
    },
    jsPDF: {
      unit: "mm" as const,
      format: "a4" as const,
      orientation: "portrait" as const,
    },
    pagebreak: {
      mode: ["css"] as const,
      // The page is drawn as one tall picture and cut into sheets, so whatever lies across the
      // edge of a sheet is cut through: the last line of a page came out half on it and half on the
      // next. An element that crosses an edge and would fit on a sheet is moved to the next one
      // whole. (Only a paragraph taller than a sheet is still cut, where it must be.)
      avoid: ["p", "li", "tr", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "figure", "img"],
    },
  };

  return { options, source };
};

export const generatePdfFromHtml = async (
  htmlContent: string,
  filename: string = "translated_document.pdf"
): Promise<void> => {
  const html2pdf = await loadHtml2Pdf();
  const { options, source } = buildPdfDocument(htmlContent, filename);

  try {
    await withHtml2CanvasBaselineFix(() => html2pdf().set(options).from(source).save());
  } catch (error) {
    console.error("PDF generation failed:", error);
    throw new Error("Failed to generate PDF");
  }
};

/**
 * Same output as {@link generatePdfFromHtml}, returned as a Blob instead of being saved.
 * Needed for the bulk download, where the PDFs go into a zip rather than to disk one by one.
 */
export const generatePdfBlobFromHtml = async (
  htmlContent: string,
  filename: string = "translated_document.pdf"
): Promise<Blob> => {
  const html2pdf = await loadHtml2Pdf();
  const { options, source } = buildPdfDocument(htmlContent, filename);

  try {
    return await withHtml2CanvasBaselineFix(() => html2pdf().set(options).from(source).outputPdf("blob"));
  } catch (error) {
    console.error("PDF generation failed:", error);
    throw new Error("Failed to generate PDF");
  }
};