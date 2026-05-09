/**
 * PDF Parser utility using pdfjs-dist
 * Extracts text content from PDF buffers
 */

/**
 * Parse PDF buffer and extract text
 * @param {Buffer} buffer - PDF file buffer
 * @returns {string} Extracted text content
 */
export const parsePDF = async (buffer) => {
  // Dynamic import for pdfjs-dist (ESM compatibility)
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

  const uint8Array = new Uint8Array(buffer);
  const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
  const pdf = await loadingTask.promise;

  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }

  return fullText.trim();
};

export default { parsePDF };
