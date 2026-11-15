// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { getTranslations, setRequestLocale } from "next-intl/server";

import { NotaryForm } from "@office/features/notaries/components/notary-form";
import { requirePermission } from "@office/shared/auth/guards";
import { BackLink } from "@office/shared/components/back-link";
import { PageHeader } from "@office/shared/components/page-header";
import { sectionMark } from "@office/shared/config/navigation";
import { pageTitle } from "@office/shared/lib/page-title";

export const generateMetadata = pageTitle("newNotary");

export default async function NewNotaryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  await requirePermission("notaries.write", locale);

  return (
    <>
      <PageHeader
        {...sectionMark("notaries")}
        title={(await getTranslations("notaries"))("newTitle")}
        description={(await getTranslations("notaries"))("newDescription")}
        actions={<BackLink href="/notaries" label={(await getTranslations("notaries"))("backToNotaries")} />}
      />
      <NotaryForm />
    </>
  );
}
