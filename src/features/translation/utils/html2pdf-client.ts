export const generatePdfFromHtml = async (
  htmlContent: string,
  filename = "translated_document.pdf"
) => {
  const html2pdf = (await import("html2pdf.js")).default;

  const styles = `<style>
    * { box-sizing: border-box; }
    body { font-family: Georgia, 'Times New Roman', serif; font-size: 13px; line-height: 1.6; color: #111; }
    hr.page-break { page-break-before: always; visibility: hidden; height: 0; margin: 0; border: none; }
    h1, h2, h3, h4, h5, h6 { page-break-after: avoid; }
    p, li, blockquote, pre { orphans: 3; widows: 3; }
    table, figure, img { page-break-inside: avoid; }
  </style>`;

  const opt = {
    margin: [15, 12, 15, 12] as [number, number, number, number],
    filename,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
    },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ["css"] },
  };

  await html2pdf().set(opt).from(styles + htmlContent).save();
};
