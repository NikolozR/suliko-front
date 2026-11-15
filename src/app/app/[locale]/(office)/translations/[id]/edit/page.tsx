// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getReference } from "@office/features/calculator/api";
import { listNotaries } from "@office/features/notaries/api";
import { getOrder } from "@office/features/orders/api";
import { OrderForm } from "@office/features/orders/components/order-form";
import { listDocumentFiles } from "@office/features/orders/files";
import { listTranslators } from "@office/features/translators/api";
import { assigneeWork } from "@office/features/orders/types";
import { requirePermission } from "@office/shared/auth/guards";
import { ApiUnavailable } from "@office/shared/components/data/api-unavailable";
import { BackLink } from "@office/shared/components/back-link";
import { PageHeader } from "@office/shared/components/page-header";
import { sectionMark } from "@office/shared/config/navigation";
import { ApiError } from "@office/shared/lib/api";
import { tolerate } from "@office/shared/lib/tolerate";
import { orderNumberOf, pageTitle } from "@office/shared/lib/page-title";

export const generateMetadata = pageTitle("editOrder", orderNumberOf, "orders");

/**
 * Edit an order — its header and every document on it, on one page, saved
 * together. The same builder as "New order", given the stored order.
 */
export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await requirePermission("orders.write", locale);

  // Digits only: `Number("1e3")` is 1000 and `Number(" 7 ")` is 7.
  if (!/^\d{1,10}$/.test(id)) notFound();
  const orderId = Number(id);
  const t = await getTranslations("orders.edit");
  const to = await getTranslations("orders");

  const can = (permission: Parameters<typeof session.permissions.includes>[0]) =>
    session.permissions.includes(permission);
  const canAssignTranslators = can("translators.read");
  const canAssignNotaries = can("notaries.read");

  let order;
  try {
    order = await getOrder(orderId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const [reference, translators, notaries, files] = await Promise.all([
    tolerate(getReference()),
    canAssignTranslators
      ? tolerate(listTranslators({ isActive: true, limit: 200, sort: "name" }))
      : null,
    canAssignNotaries ? tolerate(listNotaries({ limit: 200, sort: "name" })) : null,
    // What each document already has attached, so its card shows it. The
    // form works without the list: it then says the files could not be read.
    tolerate(
      Promise.all(
        order.documents.map(
          async (doc) => [doc.id, await listDocumentFiles(order.id, doc.id)] as const,
        ),
      ),
    ),
  ]);

  const header = (
    <PageHeader
      {...sectionMark("translations")}
      title={t("title", { id: order.number })}
      description={t("description", {
        client: order.client_name,
        count: order.document_count,
      })}
      actions={<BackLink href={`/translations/${order.id}`} label={t("backToOrder")} />}
    />
  );

  if (reference.error) {
    return (
      <>
        {header}
        <ApiUnavailable
          error={reference.error}
          what={to("referenceUnavailable")}
          endpoints={["GET /api/v1/reference"]}
        />
      </>
    );
  }

  return (
    <>
      {header}
      <OrderForm
        order={order}
        existingFiles={files.error ? null : Object.fromEntries(files.data)}
        reference={reference.data}
        translators={(translators?.data?.items ?? []).map((person) => ({
          id: person.id,
          name: person.name,
          default_rate: person.default_rate ?? null,
          ...assigneeWork(person),
        }))}
        notaries={(notaries?.data?.items ?? []).map((n) => ({ id: n.id, name: n.name }))}
        canAssignTranslators={canAssignTranslators}
        canSeeCosts={can("reports.profit")}
        claudeTranslate={session.claudeTranslate}
        canCreateClients={can("clients.write")}
        canCreateTranslators={can("translators.write")}
        canCreateNotaries={can("notaries.write")}
        canManageDocumentTypes={can("settings.manage")}
      />
    </>
  );
}
