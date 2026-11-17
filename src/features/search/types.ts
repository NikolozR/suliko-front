/**
 * What Translate's half of the one search says, as plain strings: for Office's
 * search box, which has only Office's messages. Built on the server
 * (texts.ts) in the reader's language.
 */
export interface TranslateSearchTexts {
  /** The language the site is in, for the addresses of Translate's pages. */
  locale: string;
  pagesTitle: string;
  translationsTitle: string;
  pages: { key: string; href: string; label: string }[];
}
