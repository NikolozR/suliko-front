// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { ClientMessages } from "@office/i18n/client-messages";

/**
 * This section's client components need orders, clients, comments, files,
 * finances and invoice on top of the shared set.
 */
export default async function TranslationsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <ClientMessages locale={locale} extra={["orders", "clients", "comments", "files", "claudeTranslate", "driveMirror", "finances", "invoice", "cities", "translators.form", "units.days"]}>
      {children}
    </ClientMessages>
  );
}
