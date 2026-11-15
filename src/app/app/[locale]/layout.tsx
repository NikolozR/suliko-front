// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import type { Metadata, Viewport } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { headers } from "next/headers";

import { ClientMessages } from "@office/i18n/client-messages";
import { routing } from "@office/i18n/routing";
import { RegisterServiceWorker } from "@office/shared/components/register-service-worker";
import { ThemeProvider } from "@office/shared/components/theme-provider";
import { Toaster } from "@office/shared/components/ui/sonner";
import { ZoneGuard } from "@office/shared/components/zone-guard";
import { enabledLocalModules } from "@office/i18n/office-path";

import "@office/styles/globals.css";
import { withBasePath } from "@office/shared/lib/base-path";

/*
 * BPG Arial (body) and BPG Mrgvlovani Caps (headings), WOFF2, subset from the
 * TTFs beside them with fontTools:
 *   pyftsubset <font>.ttf --flavor=woff2 --layout-features='*' --unicodes=
 *     U+0020-007E,U+00A0-017F,U+02C6-02DD,U+0400-04FF,U+10A0-10FF,U+1C90-1CBF,
 *     U+2D00-2D2F,U+2000-206F,U+20A0-20CF,U+2100-214F,U+2190-21FF,U+2200-22FF,
 *     U+25A0-25FF
 * Anything outside that (Greek, Arabic, Hebrew) falls back to the system font.
 */
const bodyFont = localFont({
  src: "../../../../fonts/bpg_arial_2009.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-body",
});

const displayFont = localFont({
  src: "../../../../fonts/bpg_mrgvlovani_caps_2010.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: {
    default: "Suliko Office",
    template: "%s · Suliko Office",
  },
  description: "Translation bureau management.",
  // This is an internal tool behind auth — keep it out of every index.
  robots: { index: false, follow: false },
  // What makes Chrome offer "Install app" instead of only "Create shortcut".
  manifest: withBasePath("/manifest.webmanifest"),
  icons: { apple: withBasePath("/icons/apple-touch-icon.png") },
  appleWebApp: { capable: true, title: "Suliko Office" },
};

export const viewport: Viewport = { themeColor: "#3b59f3" };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

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

  // Required for static rendering of locale segments in next-intl v4.
  setRequestLocale(locale);

  // Propagated by middleware.ts so Next can stamp it on its bootstrap scripts.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  // Modules already moved into suliko.ge's own app (phase 3): every page of
  // them is answered there, so this build must not navigate to them in place.
  // Keep it the same as OFFICE_LOCAL_MODULES on suliko-front.
  const moved = enabledLocalModules();

  return (
    // `lang` is what activates the Georgian line-height rules in globals.css.
    // Without it, Mkhedruli descenders clip in headings.
    <html
      lang={locale}
      className={`${bodyFont.variable} ${displayFont.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <RegisterServiceWorker />
        <ZoneGuard owns={{ only: moved }} />
        {/* Which Office modules have clean addresses here (office/i18n/navigation.ts), before anything renders. */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: `window.__sulikoLocal=${JSON.stringify(moved)}` }} />
        <ThemeProvider nonce={nonce}>
          {/* Only the shared messages; each section's layout adds its own. */}
          <ClientMessages locale={locale}>
            {children}
            <Toaster richColors closeButton position="top-center" />
          </ClientMessages>
        </ThemeProvider>
      </body>
    </html>
  );
}
