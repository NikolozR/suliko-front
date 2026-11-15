// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getNotary } from "@office/features/notaries/api";
import { NotaryForm } from "@office/features/notaries/components/notary-form";
import { requirePermission } from "@office/shared/auth/guards";
import { BackLink } from "@office/shared/components/back-link";
import { PageHeader } from "@office/shared/components/page-header";
import { sectionMark } from "@office/shared/config/navigation";
import { ApiError } from "@office/shared/lib/api";
import { pageTitle } from "@office/shared/lib/page-title";

export const generateMetadata = pageTitle("editNotary");

export default async function EditNotaryPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  await requirePermission("notaries.write", locale);

  const notaryId = Number(id);
  if (!Number.isFinite(notaryId)) notFound();

  let notary;
  try {
    notary = await getNotary(notaryId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <>
      <PageHeader
        {...sectionMark("notaries")}
        title={(await getTranslations("notaries"))("editTitle", { name: notary.name })}
        actions={<BackLink href={`/notaries/${notary.id}`} label={notary.name} />}
      />
      <NotaryForm notary={notary} />
    </>
  );
}
