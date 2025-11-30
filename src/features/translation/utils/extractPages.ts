/**
 * Utility functions for extracting specific pages from documents
 */

/**
 * Extracts specific pages from a PDF file
 * @param file - The PDF file to extract pages from
 * @param startPage - The starting page number (1-indexed)
 * @param endPage - The ending page number (1-indexed, inclusive)
 * @returns A new File containing only the selected pages
 */
export async function extractPagesFromPdf(
  file: File,
  startPage: number,
  endPage: number
): Promise<File> {
  // Dynamically import pdf-lib
  const { PDFDocument } = await import('pdf-lib');
  
  // Read the PDF file
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  
  // Create a new PDF document
  const newPdfDoc = await PDFDocument.create();
  
  // Copy pages from the original PDF (convert to 0-indexed)
  const pages = await newPdfDoc.copyPages(pdfDoc, Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage - 1 + i));
  
  // Add pages to the new document
  pages.forEach((page) => {
    newPdfDoc.addPage(page);
  });
  
  // Generate the PDF bytes
  const pdfBytes = await newPdfDoc.save();
  
  // Create a new File with the extracted pages
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const fileName = file.name.replace(/\.[^/.]+$/, '') + `_pages_${startPage}-${endPage}.pdf`;
  
  return new File([blob], fileName, { type: 'application/pdf' });
}

/**
 * Extracts specific pages from a document file
 * Currently supports PDF files. DOCX support would require backend or additional library.
 * @param file - The document file to extract pages from
 * @param startPage - The starting page number (1-indexed)
 * @param endPage - The ending page number (1-indexed, inclusive)
 * @returns A new File containing only the selected pages, or null if extraction is not supported
 */
export async function extractPagesFromDocument(
  file: File,
  startPage: number,
  endPage: number
): Promise<File | null> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  switch (fileExtension) {
    case 'pdf':
      return await extractPagesFromPdf(file, startPage, endPage);
    case 'docx':
    case 'doc':
      // DOCX extraction would require backend support or a more complex library
      // For now, return null to indicate it's not supported client-side
      console.warn('DOCX page extraction is not yet supported client-side. Backend support may be required.');
      return null;
    default:
      console.warn(`Page extraction is not supported for file type: ${fileExtension}`);
      return null;
  }
}

