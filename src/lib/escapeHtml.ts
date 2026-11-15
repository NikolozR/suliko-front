/**
 * Makes visitor-supplied text safe to place inside an HTML email body. Names, notes
 * and addresses arrive from an open form, and unescaped they could add links, images
 * or styling to the message our own staff open.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** For an email header such as the subject: no line breaks, so no extra headers. */
export function singleLine(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim();
}
