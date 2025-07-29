import type { Metadata } from "next";
import "../globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/features/ui";
import { ThemeToggle } from "@/features/ui";
import { LanguageSwitcher } from "@/shared/components/LanguageSwitcher";

import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Suliko",
  description: "Suliko Description",
  icons: {
    icon: '/favicon.ico',
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const t = await getTranslations();
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }


  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-suliko-main-content-bg-color`}
      >
        <NextIntlClientProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <div className="flex items-center gap-4 p-4 fixed top-0 right-0 z-50">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
            {/* Beta Banner */}
            <div className="w-full flex justify-center fixed top-0 left-0 z-40 pointer-events-none">
              <div className="backdrop-blur bg-suliko-default-color/80 dark:bg-slate-800/80 text-white dark:text-slate-200 px-6 py-2 rounded-b-lg shadow-md text-sm font-medium pointer-events-auto border-b border-suliko-default-color/30 dark:border-slate-700/50">
                {t("BetaBanner")}
              </div>
            </div>
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
