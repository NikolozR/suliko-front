import type { Metadata } from "next";

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
  other: {
    "verify-paysera": "721377f22d833010bfe006025ff10ad4",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
