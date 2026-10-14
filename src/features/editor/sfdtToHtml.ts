/**
 * The Word editor's document as the plain HTML the rest of the site works on.
 *
 * The editor (Syncfusion's Document Editor) keeps a document in its own JSON
 * (SFDT) and writes a Word file, but it cannot write HTML. The translation
 * page's autosave, the review of the translation ("regenerate suggestions"
 * reads it from the server), copying, the text download and the PDF all want
 * HTML, as they did when the editor was Tiptap. This turns the editor's JSON
 * into the same kind of HTML the translation service sends: headings,
 * paragraphs, bold, italic, underline, lists, tables, colours, alignment.
 *
 * It reads the editor's long key names (`serialize()` with `optimizeSfdt` off,
 * which the editor on this site is set to). Page layout, headers and footers
 * have no HTML form and are not in the result; the Word file keeps them.
 */

type Json = Record<string, unknown>;

const arr = (value: unknown): Json[] => (Array.isArray(value) ? (value as Json[]) : []);
const obj = (value: unknown): Json => (value && typeof value === "object" ? (value as Json) : {});
const str = (value: unknown): string => (typeof value === "string" ? value : "");
const num = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? value : 0);

export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const escapeAttribute = (text: string) => escapeHtml(text).replace(/"/g, "&quot;");

/** The editor's colour names for a highlighter pen, as CSS. */
const HIGHLIGHTS: Record<string, string> = {
  yellow: "#ffff00",
  brightgreen: "#00ff00",
  turquoise: "#00ffff",
  pink: "#ff00ff",
  blue: "#0000ff",
  red: "#ff0000",
  darkblue: "#000080",
  teal: "#008080",
  green: "#008000",
  violet: "#800080",
  darkred: "#800000",
  darkyellow: "#808000",
  gray50: "#808080",
  gray25: "#c0c0c0",
  black: "#000000",
};

/**
 * "#RRGGBB", or "#RRGGBBAA" as the editor keeps colours, as "#rrggbb". Null for no colour: the
 * editor's "automatic" (an alpha of 00, or the word "empty") is the text colour of the page.
 */
function cssColor(value: unknown): string | null {
  const text = str(value).trim();
  const withAlpha = /^#([0-9a-f]{6})([0-9a-f]{2})$/i.exec(text);
  if (withAlpha) return withAlpha[2] === "00" ? null : `#${withAlpha[1].toLowerCase()}`;
  if (/^#[0-9a-f]{6}$/i.test(text)) return text.toLowerCase();
  return HIGHLIGHTS[text.toLowerCase()] ?? null;
}

interface Styles {
  /** A style's own paragraph alignment, followed up its "based on" chain. */
  align(name: string): string;
  /** The face and size a run has when it says nothing. */
  baseFont: string;
  baseSize: number;
}

function readStyles(document: Json): Styles {
  const byName = new Map<string, Json>();
  for (const style of arr(document.styles)) byName.set(str(style.name), style);
  const normal = obj(byName.get("Normal"));
  const character = obj(normal.characterFormat);
  const documentCharacter = obj(document.characterFormat);
  const baseFont = str(character.fontFamily) || str(documentCharacter.fontFamily);
  const baseSize = num(character.fontSize) || num(documentCharacter.fontSize);
  const align = (name: string): string => {
    const seen = new Set<string>();
    let current: string | undefined = name;
    while (current && !seen.has(current)) {
      seen.add(current);
      const style = byName.get(current);
      const own = str(obj(style?.paragraphFormat).textAlignment);
      if (own) return own;
      current = style ? str(style.basedOn) || undefined : undefined;
    }
    return "";
  };
  return { align, baseFont, baseSize };
}

interface Lists {
  /** "ul" for a bullet list, "ol" (with its numbering `type`) for a numbered one. */
  kind(listId: number, level: number): { tag: "ul" | "ol"; type?: string };
}

function readLists(document: Json): Lists {
  const abstractById = new Map<number, Json>();
  for (const list of arr(document.abstractLists)) abstractById.set(num(list.abstractListId), list);
  const abstractOf = new Map<number, number>();
  for (const list of arr(document.lists)) abstractOf.set(num(list.listId), num(list.abstractListId));
  return {
    kind(listId, level) {
      const abstract = abstractById.get(abstractOf.get(listId) ?? listId);
      const levels = arr(abstract?.levels);
      const pattern = str(levels[Math.min(level, Math.max(0, levels.length - 1))]?.listLevelPattern);
      switch (pattern) {
        case "Bullet":
        case "None":
        case "":
          return { tag: "ul" };
        case "LowLetter":
          return { tag: "ol", type: "a" };
        case "UpLetter":
          return { tag: "ol", type: "A" };
        case "LowRoman":
          return { tag: "ol", type: "i" };
        case "UpRoman":
          return { tag: "ol", type: "I" };
        default:
          return { tag: "ol" };
      }
    },
  };
}

interface Context {
  styles: Styles;
  lists: Lists;
}

const POINT_TO_PIXEL = 96 / 72;

/** A run's text with the formatting the editor gave it, as HTML. */
function serializeRun(text: string, format: Json, context: Context): string {
  if (!text) return "";
  let html = escapeHtml(text);

  const css: string[] = [];
  const color = cssColor(format.fontColor);
  if (color) css.push(`color:${color}`);
  const highlight = cssColor(format.highlightColor);
  if (highlight) css.push(`background-color:${highlight}`);
  const family = str(format.fontFamily);
  if (family && family !== context.styles.baseFont) css.push(`font-family:${family}`);
  const size = num(format.fontSize);
  if (size && size !== context.styles.baseSize) css.push(`font-size:${size}pt`);
  if (css.length > 0) html = `<span style="${escapeAttribute(css.join(";"))}">${html}</span>`;

  const baseline = str(format.baselineAlignment);
  if (baseline === "Superscript") html = `<sup>${html}</sup>`;
  else if (baseline === "Subscript") html = `<sub>${html}</sub>`;
  const strike = str(format.strikethrough);
  if (strike && strike !== "None") html = `<s>${html}</s>`;
  const underline = str(format.underline);
  if (underline && underline !== "None") html = `<u>${html}</u>`;
  if (format.italic === true) html = `<em>${html}</em>`;
  if (format.bold === true) html = `<strong>${html}</strong>`;
  return html;
}

function serializeInlines(inlines: Json[], context: Context): string {
  let html = "";
  // Fields (a link, a page number) are begin / code / separator / result / end.
  const fields: { inCode: boolean; code: string; link: boolean }[] = [];

  for (const inline of inlines) {
    const type = inline.fieldType;
    if (type === 0) {
      fields.push({ inCode: true, code: "", link: false });
      continue;
    }
    if (type === 2) {
      const field = fields[fields.length - 1];
      if (field) {
        field.inCode = false;
        const link = /^\s*HYPERLINK\s+"([^"]*)"/i.exec(field.code);
        if (link) {
          field.link = true;
          html += `<a href="${escapeAttribute(link[1])}">`;
        }
      }
      continue;
    }
    if (type === 1) {
      const field = fields.pop();
      if (field?.link) html += "</a>";
      continue;
    }

    const inField = fields[fields.length - 1];
    if (typeof inline.text === "string") {
      if (inField?.inCode) {
        inField.code += inline.text;
        continue;
      }
      const format = obj(inline.characterFormat);
      // A line break, a page break and a tab are single characters in the text.
      for (const piece of inline.text.split(/(\u000b|\f|\t)/)) {
        if (piece === "\u000b") html += "<br>";
        else if (piece === "\f") continue;
        else if (piece === "\t") html += "&nbsp;&nbsp;&nbsp;&nbsp;";
        else html += serializeRun(piece, format, context);
      }
    } else if (typeof inline.imageString === "string" && inline.imageString) {
      const width = Math.round(num(inline.width) * POINT_TO_PIXEL);
      const height = Math.round(num(inline.height) * POINT_TO_PIXEL);
      const size = width > 0 && height > 0 ? ` width="${width}" height="${height}"` : "";
      const source = inline.imageString.startsWith("data:") ? inline.imageString : `data:image/png;base64,${inline.imageString}`;
      html += `<img src="${escapeAttribute(source)}"${size}>`;
    }
  }
  return html;
}

function paragraphStyle(paragraph: Json, context: Context, isListItem: boolean): string {
  const format = obj(paragraph.paragraphFormat);
  const css: string[] = [];
  const align = (str(format.textAlignment) || context.styles.align(str(format.styleName))).toLowerCase();
  if (align === "center" || align === "right" || align === "justify") css.push(`text-align:${align}`);
  if (!isListItem) {
    const left = num(format.leftIndent);
    if (left > 0) css.push(`margin-left:${Math.round(left)}pt`);
    const first = num(format.firstLineIndent);
    if (first > 0) css.push(`text-indent:${Math.round(first)}pt`);
  }
  return css.length > 0 ? ` style="${css.join(";")}"` : "";
}

function headingLevel(paragraph: Json): number {
  const match = /^Heading ([1-6])$/.exec(str(obj(paragraph.paragraphFormat).styleName));
  return match ? Number(match[1]) : 0;
}

function serializeTable(table: Json, context: Context): string {
  let html = "<table><tbody>";
  for (const row of arr(table.rows)) {
    html += "<tr>";
    for (const cell of arr(row.cells)) {
      const format = obj(cell.cellFormat);
      const span = num(format.columnSpan);
      const rowSpan = num(format.rowSpan);
      const attributes: string[] = [];
      if (span > 1) attributes.push(`colspan="${span}"`);
      if (rowSpan > 1) attributes.push(`rowspan="${rowSpan}"`);
      const background = cssColor(obj(format.shading).backgroundColor);
      if (background && background !== "#ffffff") attributes.push(`style="background-color:${background}"`);
      html += `<td${attributes.length > 0 ? " " + attributes.join(" ") : ""}>${serializeBlocks(arr(cell.blocks), context)}</td>`;
    }
    html += "</tr>";
  }
  return html + "</tbody></table>";
}

interface OpenList {
  tag: "ul" | "ol";
  level: number;
}

function serializeBlocks(blocks: Json[], context: Context): string {
  let html = "";
  // The lists open at the moment, outermost first: a nested list lives inside the item above it.
  const open: OpenList[] = [];

  const closeTo = (level: number) => {
    while (open.length > 0 && open[open.length - 1].level > level) {
      const closing = open.pop()!;
      html += `</li></${closing.tag}>`;
    }
  };
  const closeAll = () => {
    closeTo(-1);
  };

  for (const block of blocks) {
    if (Array.isArray(block.rows)) {
      closeAll();
      html += serializeTable(block, context);
      continue;
    }

    const format = obj(block.paragraphFormat);
    const list = obj(format.listFormat);
    const inner = serializeInlines(arr(block.inlines), context);
    const listId = list.listId;

    if (typeof listId === "number" && listId >= 0) {
      const level = num(list.listLevelNumber);
      const kind = context.lists.kind(listId, level);
      const top = open[open.length - 1];
      if (!top || top.level < level) {
        // A deeper level opens inside the item above it (or, at the start, opens the list).
        const type = kind.type ? ` type="${kind.type}"` : "";
        html += `<${kind.tag}${type}><li>`;
        open.push({ tag: kind.tag, level });
      } else {
        closeTo(level);
        const sibling = open[open.length - 1];
        if (sibling && sibling.level === level && sibling.tag === kind.tag) {
          html += "</li><li>";
        } else {
          // The same depth, but a bullet list where there was a numbered one (or the reverse).
          if (sibling && sibling.level === level) {
            open.pop();
            html += `</li></${sibling.tag}>`;
          }
          const type = kind.type ? ` type="${kind.type}"` : "";
          html += `<${kind.tag}${type}><li>`;
          open.push({ tag: kind.tag, level });
        }
      }
      html += `<p${paragraphStyle(block, context, true)}>${inner}</p>`;
      continue;
    }

    closeAll();
    const level = headingLevel(block);
    if (level > 0) html += `<h${level}${paragraphStyle(block, context, false)}>${inner}</h${level}>`;
    else html += `<p${paragraphStyle(block, context, false)}>${inner}</p>`;
  }
  closeAll();
  return html;
}

/**
 * The editor's document (the text `documentEditor.serialize()` answers, or its parsed form) as
 * HTML. Throws on text that is not the editor's JSON.
 */
export function sfdtToHtml(sfdt: string | Json): string {
  const document = typeof sfdt === "string" ? obj(JSON.parse(sfdt)) : obj(sfdt);
  const context: Context = { styles: readStyles(document), lists: readLists(document) };
  let html = "";
  for (const section of arr(document.sections)) html += serializeBlocks(arr(section.blocks), context);
  return html;
}

/** The HTML as text: paragraphs, list items, cells and rows on lines of their own. */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<img\b[^>]*>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<\/t[dh]>/gi, "\t")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}
