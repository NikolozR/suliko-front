// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { Mail, Pencil, Phone } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getNotaryBalance, listNotaryPayouts } from "@office/features/finances/api";
import { deleteNotaryAction } from "@office/features/notaries/actions";
import { getNotary } from "@office/features/notaries/api";
import { Link } from "@office/i18n/navigation";
import { requirePermission } from "@office/shared/auth/guards";
import { BackLink } from "@office/shared/components/back-link";
import { Can } from "@office/shared/components/can";
import { ActionError } from "@office/shared/components/data/action-error";
import { Detail, DetailList } from "@office/shared/components/detail-list";
import { ConfirmDeleteButton } from "@office/shared/components/form/confirm-delete-button";
import { PageHeader } from "@office/shared/components/page-header";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@office/shared/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@office/shared/components/ui/table";
import { RowLink } from "@office/shared/components/data/row-link";
import { sectionMark } from "@office/shared/config/navigation";
import { ApiError } from "@office/shared/lib/api";
import { formatDate } from "@office/shared/lib/dates";
import { formatMoneyString } from "@office/shared/lib/money";
import { tolerate } from "@office/shared/lib/tolerate";
import { cn } from "@office/shared/lib/utils";
import { pageTitle } from "@office/shared/lib/page-title";
import { telHref } from "@office/shared/lib/phone";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const RECENT = 10;

export const generateMetadata = pageTitle("notary");

export default async function NotaryDetailPage({ params, searchParams }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await requirePermission("notaries.read", locale);

  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : undefined;

  if (!/^\d{1,10}$/.test(id)) notFound();
  const notaryId = Number(id);

  const tn = await getTranslations("notaries");
  const td = await getTranslations("directory");
  const tm = await getTranslations("enums.paymentMethod");

  let notary;
  try {
    notary = await getNotary(notaryId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  // Money only for people who may see it, and never load-bearing. The balance
  // is this notary's own: the top-200 list it used to be looked up in showed
  // zero for anyone outside it.
  const canSeeMoney = session.permissions.includes("finance.read");
  const [balance, payouts] = await Promise.all([
    canSeeMoney ? tolerate(getNotaryBalance(notaryId)) : null,
    canSeeMoney ? tolerate(listNotaryPayouts({ notaryId, limit: RECENT })) : null,
  ]);
  const date = (value: string | null) => formatDate(value, session.timezone);

  return (
    <>
      <PageHeader
        {...sectionMark("notaries")}
        title={notary.name}
        description={
          notary.registration_number
            ? tn("registration", { number: notary.registration_number })
            : undefined
        }
        actions={
          <>
            <BackLink href="/notaries" label={tn("backToNotaries")} />
            <Can permission="notaries.write">
              <Button variant="brand" size="sm" asChild>
                <Link href={`/notaries/${notary.id}/edit`}>
                  <Pencil /> {td("edit")}
                </Link>
              </Button>
              <ConfirmDeleteButton
                id={notary.id}
                name={notary.name}
                description={tn("deleteDescription")}
                action={deleteNotaryAction}
              />
            </Can>
          </>
        }
      />

      {/* Set by deleteNotaryAction when the delete was refused. */}
      <ActionError message={error} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{td("identity")}</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailList>
              <Detail label={tn("notaryName")} value={notary.name} />
              <Detail label={tn("notaryId")} value={String(notary.id)} mono />
              <Detail
                label={td("email")}
                value={notary.email}
                href={notary.email ? `mailto:${notary.email}` : undefined}
              />
              <Detail
                label={td("phone")}
                value={notary.phone}
                href={telHref(notary.phone)}
              />
              <Detail label={tn("registrationNumber")} value={notary.registration_number} mono />
              <Detail label={td("officeAddress")} value={notary.office_address} />
              {notary.comment && (
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground text-xs font-medium">{td("internalNotes")}</dt>
                  <dd className="mt-1 text-sm whitespace-pre-wrap">{notary.comment}</dd>
                </div>
              )}
            </DetailList>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{td("contact")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {notary.email ? (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={`mailto:${notary.email}`}>
                    <Mail /> {td("emailAction")}
                  </a>
                </Button>
              ) : (
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Mail /> {td("noEmail")}
                </Button>
              )}
              {telHref(notary.phone) ? (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={telHref(notary.phone)}>
                    <Phone /> {td("call")}
                  </a>
                </Button>
              ) : (
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Phone /> {td("noPhone")}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{td("bankDetails")}</CardTitle>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  notary.bank_ready ? "bg-status-success text-white dark:text-neutral-950" : "bg-muted text-muted-foreground",
                )}
              >
                {notary.bank_ready ? td("bankReady") : td("noIban")}
              </span>
            </CardHeader>
            <CardContent>
              <DetailList className="sm:grid-cols-1">
                <Detail label={td("iban")} value={notary.bank_iban_masked} mono />
                <Detail label={td("taxId")} value={notary.bank_inn} mono />
                <Detail label={td("bankCode")} value={notary.bank_code} mono />
              </DetailList>
            </CardContent>
          </Card>
        </div>
      </div>

      {balance && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">{tn("feeBalance")}</CardTitle>
          </CardHeader>
          <CardContent>
            {balance.data ? (
              <DetailList columns={3}>
                <Detail label={tn("feesCharged")} value={formatMoneyString(balance.data.earned)} />
                <Detail label={td("paidOut")} value={formatMoneyString(balance.data.paid)} />
                <Detail label={td("outstanding")}>
                  <span
                    className={cn(
                      "text-base font-semibold tabular-nums",
                      Number(balance.data.outstanding) > 0 && "text-destructive",
                    )}
                  >
                    {formatMoneyString(balance.data.outstanding)}
                  </span>
                </Detail>
              </DetailList>
            ) : (
              <p className="text-muted-foreground text-sm">{td("balanceUnavailable")}</p>
            )}
            <p className="text-muted-foreground mt-4 text-xs">{tn("balanceNote")}</p>
          </CardContent>
        </Card>
      )}

      {payouts?.data && (
        <Card className="mt-4 overflow-hidden py-0">
          <div className="border-border border-b px-4 py-3">
            <h2 className="text-sm font-semibold">{td("payouts")}</h2>
          </div>
          <CardContent className="p-0">
            {payouts.data.length === 0 ? (
              <p className="text-muted-foreground px-4 py-8 text-center text-sm">{td("noPayouts")}</p>
            ) : (
              <Table>
                <TableBody>
                  {payouts.data.map((payout) => {
                    // id for the link, the bureau's number for the words.
                    const orders = [
                      ...new Map(
                        payout.allocations
                          .filter((a) => a.order_id !== null)
                          .map((a) => [a.order_id as number, a.order_number ?? null] as const),
                      ),
                    ];
                    return (
                      <TableRow key={payout.id}>
                        <TableCell className="text-muted-foreground w-28 text-xs">
                          {date(payout.payment_date)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {tm.has(payout.method) ? tm(payout.method) : payout.method}
                        </TableCell>
                        <TableCell className="text-xs">
                          {orders.map(([orderId, orderNumber], index) => (
                            <span key={orderId}>
                              {index > 0 && ", "}
                              <RowLink
                                href={`/translations/${orderId}`}
                                className="inline-flex min-h-6 min-w-6 items-center hover:text-link tabular-nums"
                              >
                                {orderNumber === null ? "#" : `#${orderNumber}`}
                              </RowLink>
                            </span>
                          ))}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatMoneyString(payout.amount)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
