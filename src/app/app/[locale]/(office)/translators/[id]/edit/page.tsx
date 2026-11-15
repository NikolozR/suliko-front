// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getReference } from "@office/features/calculator/api";
import { getTranslator } from "@office/features/translators/api";
import { TranslatorForm } from "@office/features/translators/components/translator-form";
import { requirePermission } from "@office/shared/auth/guards";
import { BackLink } from "@office/shared/components/back-link";
import { PageHeader } from "@office/shared/components/page-header";
import { sectionMark } from "@office/shared/config/navigation";
import { ApiError } from "@office/shared/lib/api";
import { pageTitle } from "@office/shared/lib/page-title";
import { tolerate } from "@office/shared/lib/tolerate";

export const generateMetadata = pageTitle("editTranslator");

export default async function EditTranslatorPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  await requirePermission("translators.write", locale);

  const translatorId = Number(id);
  if (!Number.isFinite(translatorId)) notFound();

  // The pair dropdowns. Without them the rest of the form still works.
  const reference = await tolerate(getReference());

  let translator;
  try {
    translator = await getTranslator(translatorId);
  } catch (error) {
    // 404 covers "no such translator" and "belongs to another tenant" alike —
    // the API makes them indistinguishable on purpose, so this does too.
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <>
      <PageHeader
        {...sectionMark("translators")}
        title={(await getTranslations("translators"))("editTitle", { name: translator.name })}
        actions={
          <BackLink href={`/translators/${translator.id}`} label={translator.name} />
        }
      />
      <TranslatorForm translator={translator} languages={reference.data?.languages ?? []} />
    </>
  );
}
