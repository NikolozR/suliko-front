import type { AbstractIntlMessages } from "next-intl";

/**
 * Translate's texts the orders-from-bureaus pieces use, for an Office screen
 * (which loads only Office's messages): wrap them in a NextIntlClientProvider
 * with these. Server only.
 */
export async function ordersMessages(locale: string): Promise<AbstractIntlMessages> {
  const lang = locale === "en" || locale === "pl" ? locale : "ka";
  const all = (await import(`../../../messages/${lang}.json`)).default as Record<string, AbstractIntlMessages>;
  return { Orders: all.Orders, Sidebar: all.Sidebar, A11y: all.A11y, Common: all.Common };
}
