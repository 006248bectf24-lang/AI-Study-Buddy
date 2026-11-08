// Splits long text into chunks (~maxChars), preferring paragraph/sentence breaks
export function chunkText(text, maxChars = 12000) {
  const clean = text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const chunks = [];
  let start = 0;
  while (start < clean.length) {
    let end = Math.min(start + maxChars, clean.length);
    if (end < clean.length) {
      const windowText = clean.slice(start, end);
      const cut = Math.max(windowText.lastIndexOf("\n\n"), windowText.lastIndexOf(". "));
      if (cut > maxChars * 0.5) end = start + cut + 1;
    }
    chunks.push(clean.slice(start, end).trim());
    start = end;
  }
  return chunks.filter(Boolean);
}

// Picks at most `max` chunks, evenly spread across the document
export function selectChunks(chunks, max) {
  if (chunks.length <= max) return chunks;
  return Array.from({ length: max }, (_, i) => chunks[Math.floor((i * chunks.length) / max)]);
}
