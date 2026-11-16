import "server-only";

import { translateMessages } from "@/shared/i18n/translateMessages";
import { SEARCH_PAGES } from "./pages";
import type { TranslateSearchTexts } from "./types";

/** Translate's half of the search, in words, for Office's box. Server only. */
export async function translateSearchTexts(locale: string): Promise<TranslateSearchTexts> {
  const all = await translateMessages(locale, ["Search"]);
  const search = (all.Search ?? {}) as Record<string, unknown>;
  const pages = (search.pages ?? {}) as Record<string, string>;
  return {
    locale,
    pagesTitle: String(search.pagesTitle ?? "Translate"),
    translationsTitle: String(search.translations ?? "Translations"),
    pages: SEARCH_PAGES.map((p) => ({ key: p.key, href: p.href, label: pages[p.key] ?? p.key })),
  };
}
