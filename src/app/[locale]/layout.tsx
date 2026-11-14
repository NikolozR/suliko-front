import type { Metadata, Viewport } from "next";
import "../globals.css";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { ThemeProvider } from "@/features/ui";
// import BetaBanner from "@/shared/components/BetaBanner";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Toaster } from "react-hot-toast";
import RouteTransitionProgress from "@/shared/components/RouteTransitionProgress";
import WebVitalsMonitor from "@/shared/components/WebVitalsMonitor";
import RegisterServiceWorker from "@/shared/components/RegisterServiceWorker";

import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import TopRightControls from "@/shared/components/TopRightControls";
import SkipLink from "@/shared/components/SkipLink";
import SessionRefreshProvider from "@/shared/components/SessionRefreshProvider";
import DeferredScripts from "@/shared/components/DeferredScripts";
import { getDeferredTrackers } from "@/shared/utils/deferredTrackers";
import {
  COMPANY_ADDRESS_EN,
  COMPANY_EMAIL,
  COMPANY_ID,
  COMPANY_NAME_EN,
  COMPANY_PHONE,
} from "@/shared/constants/company";
import {
  getMetaPixelId,
  isAnalyticsEnabled,
} from "@/shared/utils/analyticsEnv";
// import OneTimeOfferModal from "@/shared/components/OneTimeOfferModal";

/*
 * BPG Arial (text) and BPG Mrgvlovani Caps (h1 to h4): the same two WOFF2 files
 * Suliko Office loads, subset to Latin, Cyrillic, Georgian and punctuation
 * (23 KB + 20 KB where the TTFs are 149 KB + 95 KB). next/font preloads them.
 * A glyph outside the subset falls back to the system font.
 */
const bodyFont = localFont({
  src: "../../../fonts/bpg_arial_2009.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-body",
});

const displayFont = localFont({
  src: "../../../fonts/bpg_mrgvlovani_caps_2010.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-display",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DOMAIN_KA = "https://suliko.ge";
const DOMAIN_EN = "https://suliko.io";
const DOMAIN_PL = "https://suliko.ge/pl";

function getCanonical(locale: string): string {
  if (locale === "ka") return DOMAIN_KA;
  if (locale === "en") return DOMAIN_EN;
  return DOMAIN_PL;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: {
      absolute: "Suliko Translate",
      template: "%s | Suliko",
    },
    description:
      "Translate documents with precision. Suliko delivers fast, accurate, and secure translations for legal, technical, and business documents in 50+ languages.",
    keywords: ["document translation", "legal translation", "business translation", "Suliko"],
    alternates: {
      canonical: getCanonical(locale),
      languages: {
        ka: DOMAIN_KA,
        en: DOMAIN_EN,
        pl: DOMAIN_PL,
        "x-default": DOMAIN_KA,
      },
    },
    openGraph: {
      type: "website",
      siteName: "Suliko",
      title: "Suliko Translate",
      description:
        "Translate documents with precision. Fast, accurate, and secure translations for legal, technical, and business documents.",
      images: [{ url: "/Suliko_logo_black.svg", width: 1200, height: 630, alt: "Suliko Translate" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Suliko Translate",
      description: "Fast, accurate, and secure document translations in 50+ languages.",
      images: ["/Suliko_logo_black.svg"],
    },
    // What makes Chrome offer "Install app" instead of only "Create shortcut".
    manifest: "/manifest.webmanifest",
    icons: {
      icon: '/favicon.ico',
      apple: '/icons/apple-touch-icon.png',
    },
    appleWebApp: { capable: true, title: "Suliko" },
  };
}

export const viewport: Viewport = { themeColor: "#3b59f3" };

// Keeps the machine-readable identity the same as the one printed on the legal
// pages and registered with the payment provider. See constants/company.ts.
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Suliko",
  legalName: COMPANY_NAME_EN,
  taxID: COMPANY_ID,
  url: "https://suliko.ge",
  logo: "https://suliko.ge/Suliko_logo_black.svg",
  sameAs: [
    "https://www.facebook.com/profile.php?id=61564358761003",
    "https://www.linkedin.com/company/suliko-ai/",
  ],
  address: {
    "@type": "PostalAddress",
    streetAddress: COMPANY_ADDRESS_EN,
    addressCountry: "GE",
  },
  contactPoint: {
    "@type": "ContactPoint",
    email: COMPANY_EMAIL,
    telephone: COMPANY_PHONE,
    contactType: "customer support",
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // undefined on preview/dev deployments and when the id is unconfigured, which
  // omits both the pixel script and its noscript image from the HTML entirely.
  const metaPixelId = isAnalyticsEnabled() ? getMetaPixelId() : undefined;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${bodyFont.variable} ${displayFont.variable} ${geistMono.variable} antialiased bg-suliko-main-content-bg-color`}
      >
        <RegisterServiceWorker />
        <DeferredScripts scripts={getDeferredTrackers(metaPixelId)} />
        {/* Organization structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />

        {/* Meta Pixel (noscript). Same server-side guard as the script above; a
            noscript image cannot check its own hostname, so it rides on VERCEL_ENV. */}
        {metaPixelId && (
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img height="1" width="1" style={{ display: 'none' }} src={`https://www.facebook.com/tr?id=${encodeURIComponent(metaPixelId)}&ev=PageView&noscript=1`} alt="" />
          </noscript>
        )}

        {/* Yandex.Metrika (noscript) */}
        <noscript>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://mc.yandex.ru/watch/104728476" style={{ position: 'absolute', left: '-9999px' }} alt="" />
          </div>
        </noscript>
        {/* Yandex.Metrika 2 (noscript) */}
        <noscript>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://mc.yandex.ru/watch/105466504" style={{ position: 'absolute', left: '-9999px' }} alt="" />
          </div>
        </noscript>
        <NextIntlClientProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <RouteTransitionProgress />
            <WebVitalsMonitor />
            {/* <OneTimeOfferModal /> */}
            <SessionRefreshProvider />
            <SkipLink />
            <TopRightControls />
            {/* <BetaBanner /> */}
            {children}
            <Toaster position="top-right" />
            <Analytics />
            <SpeedInsights />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
