// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
/**
 * A name cut to fit a sentence: "Delete {name}?" with a 100-character
 * company name, set in the capitals of the heading face, filled the whole
 * dialog (audit F28). Whole words where possible, then an ellipsis.
 */
export function shortName(name: string, max = 40): string {
  const trimmed = name.trim();
  if (trimmed.length <= max) return trimmed;
  const cut = trimmed.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max / 2 ? cut.slice(0, space) : cut).trimEnd()}…`;
}
