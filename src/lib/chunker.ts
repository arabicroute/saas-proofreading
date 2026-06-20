// Splits Arabic text into chunks of maxChars, respecting sentence/paragraph
// boundaries where possible (splits on Arabic sentence terminators and newlines
// before falling back to the hard character limit).

const ARABIC_SENTENCE_BREAKS = /[.!?؟।\n]+/g;
const CHUNK_DELIMITER_OPEN   = "=== المقطع الحالي ===";
const CHUNK_DELIMITER_CLOSE  = "=== نهاية المقطع ===";

export function wrapChunk(text: string): string {
  return `${CHUNK_DELIMITER_OPEN}\n${text.trim()}\n${CHUNK_DELIMITER_CLOSE}`;
}

export function splitIntoChunks(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];

  const chunks: string[] = [];
  let current = "";

  // Tokenise on sentence breaks, keeping the delimiter attached to each segment
  const segments = text.split(ARABIC_SENTENCE_BREAKS);

  for (const seg of segments) {
    if (!seg.trim()) continue;
    if ((current + seg).length > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = seg;
    } else {
      current += (current ? " " : "") + seg;
    }
  }

  if (current.trim()) chunks.push(current.trim());

  // Safety pass: hard-split any chunk still exceeding maxChars
  return chunks.flatMap(c =>
    c.length <= maxChars
      ? [c]
      : Array.from({ length: Math.ceil(c.length / maxChars) }, (_, i) =>
          c.slice(i * maxChars, (i + 1) * maxChars)
        )
  );
}
