/**
 * Replaces `target` with `replacement` when it occurs exactly once in
 * `content`; returns null otherwise. Mirrors the backend's TryApplyExactly,
 * which made the edit in the first place, so undoing it finds the same text.
 *
 * `target` is text as a reader sees it, while `content` may be HTML: any
 * whitespace run matches any whitespace run, and in HTML the characters the
 * markup escapes are matched -- and written -- escaped.
 */
export function replaceExactlyOnce(content: string, target: string, replacement: string): string | null {
  if (!content || !target.trim()) return null;

  const isHtml = /<\/?[a-zA-Z][a-zA-Z0-9]*[^>]*>/.test(content);
  const needle = isHtml ? escapeHtmlText(target) : target;

  const words = needle.split(/\s+/).filter(Boolean).map(escapeRegExp);
  if (words.length === 0) return null;

  let pattern = words.join("\\s+");
  if (/^\s/.test(needle)) pattern = "\\s+" + pattern;
  if (/\s$/.test(needle)) pattern += "\\s+";

  const matches = [...content.matchAll(new RegExp(pattern, "g"))];
  if (matches.length !== 1) return null;

  const match = matches[0];
  const index = match.index ?? 0;
  const value = isHtml ? escapeHtmlText(replacement) : replacement;
  return content.slice(0, index) + value + content.slice(index + match[0].length);
}

function escapeHtmlText(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
