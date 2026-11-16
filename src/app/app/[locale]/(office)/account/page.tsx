// Owned by suliko-front: the account is Profile now (Office's two-factor and
// leave/delete live in its Security tab, shared/nav/OfficeAccountSection.tsx).
import { redirect } from "next/navigation";

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/profile#security`);
}
