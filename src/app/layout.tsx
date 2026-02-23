import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Suliko | AI Translation Platform",
    template: "%s | Suliko",
  },
  description:
    "Translate documents and text with AI-assisted workflows, fast turnaround, and a clean editor experience built for teams.",
  applicationName: "Suliko",
  keywords: [
    "AI translation",
    "document translation",
    "text translation",
    "multilingual",
    "localization",
  ],
  openGraph: {
    title: "Suliko | AI Translation Platform",
    description:
      "Translate documents and text with AI-assisted workflows and a clean editing experience.",
    type: "website",
    images: ["/Suliko_logo_black.svg"],
  },
  twitter: {
    card: "summary",
    title: "Suliko | AI Translation Platform",
    description:
      "Translate documents and text with AI-assisted workflows and a clean editing experience.",
    images: ["/Suliko_logo_black.svg"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="verify-paysera" content="721377f22d833010bfe006025ff10ad4"></meta>
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-suliko-main-content-bg-color`}
      >
        <Providers>{children}</Providers>
        
        {/* Brevo Tracker */}
        <Script
          src="https://cdn.brevo.com/js/sdk-loader.js"
          strategy="afterInteractive"
        />
        <Script id="brevo-init" strategy="afterInteractive">
          {`
            window.Brevo = window.Brevo || [];
            Brevo.push([
              "init",
              {
                client_key: "k9gjme1efnz6rcx1wtl5w9oy",
              }
            ]);
          `}
        </Script>
      </body>
    </html>
  );
}
