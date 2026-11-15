// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
/**
 * What kind of file a translation is, and whether the translation page opens it.
 *
 * Plain functions, no server-only or client-only code: the order's Files panel
 * (a client component) and the translation page (a server one) both ask.
 */

export function isEditableTranslation(file: {
  kind: string;
  content_type: string;
  editable?: boolean;
}): boolean {
  if (file.kind !== "translation") return false;
  // An API that predates the Word editor does not say: then HTML was the
  // only kind of translation that was edited.
  return file.editable ?? file.content_type === "text/html";
}
