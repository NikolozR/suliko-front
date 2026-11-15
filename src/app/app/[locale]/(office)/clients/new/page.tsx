// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ClientForm } from "@office/features/clients/components/client-form";
import { listOptions } from "@office/features/options/api";
import { BackLink } from "@office/shared/components/back-link";
import { PageHeader } from "@office/shared/components/page-header";
import { requirePermission } from "@office/shared/auth/guards";
import { sectionMark } from "@office/shared/config/navigation";
import { tolerate } from "@office/shared/lib/tolerate";
import { pageTitle } from "@office/shared/lib/page-title";

export const generateMetadata = pageTitle("newClient");

export default async function NewClientPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Hiding the button is not enough — someone can navigate here directly.
  await requirePermission("clients.write", locale);
  const t = await getTranslations("clients");
  // A list that fails to load still leaves the built-in sources to pick from.
  const sources = await tolerate(listOptions("acquisition_source"));

  return (
    <>
      <PageHeader
        {...sectionMark("clients")}
        title={t("newTitle")}
        description={t("newDescription")}
        actions={<BackLink href="/clients" label={t("backToClients")} />}
      />
      <ClientForm sourceOptions={sources.data?.map((o) => o.value)} canAddSources />
    </>
  );
}
