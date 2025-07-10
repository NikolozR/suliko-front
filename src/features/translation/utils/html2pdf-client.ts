export const generatePdfFromHtml = async (
  htmlContent: string,
  filename = "translated_document.pdf"
) => {
  const html2pdf = (await import("html2pdf.js")).default;

  const container = document.createElement("div");
  container.innerHTML = htmlContent;
  container.style.position = "absolute";
  container.style.left = "-9999px";
  document.body.appendChild(container);

  const opt = {
    margin: 10,
    filename,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };

  await html2pdf().set(opt).from(container).save();
  document.body.removeChild(container);
};
