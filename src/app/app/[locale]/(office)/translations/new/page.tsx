// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { Settings, Tags } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getReference } from "@office/features/calculator/api";
import { getClient } from "@office/features/clients/api";
import { listNotaries } from "@office/features/notaries/api";
import { OrderForm } from "@office/features/orders/components/order-form";
import { Link } from "@office/i18n/navigation";
import { listTranslators } from "@office/features/translators/api";
import { assigneeWork } from "@office/features/orders/types";
import { requirePermission } from "@office/shared/auth/guards";
import { ApiUnavailable } from "@office/shared/components/data/api-unavailable";
import { BackLink } from "@office/shared/components/back-link";
import { Can } from "@office/shared/components/can";
import { PageHeader } from "@office/shared/components/page-header";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent } from "@office/shared/components/ui/card";
import { sectionMark } from "@office/shared/config/navigation";
import { tolerate } from "@office/shared/lib/tolerate";
import { pageTitle } from "@office/shared/lib/page-title";

export const generateMetadata = pageTitle("newOrder");

export default async function NewOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ from?: string; client?: string }>;
}) {
  const { locale } = await params;
  const { from, client } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("orders");

  const session = await requirePermission("orders.write", locale);

  // Only ask for what this person may see. `tolerate` deliberately rethrows a
  // 403, so requesting the translator list for someone whose plan withholds
  // it — every freelancer — took the whole page down.
  const canAssignTranslators = session.permissions.includes("translators.read");
  const canAssignNotaries = session.permissions.includes("notaries.read");

  // Each gates the "+" next to its field in the document builder — creating a
  // record is a stricter permission than assigning an existing one, so these
  // are checked independently rather than reusing the flags above.
  const canCreateClients = session.permissions.includes("clients.write");
  const canCreateTranslators = session.permissions.includes("translators.write");
  const canCreateNotaries = session.permissions.includes("notaries.write");
  const canManageDocumentTypes = session.permissions.includes("settings.manage");
  const canSeeCosts = session.permissions.includes("reports.profit");

  // Three independent reads, so they go in parallel rather than in series.
  //
  // Reference data is the only one the form cannot work without — it supplies
  // the language pairs, document types and rates. The assignment lists are
  // optional: an order can be created with every document unassigned, which is
  // the normal case when the work has not been handed out yet.
  const clientId = client && /^\d{1,10}$/.test(client) ? Number(client) : null;
  const [reference, translators, notaries, preselected] = await Promise.all([
    tolerate(getReference()),
    canAssignTranslators
      ? tolerate(listTranslators({ isActive: true, limit: 200, sort: "name" }))
      : null,
    canAssignNotaries ? tolerate(listNotaries({ limit: 200, sort: "name" })) : null,
    clientId ? tolerate(getClient(clientId)) : null,
  ]);

  if (reference.error) {
    return (
      <>
        <PageHeader
          {...sectionMark("translations")}
          title={t("newTitle")}
          actions={<BackLink href="/translations" label={t("backToOrders")} />}
        />
        <ApiUnavailable
          error={reference.error}
          what={t("referenceUnavailable")}
          endpoints={["GET /api/v1/reference"]}
        />
      </>
    );
  }

  // An organisation with no prices cannot quote, so the form would offer
  // empty language dropdowns and no reason why. Say what is missing and where
  // to fix it instead — this is exactly what a new signup hits first.
  const missing = [
    reference.data.language_pairs.length === 0 && t("missingPair"),
    reference.data.document_types.length === 0 && t("missingType"),
  ].filter(Boolean) as string[];

  if (missing.length > 0) {
    return (
      <>
        <PageHeader
          {...sectionMark("translations")}
          title={t("newTitle")}
          actions={<BackLink href="/translations" label={t("backToOrders")} />}
        />
        <Card className="border-status-warning/40 bg-status-warning/[0.06]">
          <CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <Tags className="text-status-warning size-8" aria-hidden />
            <p className="font-medium">{t("setPricesTitle")}</p>
            <p className="text-muted-foreground max-w-lg text-sm">
              {t("setPricesBody", { missing: missing.join(t("missingJoin")) })}
            </p>
            <Can permission="settings.manage">
              <Button variant="brand" size="sm" asChild>
                <Link href="/settings?tab=pricing">
                  <Settings /> {t("openPricing")}
                </Link>
              </Button>
            </Can>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        {...sectionMark("translations")}
        title={t("newTitle")}
        description={t("newDescription")}
        actions={<BackLink href="/translations" label={t("backToOrders")} />}
      />
      <OrderForm
        reference={reference.data}
        translators={(translators?.data?.items ?? []).map((person) => ({
          id: person.id,
          name: person.name,
          default_rate: person.default_rate ?? null,
          ...assigneeWork(person),
        }))}
        notaries={(notaries?.data?.items ?? []).map((n) => ({ id: n.id, name: n.name }))}
        canAssignTranslators={canAssignTranslators}
        canSeeCosts={canSeeCosts}
        claudeTranslate={session.claudeTranslate}
        fromQuote={from === "quote"}
        initialClient={
          preselected?.data
            ? {
                id: preselected.data.id,
                name: preselected.data.name,
                client_type: preselected.data.client_type,
              }
            : null
        }
        canCreateClients={canCreateClients}
        canCreateTranslators={canCreateTranslators}
        canCreateNotaries={canCreateNotaries}
        canManageDocumentTypes={canManageDocumentTypes}
      />
    </>
  );
}
