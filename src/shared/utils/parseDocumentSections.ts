/**
 * Splits a legal document held as one translated blob into headed sections.
 *
 * A line of its own that starts with "1. " is a heading; everything until the next
 * one is its body. Keeping each document as a single string means translators edit
 * prose rather than a tree of keys.
 *
 * Shared by the public legal pages and the sign-up dialog so both render the same
 * documents the same way.
 */
export function parseDocumentSections(text: string) {
  const blocks = text.split(/\n\n+/);
  const sections: { heading: string | null; body: string }[] = [];
  let current: { heading: string | null; body: string } | null = null;

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    const isHeading =
      /^\d+\.\s/.test(trimmed) && trimmed.split("\n").length === 1;
    if (isHeading) {
      if (current) sections.push(current);
      current = { heading: trimmed, body: "" };
    } else {
      if (current) current.body += (current.body ? "\n\n" : "") + trimmed;
      else sections.push({ heading: null, body: trimmed });
    }
  }
  if (current) sections.push(current);
  return sections;
}
