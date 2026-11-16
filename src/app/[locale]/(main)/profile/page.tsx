import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getSession } from "@office/shared/auth/session";
import { OfficeAccountSection } from "@/shared/nav/OfficeAccountSection";
import ProfileClient from "@/features/profile/components/ProfileClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PageTitles" });
  return { title: t("profile") };
}

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // Signed in to Office too: Billing then links to the one Billing page.
  const hasOffice = Boolean(process.env.OFFICE_API_BASE_URL && (await getSession().catch(() => null)));
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-[#181c2a] dark:via-[#232a45] dark:to-[#232a45]">
      <ProfileClient hasOffice={hasOffice} officeSection={hasOffice ? <OfficeAccountSection locale={locale} /> : null} />
    </div>
  );
} 