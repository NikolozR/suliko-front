// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getUser } from "@office/features/users/api";
import { UserForm } from "@office/features/users/components/user-form";
import { requirePermission } from "@office/shared/auth/guards";
import { BackLink } from "@office/shared/components/back-link";
import { PageHeader } from "@office/shared/components/page-header";
import { sectionMark } from "@office/shared/config/navigation";
import { ApiError } from "@office/shared/lib/api";
import { pageTitle } from "@office/shared/lib/page-title";

export const generateMetadata = pageTitle("editUser");

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  await requirePermission("users.manage", locale);
  const t = await getTranslations("users");

  const userId = Number(id);
  if (!Number.isFinite(userId)) notFound();

  let user;
  try {
    user = await getUser(userId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <>
      <PageHeader
        {...sectionMark("users")}
        title={t("editTitle", { name: user.username })}
        description={user.full_name}
        actions={<BackLink href={`/users/${user.id}`} label={t("backToUser")} />}
      />
      <UserForm user={user} />
    </>
  );
}
