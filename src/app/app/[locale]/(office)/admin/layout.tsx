// Owned by suliko-front: the one admin console's navigation above Office's admin screens.
import { ClientMessages } from "@office/i18n/client-messages";
import { adminAccess, adminNavLabels } from "@/features/admin/access";
import { AdminSectionNav } from "@/features/admin/components/AdminSectionNav";

/** This section's client components need platform on top of the shared set. */
export default async function PlatformLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [access, labels] = await Promise.all([adminAccess(), adminNavLabels(locale)]);
  return (
    <ClientMessages locale={locale} extra={["platform"]}>
      <AdminSectionNav locale={locale} access={access} labels={labels} />
      {children}
    </ClientMessages>
  );
}
