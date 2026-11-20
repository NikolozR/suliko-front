import type { AbstractIntlMessages } from "next-intl";

/**
 * Some of Translate's texts, for Translate components shown on an Office screen
 * (which loads only Office's messages): wrap them in a NextIntlClientProvider
 * with these. Server only.
 */
export async function translateMessages(
  locale: string,
  namespaces: readonly string[],
): Promise<AbstractIntlMessages> {
  const lang = locale === "en" || locale === "pl" || locale === "hy" ? locale : "ka";
  const all = (await import(`../../../messages/${lang}.json`)).default as Record<string, AbstractIntlMessages>;
  return Object.fromEntries(namespaces.map((name) => [name, all[name] ?? {}]));
}
