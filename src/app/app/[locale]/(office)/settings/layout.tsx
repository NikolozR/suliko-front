// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { ClientMessages } from "@office/i18n/client-messages";

/**
 * This section's client components need settings, invoice and onboarding on
 * top of the shared set.
 */
export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <ClientMessages locale={locale} extra={["settings", "invoice", "onboarding", "import", "auth.choose.consentLegend", "auth.choose.consentYes", "auth.choose.consentNo", "auth.choose.consentHint"]}>
      {children}
    </ClientMessages>
  );
}
