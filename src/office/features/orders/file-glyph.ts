// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import {
  File as FileGlyph,
  FileCode2,
  FileImage,
  FileSpreadsheet,
  FileText,
  type LucideIcon,
} from "lucide-react";

/**
 * The mark for what kind of file this is: the eye sorts scans from documents
 * before reading a name. One place, so a PDF is the same red in the order's
 * files panel and on the order form.
 */
export function fileGlyph(name: string, contentType: string): { icon: LucideIcon; ink: string } {
  const type = contentType;
  const lower = name.toLowerCase();
  if (type === "application/pdf" || lower.endsWith(".pdf")) {
    return { icon: FileText, ink: "text-hue-red-ink" };
  }
  if (type.startsWith("image/")) return { icon: FileImage, ink: "text-hue-violet-ink" };
  if (type === "text/html") return { icon: FileCode2, ink: "text-hue-teal-ink" };
  if (/sheet|excel|csv/.test(type) || /\.(xlsx?|csv)$/.test(lower)) {
    return { icon: FileSpreadsheet, ink: "text-hue-green-ink" };
  }
  if (/word|document|rtf|text\/plain/.test(type) || /\.(docx?|rtf|txt|odt)$/.test(lower)) {
    return { icon: FileText, ink: "text-hue-blue-ink" };
  }
  return { icon: FileGlyph, ink: "text-muted-foreground" };
}
