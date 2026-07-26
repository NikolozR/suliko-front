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
 * Styling and layout for generated PDFs.
 *
 * Shared by the single-file download and the bulk zip so a document exported on its own and
 * the same document exported inside a batch come out identical.
 */
const buildPdfDocument = (htmlContent: string, filename: string) => {
  const styles = `
    <style>
      * { box-sizing: border-box; color: #111 !important; }
      body {
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 13px;
        line-height: 1.6;
        color: #111;
        background-color: #fff;
      }
      hr.page-break {
        page-break-before: always;
        visibility: hidden;
        height: 0;
        margin: 0;
        border: none;
      }
      h1, h2, h3, h4, h5, h6 { page-break-after: avoid; }
      p, li, blockquote, pre { orphans: 3; widows: 3; }
      table, figure, img { page-break-inside: avoid; }
    </style>
  `;

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
    },
  };

  return { options, source: styles + htmlContent };
};

export const generatePdfFromHtml = async (
  htmlContent: string,
  filename: string = "translated_document.pdf"
): Promise<void> => {
  const html2pdf = await loadHtml2Pdf();
  const { options, source } = buildPdfDocument(htmlContent, filename);

  try {
    await html2pdf().set(options).from(source).save();
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
    return await html2pdf().set(options).from(source).outputPdf("blob");
  } catch (error) {
    console.error("PDF generation failed:", error);
    throw new Error("Failed to generate PDF");
  }
};