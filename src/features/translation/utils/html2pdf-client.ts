// src/features/translation/utils/html2pdf-client.ts

type Html2PdfInstance = {
  set: (options: unknown) => Html2PdfInstance;
  from: (input: string) => Html2PdfInstance;
  save: () => Promise<void>;
};

type Html2PdfFactory = () => Html2PdfInstance;

export const generatePdfFromHtml = async (
  htmlContent: string,
  filename: string = "translated_document.pdf"
): Promise<void> => {
  const html2pdfModule = await import("html2pdf.js");

  const html2pdf: Html2PdfFactory =
    (html2pdfModule.default || html2pdfModule) as Html2PdfFactory;

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

  try {
    await html2pdf()
      .set(options)
      .from(styles + htmlContent)
      .save();
  } catch (error) {
    console.error("PDF generation failed:", error);
    throw new Error("Failed to generate PDF");
  }
};