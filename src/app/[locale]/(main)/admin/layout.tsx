import React from "react";
import { getLocale } from "next-intl/server";

import { adminAccess, adminNavLabels } from "@/features/admin/access";
import { AdminSectionNav } from "@/features/admin/components/AdminSectionNav";

/**
 * The admin console inside the one shell (sidebar and top bar), with the one
 * navigation above its screens. The screens themselves are still the older
 * dark ones, kept in a panel of their own until each is restyled.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const [access, labels] = await Promise.all([adminAccess(), adminNavLabels(locale)]);

  return (
    <div className="min-h-screen px-4 py-6 md:px-6">
      <AdminSectionNav locale={locale} access={access} labels={labels} />

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500;12..96,600&display=swap"
        rel="stylesheet"
      />
      <div
        className="admin-legacy"
        style={{
          background: "#0f1117",
          color: "#f8fafc",
          fontFamily: "'Bricolage Grotesque', sans-serif",
          borderRadius: 12,
          padding: 24,
          minWidth: 0,
        }}
      >
        {children}
      </div>

      <style>{`
        .admin-nav-link:hover {
          background: rgba(251, 191, 36, 0.08);
          color: #fbbf24;
        }
        @media (max-width: 640px) {
          .admin-legacy { padding: 16px 12px !important; }
        }
      `}</style>
    </div>
  );
}
