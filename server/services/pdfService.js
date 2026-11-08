// Import the lib file directly: the package root runs debug code under ESM
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import ApiError from "../utils/ApiError.js";

// Extracts plain text from a PDF buffer
export async function extractPdfText(buffer) {
  let data;
  try {
    data = await pdfParse(buffer);
  } catch {
    throw new ApiError(422, "Could not read this PDF. The file may be corrupted or protected.");
  }
  const text = (data.text || "").replace(/[ \t]+\n/g, "\n").trim();
  if (text.length < 50) {
    throw new ApiError(422, "No readable text found in this PDF (it may be scanned images).");
  }
  return text;
}
