// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getClient } from "@office/features/clients/api";
import { ClientForm } from "@office/features/clients/components/client-form";
import { listOptions } from "@office/features/options/api";
import { requirePermission } from "@office/shared/auth/guards";
import { BackLink } from "@office/shared/components/back-link";
import { PageHeader } from "@office/shared/components/page-header";
import { sectionMark } from "@office/shared/config/navigation";
import { ApiError } from "@office/shared/lib/api";
import { tolerate } from "@office/shared/lib/tolerate";
import { clientNumberOf, pageTitle } from "@office/shared/lib/page-title";

export const generateMetadata = pageTitle("editClient", clientNumberOf, "clients");

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  await requirePermission("clients.write", locale);

  if (!/^\d{1,10}$/.test(id)) notFound();
  const clientId = Number(id);
  const t = await getTranslations("clients");

  let client;
  try {
    client = await getClient(clientId);
  } catch (error) {
    // The API returns 404 both for "no such client" and "belongs to another
    // tenant" — deliberately indistinguishable, so this does too.
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const sources = await tolerate(listOptions("acquisition_source"));

  return (
    <>
      <PageHeader
        {...sectionMark("clients")}
        title={t("editTitle", { name: client.name })}
        actions={<BackLink href={`/clients/${client.id}`} label={client.name} />}
      />
      <ClientForm
        client={client}
        sourceOptions={sources.data?.map((o) => o.value)}
        canAddSources
      />
    </>
  );
}
