// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { FilePlus2, Mail, Pencil, Phone, Wallet } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getClient } from "@office/features/clients/api";
import { MonthlyInvoiceButton } from "@office/features/clients/components/monthly-invoice-button";
import { DeleteClientButton } from "@office/features/clients/components/delete-client-button";
import { getClientAccount, listPayments } from "@office/features/finances/api";
import { listOrders } from "@office/features/orders/api";
import { PaidIcon } from "@office/features/orders/components/paid-icon";
import { Link } from "@office/i18n/navigation";
import { requirePermission } from "@office/shared/auth/guards";
import { BackLink } from "@office/shared/components/back-link";
import { Can } from "@office/shared/components/can";
import { ActionError } from "@office/shared/components/data/action-error";
import { PageHeader } from "@office/shared/components/page-header";
import { ClientTypeBadge, StatusBadge } from "@office/shared/components/status-badge";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@office/shared/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@office/shared/components/ui/table";
import { TooltipProvider } from "@office/shared/components/ui/tooltip";
import { RowLink } from "@office/shared/components/data/row-link";
import { sectionMark } from "@office/shared/config/navigation";
import { ApiError } from "@office/shared/lib/api";
import { formatDate } from "@office/shared/lib/dates";
import { formatMoneyString } from "@office/shared/lib/money";
import { tolerate } from "@office/shared/lib/tolerate";
import { clientNumberOf, pageTitle } from "@office/shared/lib/page-title";
import { telHref } from "@office/shared/lib/phone";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Label/value row. Missing values render an em dash, never a blank gap. */
function Detail({
  label,
  value,
  href,
  mono,
}: {
  label: string;
  value: string | null;
  href?: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground text-xs font-medium">{label}</dt>
      <dd className={mono ? "font-mono text-sm" : "text-sm"}>
        {value ? (
          href ? (
            <a href={href} className="text-link hover:underline">
              {value}
            </a>
          ) : (
            value
          )
        ) : (
          <span className="text-muted-foreground">–</span>
        )}
      </dd>
    </div>
  );
}

const RECENT = 10;

export const generateMetadata = pageTitle("client", clientNumberOf, "clients");

/**
 * One client: who they are, what they owe, what they ordered and paid — the
 * PHP client card, where the office answers "how much does this person owe
 * us?" without a trip to Finances.
 */
export default async function ClientDetailPage({ params, searchParams }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : undefined;

  if (!/^\d{1,10}$/.test(id)) notFound();
  const clientId = Number(id);

  const session = await requirePermission("clients.read", locale);
  const canOrders = session.permissions.includes("orders.read");
  const canFinance = session.permissions.includes("finance.read");

  const t = await getTranslations("clients");
  const tf = await getTranslations("clients.form");
  const tm = await getTranslations("enums.paymentMethod");
  const tsrc = await getTranslations("enums.acquisitionSource");

  let client;
  try {
    client = await getClient(clientId);
  } catch (err) {
    // 404 covers both "no such client" and "another tenant's client" — the API
    // makes them indistinguishable on purpose, so this does too.
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const [orders, account, payments] = await Promise.all([
    canOrders ? tolerate(listOrders({ clientId, limit: RECENT, sort: "-id" })) : null,
    canFinance ? tolerate(getClientAccount(clientId)) : null,
    canFinance ? tolerate(listPayments({ clientId, limit: RECENT })) : null,
  ]);
  const date = (value: string | null) => formatDate(value, session.timezone);

  return (
    <TooltipProvider>
      <PageHeader
        {...sectionMark("clients")}
        title={client.name}
        actions={
          <>
            <BackLink href="/clients" label={t("backToClients")} />
            <Can permission="orders.write">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/translations/new?client=${client.id}`}>
                  <FilePlus2 /> {t("history.newOrder")}
                </Link>
              </Button>
            </Can>
            {client.client_type === "B2B" && canOrders && (
              <MonthlyInvoiceButton clientId={client.id} />
            )}
            <Can permission="clients.write">
              <Button variant="brand" size="sm" asChild>
                <Link href={`/clients/${client.id}/edit`}>
                  <Pencil /> {t("detail.edit")}
                </Link>
              </Button>
              <DeleteClientButton id={client.id} name={client.name} />
            </Can>
          </>
        }
      />

      {/* Set by deleteClientAction when the delete was refused. */}
      <ActionError message={error} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{t("detail.profile")}</CardTitle>
            <ClientTypeBadge clientType={client.client_type} />
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-2">
              <Detail label={tf("name")} value={client.name} />
              <Detail label={t("detail.clientId")} value={String(client.id)} mono />
              <Detail
                label={tf("email")}
                value={client.email}
                href={client.email ? `mailto:${client.email}` : undefined}
              />
              <Detail
                label={tf("phone")}
                value={client.phone}
                href={telHref(client.phone)}
              />
              <div className="sm:col-span-2">
                <Detail label={tf("address")} value={client.address} />
              </div>
              <Detail label={tf("idNumber")} value={client.personal_number_masked} mono />
              <Detail label={tf("source")} value={
                  client.acquisition_source && tsrc.has(client.acquisition_source)
                    ? tsrc(client.acquisition_source)
                    : client.acquisition_source
                } />
              {client.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground text-xs font-medium">{tf("notes")}</dt>
                  <dd className="mt-1 text-sm whitespace-pre-wrap">{client.notes}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {account?.data && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-base">{t("account.title")}</CardTitle>
                <Can permission="finance.record_payment">
                  <Button variant="brand" size="sm" asChild>
                    <Link href={`/finances/payments/new?client=${client.id}`}>
                      <Wallet /> {t("account.recordPayment")}
                    </Link>
                  </Button>
                </Can>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t("account.billed")}</dt>
                    <dd className="tabular-nums">{formatMoneyString(account.data.billed)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t("account.paid")}</dt>
                    <dd className="tabular-nums">{formatMoneyString(account.data.paid)}</dd>
                  </div>
                  <div className="border-border flex justify-between border-t pt-2 font-semibold">
                    <dt>{t("account.outstanding")}</dt>
                    <dd
                      className={
                        account.data.outstanding === "0.00"
                          ? "tabular-nums"
                          : "text-destructive tabular-nums"
                      }
                    >
                      {formatMoneyString(account.data.outstanding)}
                    </dd>
                  </div>
                  {account.data.unallocated_credit !== "0.00" && (
                    <div className="flex justify-between" title={t("account.creditHint")}>
                      <dt className="text-muted-foreground">{t("account.credit")}</dt>
                      <dd className="text-status-success tabular-nums">
                        {formatMoneyString(account.data.unallocated_credit)}
                      </dd>
                    </div>
                  )}
                </dl>
                <div className="text-muted-foreground border-border mt-3 space-y-1 border-t pt-3 text-xs">
                  <p>{t("account.orders", { count: account.data.orders })}</p>
                  {account.data.oldest_unpaid && (
                    <p>
                      {t("account.oldestUnpaid")}: {date(account.data.oldest_unpaid)}
                    </p>
                  )}
                  {account.data.last_payment_date && (
                    <p>
                      {t("account.lastPayment")}: {date(account.data.last_payment_date)}
                    </p>
                  )}
                  {account.data.outstanding === "0.00" && <p>{t("account.allPaid")}</p>}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("detail.contact")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {client.email ? (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={`mailto:${client.email}`}>
                    <Mail /> {t("detail.emailAction")}
                  </a>
                </Button>
              ) : (
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Mail /> {t("detail.noEmail")}
                </Button>
              )}
              {telHref(client.phone) ? (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={telHref(client.phone)}>
                    <Phone /> {t("detail.call")}
                  </a>
                </Button>
              ) : (
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Phone /> {t("detail.noPhone")}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {orders?.data && (
          <Card className="overflow-hidden py-0 lg:col-span-2">
            <div className="border-border flex items-center justify-between gap-3 border-b px-4 py-3">
              <h2 className="text-sm font-semibold">
                {t("history.title")}{" "}
                <span className="text-muted-foreground">({orders.data.meta.total})</span>
              </h2>
              {orders.data.meta.total > RECENT && (
                <Link
                  href={`/translations?client_id=${client.id}`}
                  className="text-link text-xs hover:underline"
                >
                  {t("history.viewAll")}
                </Link>
              )}
            </div>
            <CardContent className="p-0">
              {orders.data.items.length === 0 ? (
                <p className="text-muted-foreground px-4 py-8 text-center text-sm">
                  {t("history.none")}
                </p>
              ) : (
                <div className="custom_scroll">
                  <Table>
                    <TableBody>
                      {orders.data.items.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="w-16 tabular-nums">
                            <RowLink
                              href={`/translations/${order.id}`}
                              className="inline-flex min-h-6 min-w-6 items-center hover:text-link font-medium"
                            >
                              #{order.number}
                            </RowLink>
                          </TableCell>
                          <TableCell className="text-muted-foreground w-28 text-xs">
                            {date(order.order_date)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={order.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="inline-flex items-center gap-1.5 tabular-nums">
                              {formatMoneyString(order.total)}
                              <PaidIcon state={order.paid_state} />
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {payments?.data && (
          <Card className="overflow-hidden py-0">
            <div className="border-border border-b px-4 py-3">
              <h2 className="text-sm font-semibold">{t("payments.title")}</h2>
            </div>
            <CardContent className="p-0">
              {payments.data.items.length === 0 ? (
                <p className="text-muted-foreground px-4 py-8 text-center text-sm">
                  {t("payments.none")}
                </p>
              ) : (
                <Table>
                  <TableBody>
                    {payments.data.items.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="text-muted-foreground text-xs">
                          {date(payment.payment_date)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {tm.has(payment.method) ? tm(payment.method) : payment.method}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatMoneyString(payment.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
