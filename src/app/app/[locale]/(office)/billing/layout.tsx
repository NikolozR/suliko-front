// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { ClientMessages } from "@office/i18n/client-messages";

/** The move-up confirmation on this page is a client component with its own texts. */
export default async function BillingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <ClientMessages locale={locale} extra={["billing.upgrade"]}>
      {children}
    </ClientMessages>
  );
}
