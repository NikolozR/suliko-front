"use client";

import { createContext, useContext, type ReactNode } from "react";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";

import type { TranslateSearchTexts } from "@/features/search/types";
import { NotificationBell, type OfficeBellPart } from "./NotificationBell";

interface Texts {
  locale: string;
  messages: AbstractIntlMessages;
  /** Translate's half of the search box, as words. */
  search?: TranslateSearchTexts;
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
  search,
  children,
}: Texts & { children: ReactNode }) {
  return <TextsContext.Provider value={{ locale, messages, search }}>{children}</TextsContext.Provider>;
}

/** Translate's half of the search box on an Office screen, or null. */
export function useTranslateSearchTexts(): TranslateSearchTexts | null {
  return useContext(TextsContext)?.search ?? null;
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
