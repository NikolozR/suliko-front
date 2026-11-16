"use client";

import { createContext, useContext, type ReactNode } from "react";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";

import { NotificationBell, type OfficeBellPart } from "./NotificationBell";

interface Texts {
  locale: string;
  messages: AbstractIntlMessages;
}

const TextsContext = createContext<Texts | null>(null);

/**
 * On an Office screen (which loads only Office's messages): hands the bell
 * Translate's "Notifications" texts, set in the Office layout. The bell is in
 * Office's top bar, far from the layout, so it reads them from here.
 */
export function TranslateNotificationTexts({
  locale,
  messages,
  children,
}: Texts & { children: ReactNode }) {
  return <TextsContext.Provider value={{ locale, messages }}>{children}</TextsContext.Provider>;
}

/** The one bell, drawn where only Office's messages are loaded. */
export function OfficeScreenBell({ office, texts }: { office?: OfficeBellPart; texts?: Texts }) {
  const fromContext = useContext(TextsContext);
  const t = texts ?? fromContext;
  if (!t) return null;
  return (
    <NextIntlClientProvider locale={t.locale} messages={t.messages}>
      <NotificationBell office={office} />
    </NextIntlClientProvider>
  );
}
