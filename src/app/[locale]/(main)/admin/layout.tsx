import React from "react";
import { getLocale } from "next-intl/server";

import { adminAccess, adminNavLabels } from "@/features/admin/access";
import { AdminSectionNav } from "@/features/admin/components/AdminSectionNav";

/**
 * The admin console inside the one shell (sidebar and top bar), with the one
 * navigation above its screens.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const [access, labels] = await Promise.all([adminAccess(), adminNavLabels(locale)]);

  return (
    <div className="min-h-screen px-4 py-6 md:px-6">
      <AdminSectionNav locale={locale} access={access} labels={labels} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
