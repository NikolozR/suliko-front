/**
 * Minimal typing for `marked`.
 *
 * The installed build resolves to an ESM file with no bundled declarations, so every call
 * site otherwise trips TS7016. Existing callers work around this with `require()` casts;
 * this declaration lets them use a normal dynamic import instead.
 *
 * Only the synchronous form is declared, which is the only way this codebase calls it —
 * `marked` returns a Promise unless `async: false` is passed.
 */
declare module "marked" {
  export function marked(src: string, options?: { async?: false }): string;
}
