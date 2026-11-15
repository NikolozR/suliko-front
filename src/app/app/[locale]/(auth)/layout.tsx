// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { setRequestLocale } from "next-intl/server";

import { ClientMessages } from "@office/i18n/client-messages";

/**
 * Unauthenticated shell. No sidebar, no topbar, no session lookup — this
 * layout must render for someone who has no session at all.
 */
export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="bg-canvas-tint relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      {/* Backdrop: soft brand-blue glows over a faint dot grid. Decorative only. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-suliko-default-color/25 absolute -top-40 -left-32 size-[34rem] rounded-full blur-3xl" />
        <div className="bg-suliko-default-color/20 absolute -right-40 -bottom-48 size-[40rem] rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 size-72 rounded-full bg-sky-400/15 blur-3xl" />
        <div
          className="text-suliko-default-color/20 absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
      </div>
      <ClientMessages locale={locale} extra={["auth"]}>
        {children}
      </ClientMessages>
    </div>
  );
}
