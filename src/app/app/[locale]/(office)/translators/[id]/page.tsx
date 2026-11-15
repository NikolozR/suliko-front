// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { HandCoins, Mail, Pencil, Phone, UserPlus } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getTranslatorBalance, listTranslatorPayouts } from "@office/features/finances/api";
import { listOrders } from "@office/features/orders/api";
import { deleteTranslatorAction } from "@office/features/translators/actions";
import { getTranslator, listTranslatorInvites } from "@office/features/translators/api";
import { PairChip } from "@office/features/translators/components/translator-work";
import { groupPairs, reverseRate } from "@office/features/translators/pairs";
import { translatorWork } from "@office/features/directory/types";
import { Link } from "@office/i18n/navigation";
import { requirePermission } from "@office/shared/auth/guards";
import { BackLink } from "@office/shared/components/back-link";
import { Can } from "@office/shared/components/can";
import { ActionError } from "@office/shared/components/data/action-error";
import { Detail, DetailList } from "@office/shared/components/detail-list";
import { ConfirmDeleteButton } from "@office/shared/components/form/confirm-delete-button";
import { PageHeader } from "@office/shared/components/page-header";
import { StatusBadge } from "@office/shared/components/status-badge";
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

function Badge({ tone, children }: { tone: "good" | "muted"; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tone === "good" ? "bg-status-success text-white dark:text-neutral-950" : "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

const RECENT = 10;

export const generateMetadata = pageTitle("translator");

export default async function TranslatorDetailPage({ params, searchParams }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  // A plan without translators (every freelancer) gets a 403 from the API
  // here, which `getTranslator` does not tolerate. Redirect first instead of
  // crashing on someone who typed the address.
  const session = await requirePermission("translators.read", locale);

  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : undefined;

  if (!/^\d{1,10}$/.test(id)) notFound();
  const translatorId = Number(id);

  const t = await getTranslations("translators");
  const td = await getTranslations("directory");
  const tm = await getTranslations("enums.paymentMethod");

  let translator;
  try {
    translator = await getTranslator(translatorId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  // Money only for people who may see it; each block hides itself on failure.
  // The balance comes from the per-translator endpoint: the old lookup in the
  // top-200 "owed" list showed zero for anyone outside it.
  const canSeeMoney = session.permissions.includes("finance.read");
  const [balance, payouts, orders, invites] = await Promise.all([
    canSeeMoney ? tolerate(getTranslatorBalance(translatorId)) : null,
    canSeeMoney ? tolerate(listTranslatorPayouts({ translatorId, limit: RECENT })) : null,
    session.permissions.includes("orders.read")
      ? tolerate(listOrders({ translatorId, limit: RECENT, sort: "-id" }))
      : null,
    // New enough that an out-of-step API deploy must not take the whole
    // profile down over a status badge.
    tolerate(listTranslatorInvites()),
  ]);
  const sulikoInvite = invites.data?.find(
    (invite) => invite.translator_id === translatorId && invite.status !== "cancelled",
  );
  const date = (value: string | null) => formatDate(value, session.timezone);
  const work = translatorWork(translator);
  const pairs = groupPairs(work.pairs);
  const kinds = [
    work.written && t("written"),
    work.oral && t("oral"),
    work.canNotarize && t("canNotarize"),
  ].filter(Boolean);

  return (
    <>
      <PageHeader
        {...sectionMark("translators")}
        title={translator.name}
        description={translator.is_active ? t("activeTranslator") : t("inactiveDescription")}
        actions={
          <>
            <BackLink href="/translators" label={t("backToTranslators")} />
            {canSeeMoney && (
              <Can permission="finance.record_payment">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/finances/payouts/new?translator=${translator.id}`}>
                    <HandCoins /> {td("pay")}
                  </Link>
                </Button>
              </Can>
            )}
            <Can permission="translators.write">
              {!sulikoInvite && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/translators/invite?translator_id=${translator.id}`}>
                    <UserPlus /> {t("inviteToSuliko")}
                  </Link>
                </Button>
              )}
              <Button variant="brand" size="sm" asChild>
                <Link href={`/translators/${translator.id}/edit`}>
                  <Pencil /> {td("edit")}
                </Link>
              </Button>
              <ConfirmDeleteButton
                id={translator.id}
                name={translator.name}
                description={t("deleteDescription")}
                action={deleteTranslatorAction}
              />
            </Can>
          </>
        }
      />

      {/* Set by deleteTranslatorAction when the delete was refused. */}
      <ActionError message={error} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">{td("profile")}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge tone={translator.is_active ? "good" : "muted"}>
                {translator.is_active ? td("active") : td("inactive")}
              </Badge>
              <Badge tone={translator.has_portal_account ? "good" : "muted"}>
                {translator.has_portal_account ? t("portalAccount") : t("noPortalAccount")}
              </Badge>
              {sulikoInvite && (
                <Badge tone={sulikoInvite.status === "linked" ? "good" : "muted"}>
                  {sulikoInvite.status === "linked" ? t("sulikoLinked") : t("sulikoWaiting")}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <DetailList>
              <Detail label={t("fullName")} value={translator.name} />
              <Detail label={t("translatorId")} value={String(translator.id)} mono />
              <Detail
                label={td("email")}
                value={translator.email}
                href={translator.email ? `mailto:${translator.email}` : undefined}
              />
              <Detail
                label={td("phone")}
                value={translator.phone}
                href={telHref(translator.phone)}
              />
              <Detail
                label={td("officeAddress")}
                value={translator.office_address}
                className="sm:col-span-2"
              />
              <Detail
                label={t("since")}
                value={translator.experience_from ? date(translator.experience_from) : null}
              />
              <Detail
                label={t("defaultRate")}
                value={
                  translator.default_rate
                    ? t("perPage", { amount: formatMoneyString(translator.default_rate) })
                    : null
                }
              />
              <Detail label={t("portalUsername")} value={translator.portal_username} mono />
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground text-xs font-medium">{t("work")}</dt>
                <dd className="mt-1 text-sm">{kinds.join(" · ")}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground text-xs font-medium">{t("languages")}</dt>
                <dd className="mt-1.5 flex flex-wrap gap-2 text-sm">
                  {pairs.length === 0 ? (
                    <span className="text-muted-foreground">{t("noLanguages")}</span>
                  ) : (
                    pairs.map((p) => {
                      // A reverse with no rate of its own is paid at the other
                      // direction's rate.
                      const back = reverseRate(p);
                      const same = !p.reverse_rate_per_page || p.reverse_rate_per_page === p.rate_per_page;
                      return (
                        <span
                          key={`${p.source_language}-${p.target_language}`}
                          className="inline-flex flex-wrap items-center gap-1.5"
                        >
                          <PairChip
                            source={p.source_language}
                            target={p.target_language}
                            oneWay={p.one_way}
                          />
                          {p.rate_per_page && (
                            <span className="text-muted-foreground text-xs tabular-nums">
                              {p.one_way || same
                                ? t("perPage", { amount: formatMoneyString(p.rate_per_page) })
                                : `${p.source_language.toUpperCase()}→${p.target_language.toUpperCase()} ${t("perPage", { amount: formatMoneyString(p.rate_per_page) })}`}
                            </span>
                          )}
                          {!p.one_way && !same && back && (
                            <span className="text-muted-foreground text-xs tabular-nums">
                              {`${p.target_language.toUpperCase()}→${p.source_language.toUpperCase()} ${t("perPage", { amount: formatMoneyString(back) })}`}
                            </span>
                          )}
                        </span>
                      );
                    })
                  )}
                </dd>
              </div>
              {translator.comment && (
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground text-xs font-medium">{td("internalNotes")}</dt>
                  <dd className="mt-1 text-sm whitespace-pre-wrap">{translator.comment}</dd>
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
              {translator.email ? (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={`mailto:${translator.email}`}>
                    <Mail /> {td("emailAction")}
                  </a>
                </Button>
              ) : (
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Mail /> {td("noEmail")}
                </Button>
              )}
              {telHref(translator.phone) ? (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={telHref(translator.phone)}>
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
              <Badge tone={translator.bank_iban_masked ? "good" : "muted"}>
                {translator.bank_iban_masked ? td("bankReady") : td("noIban")}
              </Badge>
            </CardHeader>
            <CardContent>
              <DetailList className="sm:grid-cols-1">
                {/* Only the last four digits ever leave the API. */}
                <Detail label={td("iban")} value={translator.bank_iban_masked} mono />
                <Detail label={td("taxId")} value={translator.bank_inn} mono />
                <Detail label={td("bankCode")} value={translator.bank_code} mono />
              </DetailList>
            </CardContent>
          </Card>
        </div>
      </div>

      {balance && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">{t("balanceTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {balance.data ? (
              <DetailList columns={3}>
                <Detail label={td("earned")} value={formatMoneyString(balance.data.earned)} />
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
            <p className="text-muted-foreground mt-4 text-xs">{t("balanceNote")}</p>
          </CardContent>
        </Card>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {orders?.data && (
          <Card className="overflow-hidden py-0">
            <div className="border-border flex items-center justify-between gap-3 border-b px-4 py-3">
              <h2 className="text-sm font-semibold">
                {td("recentOrders")}{" "}
                <span className="text-muted-foreground">({orders.data.meta.total})</span>
              </h2>
              {orders.data.meta.total > RECENT && (
                <Link
                  href={`/translations?search=${encodeURIComponent(translator.name)}`}
                  className="text-link text-xs hover:underline"
                >
                  {td("allOrders")}
                </Link>
              )}
            </div>
            <CardContent className="p-0">
              {orders.data.items.length === 0 ? (
                <p className="text-muted-foreground px-4 py-8 text-center text-sm">{td("noOrders")}</p>
              ) : (
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
                        <TableCell className="text-sm">
                          <span className="clamp-name" title={order.client_name}>{order.client_name}</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {date(order.due_date)}
                        </TableCell>
                        <TableCell className="text-right">
                          <StatusBadge status={order.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {payouts?.data && (
          <Card className="overflow-hidden py-0">
            <div className="border-border border-b px-4 py-3">
              <h2 className="text-sm font-semibold">{td("payouts")}</h2>
            </div>
            <CardContent className="p-0">
              {payouts.data.length === 0 ? (
                <p className="text-muted-foreground px-4 py-8 text-center text-sm">{td("noPayouts")}</p>
              ) : (
                <Table>
                  <TableBody>
                    {payouts.data.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell className="text-muted-foreground w-28 text-xs">
                          {date(payout.payment_date)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {tm.has(payout.method) ? tm(payout.method) : payout.method}
                          {payout.notes && ` · ${payout.notes}`}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatMoneyString(payout.amount)}
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
    </>
  );
}
