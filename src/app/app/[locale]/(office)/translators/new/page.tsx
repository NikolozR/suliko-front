// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getReference } from "@office/features/calculator/api";
import { TranslatorForm } from "@office/features/translators/components/translator-form";
import { requirePermission } from "@office/shared/auth/guards";
import { BackLink } from "@office/shared/components/back-link";
import { PageHeader } from "@office/shared/components/page-header";
import { sectionMark } from "@office/shared/config/navigation";
import { pageTitle } from "@office/shared/lib/page-title";
import { tolerate } from "@office/shared/lib/tolerate";

export const generateMetadata = pageTitle("newTranslator");

export default async function NewTranslatorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Hiding the button is not enough — this URL is guessable.
  await requirePermission("translators.write", locale);
  const t = await getTranslations("translators");
  // The pair dropdowns. Without them the rest of the form still works.
  const reference = await tolerate(getReference());

  return (
    <>
      <PageHeader
        {...sectionMark("translators")}
        title={t("newTitle")}
        description={t("newDescription")}
        actions={<BackLink href="/translators" label={t("backToTranslators")} />}
      />
      <TranslatorForm languages={reference.data?.languages ?? []} />
    </>
  );
}
