// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import {
  AlertTriangle,
  CircleCheck,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  History,
  Languages,
  MapPin,
  MessageSquare,
  Paperclip,
  Pencil,
  ReceiptText,
} from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { getReference } from "@office/features/calculator/api";
import {
  listExpenses,
  listNotaryPayouts,
  listPayments,
  listTranslatorPayouts,
} from "@office/features/finances/api";
import { listNotaries } from "@office/features/notaries/api";
import { listComments } from "@office/features/notifications/api";
import { CommentThread } from "@office/features/notifications/components/comment-thread";
import { deleteDocumentAction, deleteOrderAction } from "@office/features/orders/actions";
import { getOrder } from "@office/features/orders/api";
import { AddDocumentDialog, EditDocumentDialog } from "@office/features/orders/components/document-dialog";
import { listClaudeJobsIfAvailable, type ClaudeJobList } from "@office/features/orders/claude";
import { ClaudeTranslationsPanel } from "@office/features/orders/components/claude-translations-panel";
import { DriveBar } from "@office/features/orders/components/drive-bar";
import { unitOfDocuments } from "@office/features/orders/pricing-unit";
import { OrderFiles } from "@office/features/orders/components/order-files";
import {
  OrderMoney,
  type MoneyRow,
  type OwedNotaryDocument,
  type OwedTranslator,
} from "@office/features/orders/components/order-money";
import { PaidIcon } from "@office/features/orders/components/paid-icon";
import { RememberOrder } from "@office/features/orders/components/remember-order";
import { StatusTimeline } from "@office/features/orders/components/status-timeline";
import type { OrderDetail, OrderDocument } from "@office/features/orders/types";
import { listTranslators } from "@office/features/translators/api";
import { getInvoiceReadiness } from "@office/features/settings/companies";
import type { InvoiceReadiness } from "@office/features/settings/company-types";
import { Link } from "@office/i18n/navigation";
import { requireSession } from "@office/shared/auth/guards";
import { sulikoSiteUrl } from "@office/shared/auth/sso";
import type { Permission } from "@office/shared/auth/permissions";
import { planAllows } from "@office/shared/auth/plans";
import { BackLink } from "@office/shared/components/back-link";
import { Can } from "@office/shared/components/can";
import { ActionError } from "@office/shared/components/data/action-error";
import { ConfirmDeleteButton } from "@office/shared/components/form/confirm-delete-button";
import { PageHeader } from "@office/shared/components/page-header";
import { ClientTypeBadge, StatusBadge } from "@office/shared/components/status-badge";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@office/shared/components/ui/card";
import { Skeleton } from "@office/shared/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@office/shared/components/ui/table";
import { TooltipProvider } from "@office/shared/components/ui/tooltip";
import { sectionMark } from "@office/shared/config/navigation";
import { ApiError } from "@office/shared/lib/api";
import { formatDate, formatDateTime, todayIn } from "@office/shared/lib/dates";
import { formatMoneyString, parseTetri, tetriToString } from "@office/shared/lib/money";
import { startEarly, timed } from "@office/shared/lib/timing";
import { tolerate, type Tolerated } from "@office/shared/lib/tolerate";
import { orderNumberOf, pageTitle } from "@office/shared/lib/page-title";

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground text-xs font-medium">{label}</dt>
      <dd className="text-sm">{value || <span className="text-muted-foreground">–</span>}</dd>
    </div>
  );
}

const tetri = (value: string | null | undefined) => parseTetri(value) ?? 0;

function documentTypeName(doc: OrderDocument, locale: string): string {
  // Interpreting has no document type.
  if (doc.service_type === "oral") return locale === "ka" ? "ზეპირი თარგმანი" : "Oral interpreting";
  return (
    (locale === "ka" ? doc.document_type_name_ka || doc.document_type_name : doc.document_type_name) ??
    `#${doc.document_type_id}`
  );
}

/** The four reads behind the payments card, in the order they are asked for. */
type MoneyReads = [
  Tolerated<Awaited<ReturnType<typeof listPayments>>>,
  Tolerated<Awaited<ReturnType<typeof listTranslatorPayouts>>>,
  Tolerated<Awaited<ReturnType<typeof listNotaryPayouts>>>,
  Tolerated<Awaited<ReturnType<typeof listExpenses>>>,
];

export const generateMetadata = pageTitle("order", orderNumberOf, "orders");

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const query = await searchParams;
  const actionError = typeof query.error === "string" ? query.error : undefined;

  // Digits only: `Number("1e3")` is 1000 and `Number(" 7 ")` is 7, both of
  // which used to open some other order than the URL named.
  if (!/^\d{1,10}$/.test(id)) notFound();
  const orderId = Number(id);

  const session = await requireSession(locale);
  const can = (permission: Permission) => session.permissions.includes(permission);
  // A freelancer's plan has no translators — they ARE the translator — so
  // the column would read "Unassigned" on every row forever.
  const showTranslators = can("translators.read");
  const canWrite = can("orders.write");
  const canFinance = can("finance.read");
  const canSeeCosts = can("reports.profit");
  const canManageDocumentTypes = can("settings.manage");
  const canCreateTranslators = can("translators.write");
  const canCreateNotaries = can("notaries.write");

  const t = await getTranslations("orders");
  const td = await getTranslations("orders.detail");
  const te = await getTranslations("enums");
  const tu = await getTranslations("units");
  const tInvoice = await getTranslations("invoice");

  // What the first screen is made of: the order, and what its documents are
  // edited against. Asked for together.
  const orderRequest = timed(`order ${orderId}: order`, getOrder(orderId));
  const editingRequest = startEarly(
    Promise.all([
      canWrite || can("orders.change_status")
        ? timed(`order ${orderId}: reference`, tolerate(getReference()))
        : null,
      canWrite && showTranslators
        ? timed(
            `order ${orderId}: translators`,
            tolerate(listTranslators({ isActive: true, limit: 200, sort: "name" })),
          )
        : null,
      canWrite && can("notaries.read")
        ? timed(`order ${orderId}: notaries`, tolerate(listNotaries({ limit: 200, sort: "name" })))
        : null,
    ]),
  );

  // What can arrive after it. Each is started now and awaited where it is
  // shown, behind its own <Suspense>, so the header, the timeline and the
  // details are on screen as soon as the order is read. The page used to
  // wait for the slowest of ten calls before showing anything but its
  // skeleton. Each block still hides itself rather than taking the order
  // down with it.
  //
  // Only an admin may read the invoice readiness. For anyone else the
  // Invoice button stays, and the invoice page explains a refusal.
  const invoiceReadiness = can("settings.manage")
    ? startEarly(timed(`order ${orderId}: invoice readiness`, tolerate(getInvoiceReadiness())))
    : null;
  // Only for an organisation a superadmin gave Claude Translate to.
  const claudeRequest = session.claudeTranslate
    ? startEarly(timed(`order ${orderId}: claude translations`, listClaudeJobsIfAvailable(orderId)))
    : null;
  const commentsRequest = startEarly(
    timed(`order ${orderId}: comments`, tolerate(listComments(orderId))),
  );
  const moneyRequest: Promise<MoneyReads> | null = canFinance
    ? startEarly(
        Promise.all([
          timed(`order ${orderId}: payments`, tolerate(listPayments({ orderId, limit: 100 }))),
          timed(
            `order ${orderId}: translator payouts`,
            tolerate(listTranslatorPayouts({ orderId, limit: 100 })),
          ),
          timed(
            `order ${orderId}: notary payouts`,
            tolerate(listNotaryPayouts({ orderId, limit: 100 })),
          ),
          timed(`order ${orderId}: expenses`, tolerate(listExpenses({ orderId, limit: 100 }))),
        ]),
      )
    : null;

  let order;
  try {
    order = await orderRequest;
  } catch (error) {
    // 404 covers "no such order" and "another tenant's order" alike — the API
    // makes them indistinguishable on purpose.
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const [reference, translators, notaries] = await editingRequest;

  const today = todayIn(session.timezone);
  const date = (value: string | null) => formatDate(value, session.timezone);
  const enumLabel = (group: string, value: string | null) =>
    value ? (te.has(`${group}.${value}`) ? te(`${group}.${value}`) : value) : null;

  const languages = reference?.data?.languages ?? [];
  const languageName = (code: string) => {
    const found = languages.find((l) => l.code === code);
    if (!found) return code.toUpperCase();
    return locale === "ka" ? found.name_ka || found.name_en : found.name_en;
  };
  const typeName = (doc: OrderDocument) => documentTypeName(doc, locale);

  const outstanding = tetriToString(Math.max(0, tetri(order.total) - tetri(order.paid)));
  // For the bar in the summary. Rounded down, so it is only full when paid in full.
  const paidShare =
    tetri(order.total) > 0
      ? Math.min(100, Math.floor((tetri(order.paid) / tetri(order.total)) * 100))
      : 0;
  const assignees = {
    translators: (translators?.data?.items ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      default_rate: p.default_rate,
    })),
    notaries: (notaries?.data?.items ?? []).map((p) => ({ id: p.id, name: p.name })),
  };
  // A document can only be edited against the reference it is priced from.
  const documentEditing = canWrite && reference?.data ? reference.data : null;
  // What the order is calculated by, read from its lines; the bureau's
  // default when it has no written line to tell from. Interpreting only: not
  // worth a row.
  const pricingUnit = unitOfDocuments(order.documents, reference?.data?.pricing_unit ?? "pages");
  const unitShown = order.documents.some((doc) => doc.service_type !== "oral");
  // A column of dashes is not worth its width: the notary only gets one
  // when a document is notarised or has a notary.
  const showNotary = order.documents.some((doc) => doc.is_notarized || doc.notary_name);

  return (
    <TooltipProvider>
      <PageHeader
        {...sectionMark("translations")}
        title={td("title", { id: order.number })}
        description={`${order.client_name} · ${date(order.order_date)}${order.identifier ? ` · ${order.identifier}` : ""}`}
        actions={
          <>
            <BackLink href="/translations" label={t("backToOrders")} />
            {/* A link until the readiness check says it cannot work yet. */}
            <Suspense fallback={<InvoiceLink orderId={order.id} label={td("invoice")} />}>
              <InvoiceAction
                orderId={order.id}
                label={td("invoice")}
                hint={tInvoice("notReadyHint")}
                readiness={invoiceReadiness}
              />
            </Suspense>
            <Can permission="orders.write">
              <Button variant="brand" size="sm" asChild>
                <Link href={`/translations/${order.id}/edit`}>
                  <Pencil /> {td("edit")}
                </Link>
              </Button>
            </Can>
            <Can permission="orders.delete">
              <ConfirmDeleteButton
                id={order.id}
                name={td("deleteName", { id: order.number })}
                description={td("deleteDescription")}
                action={deleteOrderAction}
              />
            </Can>
          </>
        }
      />

      <RememberOrder
        scope={session.tenantSlug ?? ""}
        id={order.id}
        number={order.number}
        clientName={order.client_name}
      />

      {/* Set by an action that redirected back here with a refusal. */}
      <ActionError message={actionError} />

      {/* How far along the order is. Read-only: the status is changed in
          the card on the right. */}
      <Card className="mb-4 py-4">
        <CardContent>
          <StatusTimeline
            status={order.status}
            orderId={order.id}
            orderNumber={order.number}
            canChange={can("orders.change_status")}
          />
        </CardContent>
      </Card>

      {/* On a laptop: the details, with the documents, files and notes under
          them, beside one panel for the order's status and its money. In a
          single column (a phone) the panel comes right after the details,
          not after the notes at the very end. The second row is the one
          that stretches, so a panel taller than the details never opens a
          gap under them. */}
      <div className="grid gap-4 lg:grid-cols-3 lg:grid-rows-[auto_1fr] lg:items-start">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle icon={ClipboardList} className="text-base">
                {td("details")}
              </CardTitle>
              {/* Solid: here the status is this order's, now. Everywhere a
                  status is one of many (lists, the history below) it is soft. */}
              <StatusBadge status={order.status} variant="solid" />
            </CardHeader>
            <CardContent>
              <dl className="grid gap-5 sm:grid-cols-3">
                {/* The whole row: in a third of the card a long company name
                    ran nine lines deep. Two lines at most here, the rest
                    behind an ellipsis and in the title. */}
                <div className="col-span-full space-y-1">
                  <dt className="text-muted-foreground text-xs font-medium">{t("client")}</dt>
                  <dd className="flex items-start gap-2 text-sm">
                    <Link
                      href={`/clients/${order.client_id}`}
                      title={order.client_name}
                      className="text-link clamp-name max-w-none hover:underline"
                    >
                      {order.client_name}
                    </Link>
                    <ClientTypeBadge clientType={order.client_type} className="shrink-0" />
                  </dd>
                </div>
                <Detail label={t("orderDate")} value={date(order.order_date)} />
                <div className="space-y-1">
                  <dt className="text-muted-foreground text-xs font-medium">{t("dueDate")}</dt>
                  <dd className="flex items-center gap-1.5 text-sm">
                    {order.due_date ? date(order.due_date) : <span className="text-muted-foreground">–</span>}
                    {order.is_overdue && (
                      <span className="text-destructive inline-flex items-center gap-1 text-xs font-medium">
                        <AlertTriangle className="size-3" aria-hidden /> {td("overdue")}
                      </span>
                    )}
                  </dd>
                </div>
                <Detail label={t("contact")} value={order.contact_info} />
                {unitShown && (
                  <Detail label={t("pricingUnit.detail")} value={t(`pricingUnit.${pricingUnit}`)} />
                )}
                <Detail label={td("handover")} value={enumLabel("handover", order.handover_method)} />
                {order.delivery_address && (
                  <div className="sm:col-span-3">
                    <Detail label={t("deliveryAddress")} value={order.delivery_address} />
                  </div>
                )}
                {order.notes && (
                  <div className="sm:col-span-3">
                    <dt className="text-muted-foreground text-xs font-medium">{td("notes")}</dt>
                    <dd className="mt-1 text-sm whitespace-pre-wrap">{order.notes}</dd>
                  </div>
                )}
                {session.claudeTranslate && order.translation_instructions && (
                  <div className="sm:col-span-3">
                    <dt className="text-muted-foreground text-xs font-medium">
                      {td("translationInstructions")}
                    </dt>
                    <dd className="mt-1 text-sm whitespace-pre-wrap">
                      {order.translation_instructions}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:col-start-3 lg:row-span-2 lg:row-start-1">
          {/* The order's status and its money, in one place: what the PHP
              screen spread over nine cards down its right edge, and what
              this page had in three cards on two sides. `payments` is the
              anchor the finance screens link to. */}
          <Card id="payments" className="scroll-mt-20">
            <CardHeader>
              <CardTitle icon={ReceiptText} className="text-base">
                {td("summary")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">

              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{td("documentsTotal")}</dt>
                  <dd className="tabular-nums">{formatMoneyString(order.documents_total)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{td("courierFee")}</dt>
                  <dd className="tabular-nums">{formatMoneyString(order.delivery_cost)}</dd>
                </div>
                <div className="border-border flex justify-between border-t pt-2 font-semibold">
                  <dt>{td("total")}</dt>
                  <dd className="flex items-center gap-1.5 tabular-nums">
                    {formatMoneyString(order.total)}
                    <PaidIcon state={order.paid_state} />
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{td("paid")}</dt>
                  <dd className="tabular-nums">{formatMoneyString(order.paid)}</dd>
                </div>
                {/* How much of the total is in, then the one line that asks
                    for something: what is still due, or that nothing is. The
                    balance was a red figure among five grey ones. */}
                {tetri(order.total) > 0 && (
                  <>
                    <div aria-hidden className="bg-muted h-1.5 overflow-hidden rounded-full">
                      <div
                        className="bg-hue-green-ink h-full rounded-full"
                        style={{ width: `${paidShare}%` }}
                      />
                    </div>
                    {tetri(outstanding) > 0 ? (
                      <div className="bg-hue-red-tint text-hue-red-ink -mx-3 flex justify-between rounded-md px-3 py-2 font-semibold">
                        <dt>{td("balance")}</dt>
                        <dd className="tabular-nums">{formatMoneyString(outstanding)}</dd>
                      </div>
                    ) : (
                      <div className="bg-hue-green-tint text-hue-green-ink -mx-3 rounded-md px-3 py-2 font-medium">
                        <dt className="sr-only">{td("balance")}</dt>
                        <dd className="flex items-center gap-1.5">
                          <CircleCheck className="size-4 shrink-0" aria-hidden />
                          {te("paidState.paid")}
                        </dd>
                      </div>
                    )}
                  </>
                )}

              </dl>

              {/* What was paid in and out, with the buttons that record it.
                  Read after the page is on screen, so it streams in here. */}
              {moneyRequest && (
                <Suspense fallback={<MoneySkeleton />}>
                  <OrderMoneySection
                    order={order}
                    locale={locale}
                    today={today}
                    outstanding={outstanding}
                    requests={moneyRequest}
                    can={{
                      record: can("finance.record_payment"),
                      refund: can("finance.refund"),
                      expenses: can("finance.expenses"),
                    }}
                  />
                </Suspense>
              )}

              {/* Null for anyone without `reports.profit`: the API strips them. */}
              {order.profit !== null && (
                <dl className="border-border text-muted-foreground space-y-2 border-t pt-4 text-xs">
                  {showTranslators && (
                    <div className="flex justify-between">
                      <dt>{t("translatorCost")}</dt>
                      <dd className="tabular-nums">{formatMoneyString(order.translator_total)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt>{t("notaryCost")}</dt>
                    <dd className="tabular-nums">{formatMoneyString(order.notary_total)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>{td("expenses")}</dt>
                    <dd className="tabular-nums">{formatMoneyString(order.expenses_total)}</dd>
                  </div>
                  <div className="text-foreground flex justify-between text-sm font-medium">
                    <dt>{td("profit")}</dt>
                    <dd className="tabular-nums">{formatMoneyString(order.profit)}</dd>
                  </div>
                </dl>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle icon={History} className="text-base">
                {td("statusHistory")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.status_history.length === 0 ? (
                <p className="text-muted-foreground text-sm">{td("noHistory")}</p>
              ) : (
                <ol className="space-y-3">
                  {order.status_history.map((event, index) => (
                    <li key={`${event.changed_at}-${index}`} className="flex gap-3 text-sm">
                      <div className="flex flex-col items-center">
                        <span
                          className={
                            index === 0
                              ? "bg-suliko-default-color mt-1.5 size-2 rounded-full"
                              : "bg-muted-foreground/40 mt-1.5 size-2 rounded-full"
                          }
                        />
                        {index < order.status_history.length - 1 && (
                          <span className="bg-border mt-1 w-px flex-1" />
                        )}
                      </div>
                      <div className="pb-1">
                        <StatusBadge status={event.status} />
                        <p className="text-muted-foreground mt-1 text-xs">
                          {formatDateTime(event.changed_at, session.timezone)}
                          {event.changed_by_name &&
                            ` · ${td("changedBy", { name: event.changed_by_name })}`}
                        </p>
                        {event.note && <p className="mt-1 text-xs">{event.note}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card className="overflow-hidden py-0">
            {/* Wraps: side by side, the title and Add document are wider
                than a phone, and widened this whole column with them. */}
            <div className="border-border flex flex-wrap items-center justify-between gap-2 border-b px-6 py-4">
              <CardTitle icon={FileText} className="text-base">
                {t("documents")}
                <span className="text-muted-foreground font-normal">({order.documents.length})</span>
              </CardTitle>
              {documentEditing && (
                <AddDocumentDialog
                  orderId={order.id}
                  orderDate={order.order_date}
                  reference={documentEditing}
                  pricingUnit={pricingUnit}
                  translators={assignees.translators}
                  notaries={assignees.notaries}
                  canAssignTranslators={showTranslators}
                  canSeeCosts={canSeeCosts}
                  canManageDocumentTypes={canManageDocumentTypes}
                  canCreateTranslators={canCreateTranslators}
                  canCreateNotaries={canCreateNotaries}
                />
              )}
            </div>
            <CardContent className="p-0">
              <div className="custom_scroll">
                <Table className="stack-mobile">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-44">{td("type")}</TableHead>
                      {/* The short label the orders list uses: the full
                          word was wider than any number under it. */}
                      <TableHead className="w-12 text-right" title={t("pages")}>
                        <span aria-hidden>{t("list.pagesCol")}</span>
                        <span className="sr-only">{t("pages")}</span>
                      </TableHead>
                      <TableHead className="w-36">{td("copy")}</TableHead>
                      {showTranslators && <TableHead className="w-36">{t("translator")}</TableHead>}
                      {showNotary && <TableHead className="w-36">{t("notary")}</TableHead>}
                      <TableHead className="w-28 text-right">{td("priceCol")}</TableHead>
                      {documentEditing && <TableHead className="w-20" />}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.documents.map((doc) => (
                      <TableRow key={doc.id}>
                        {/* The languages under the type, not in a column of
                            their own: with one the price was cut off at the
                            card's edge on a laptop. */}
                        <TableCell data-full className="whitespace-normal">
                          <span className="block font-medium">{typeName(doc)}</span>
                          <span className="text-muted-foreground mt-0.5 block text-xs">
                            <span className="sr-only">{td("languages")}: </span>
                            {languageName(doc.source_language)} → {languageName(doc.target_language)}
                          </span>
                          {/* Interpreting: where and when, when the line says. */}
                          {doc.service_type === "oral" &&
                            (doc.interpreting_place || doc.interpreting_date) && (
                              <span className="text-muted-foreground mt-0.5 flex items-start gap-1 text-xs">
                                <MapPin className="mt-px size-3 shrink-0" aria-hidden />
                                <span>
                                  {[
                                    doc.interpreting_place,
                                    doc.interpreting_date
                                      ? [
                                          date(doc.interpreting_date),
                                          doc.interpreting_time?.slice(0, 5),
                                        ]
                                          .filter(Boolean)
                                          .join(" ")
                                      : null,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </span>
                              </span>
                            )}
                        </TableCell>
                        <TableCell data-label={t("pages")} className="text-right tabular-nums">
                          {doc.page_count}
                          {doc.character_count ? (
                            <span className="text-muted-foreground block text-xs">
                              {doc.character_count.toLocaleString("en-US").replace(/,/g, " ")}{" "}
                              {locale === "ka" ? "სიმბ." : "chars"}
                            </span>
                          ) : null}
                          {doc.service_type === "oral" && (
                            <span className="text-muted-foreground block text-xs">
                              {locale === "ka" ? "წთ" : "min"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell data-label={td("copy")} className="text-xs">
                          {doc.service_type === "oral" ? "–" : enumLabel("copyType", doc.copy_type)}
                          {doc.is_notarized && (
                            <span className="text-status-warning ml-1" title={t("notarised")}>
                              •
                            </span>
                          )}
                        </TableCell>
                        {showTranslators && (
                          <TableCell data-label={t("translator")} className="text-sm whitespace-normal">
                            {doc.translator_name ?? (
                              <span className="text-muted-foreground">{t("unassigned")}</span>
                            )}
                            {canSeeCosts && doc.translator_cost !== null && doc.translator_id && (
                              <span className="text-muted-foreground block text-xs tabular-nums">
                                {formatMoneyString(doc.translator_cost)}
                              </span>
                            )}
                          </TableCell>
                        )}
                        {showNotary && (
                          <TableCell data-label={t("notary")} className="text-sm whitespace-normal">
                            {doc.notary_name ?? <span className="text-muted-foreground">–</span>}
                            {canSeeCosts && doc.is_notarized && doc.notary_cost !== null && (
                              <span className="text-muted-foreground block text-xs tabular-nums">
                                {formatMoneyString(doc.notary_cost)}
                              </span>
                            )}
                          </TableCell>
                        )}
                        <TableCell data-label={td("priceCol")} className="text-right tabular-nums">
                          {formatMoneyString(doc.price)}
                        </TableCell>
                        {documentEditing && (
                          <TableCell data-full>
                            <div className="flex justify-end gap-1">
                              <EditDocumentDialog
                                orderId={order.id}
                                orderDate={order.order_date}
                                document={doc}
                                reference={documentEditing}
                                pricingUnit={pricingUnit}
                                translators={assignees.translators}
                                notaries={assignees.notaries}
                                canAssignTranslators={showTranslators}
                                canSeeCosts={canSeeCosts}
                                canManageDocumentTypes={canManageDocumentTypes}
                                canCreateTranslators={canCreateTranslators}
                                canCreateNotaries={canCreateNotaries}
                              />
                              {order.documents.length > 1 && (
                                <ConfirmDeleteButton
                                  compact
                                  id={doc.id}
                                  name={td("documentName", { id: doc.id })}
                                  description={td("removeDocumentConfirm")}
                                  action={deleteDocumentAction}
                                  fields={{ order_id: String(order.id) }}
                                />
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card id="files" className="scroll-mt-20 overflow-hidden pb-0">
            <CardHeader>
              <CardTitle icon={Paperclip} className="text-base">
                {td("files")}
              </CardTitle>
              <p className="text-muted-foreground text-xs">{td("filesHint")}</p>
              {order.drive_connected && (
                <DriveBar
                  orderId={order.id}
                  folderUrl={order.drive_folder_url}
                  canWrite={canWrite}
                />
              )}
            </CardHeader>
            <CardContent className="p-0">
              {order.documents.length === 0 ? (
                <p className="text-muted-foreground px-6 pb-6 text-sm">{td("noDocuments")}</p>
              ) : (
                <OrderFiles
                  orderId={order.id}
                  clientId={order.client_id}
                  documents={order.documents.map((doc, index) => ({
                    id: doc.id,
                    // Numbered when there are several: an order of four
                    // passports in one language pair has four identical names
                    // otherwise, and which file is for which matters.
                    label: `${order.documents.length > 1 ? `#${index + 1} ` : ""}${typeName(doc)} · ${languageName(doc.source_language)} → ${languageName(doc.target_language)}`,
                    detail:
                      doc.service_type === "oral"
                        ? undefined
                        : [
                            tu("pages", { count: doc.page_count }),
                            enumLabel("copyType", doc.copy_type),
                            doc.is_notarized ? t("notarised") : null,
                          ]
                            .filter(Boolean)
                            .join(" · "),
                  }))}
                  canWrite={canWrite}
                  topUpUrl={`${sulikoSiteUrl()}/${locale}/price`}
                />
              )}
            </CardContent>
          </Card>

          {claudeRequest && order.documents.length > 0 && (
            <Suspense fallback={null}>
              <ClaudeTranslations
                orderId={order.id}
                request={claudeRequest}
                title={td("claudeTranslations")}
                canWrite={canWrite}
                timezone={session.timezone}
                documents={order.documents.map((doc, index) => ({
                  id: doc.id,
                  label: `${order.documents.length > 1 ? `#${index + 1} ` : ""}${typeName(doc)} · ${languageName(doc.source_language)} → ${languageName(doc.target_language)}`,
                }))}
              />
            </Suspense>
          )}

          {/* The anchor is here from the start, so a link to #comments (from a
              notification) lands even though the thread streams in after. */}
          <div id="comments" className="scroll-mt-20 empty:hidden">
            <Suspense fallback={<SectionSkeleton />}>
              <OrderComments
                orderId={order.id}
                request={commentsRequest}
                title={td("comments")}
                currentUserId={session.userId}
                canModerate={can("orders.delete")}
                canMention={planAllows(session.plan, "notifications")}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

/** A card's worth of grey, where a block that is still being read will be. */
function SectionSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

/** The money lines of the summary panel, while they are still being read. */
function MoneySkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

function InvoiceLink({ orderId, label }: { orderId: number; label: string }) {
  return (
    <Button variant="outline" size="sm" asChild>
      <Link href={`/translations/${orderId}/invoice`}>
        <FileSpreadsheet /> {label}
      </Link>
    </Button>
  );
}

/**
 * The Invoice button. When the company's legal details are missing the invoice
 * cannot be made, and the button says so itself: an amber warning sign, the
 * reason as its description, and a tap goes to where it is fixed (Settings,
 * Companies) instead of to a page that refuses (audit F22). The same warning
 * used to sit above every order until the company was set up; it is on the
 * dashboard now, once.
 */
async function InvoiceAction({
  orderId,
  label,
  hint,
  readiness,
}: {
  orderId: number;
  label: string;
  hint: string;
  readiness: Promise<Tolerated<InvoiceReadiness>> | null;
}) {
  if ((await readiness)?.data?.ok !== false) return <InvoiceLink orderId={orderId} label={label} />;
  return (
    <>
      <Button variant="outline" size="sm" asChild>
        <Link href="/settings?tab=companies" title={hint} aria-describedby="invoice-blocked">
          <AlertTriangle className="text-hue-amber-ink" /> {label}
        </Link>
      </Button>
      <span id="invoice-blocked" className="sr-only">
        {hint}
      </span>
    </>
  );
}

/** Claude Translate: the order's jobs. Nothing at all when they could not be read. */
async function ClaudeTranslations({
  orderId,
  request,
  title,
  canWrite,
  timezone,
  documents,
}: {
  orderId: number;
  request: Promise<ClaudeJobList | null>;
  title: string;
  canWrite: boolean;
  timezone: string;
  documents: { id: number; label: string }[];
}) {
  const jobs = await request;
  if (!jobs) return null;
  return (
    <Card id="claude-translate" className="scroll-mt-20 overflow-hidden pb-0">
      <CardHeader>
        <CardTitle icon={Languages} className="text-base">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ClaudeTranslationsPanel
          orderId={orderId}
          documents={documents}
          canWrite={canWrite}
          initial={jobs}
          timezone={timezone}
        />
      </CardContent>
    </Card>
  );
}

/** The comment thread. Nothing at all when it could not be read. */
async function OrderComments({
  orderId,
  request,
  title,
  currentUserId,
  canModerate,
  canMention,
}: {
  orderId: number;
  request: Promise<Tolerated<Awaited<ReturnType<typeof listComments>>>>;
  title: string;
  currentUserId: number;
  canModerate: boolean;
  canMention: boolean;
}) {
  const comments = await request;
  if (!comments.data) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle icon={MessageSquare} className="text-base">
          {title}
          <span className="text-muted-foreground font-normal">({comments.data.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CommentThread
          orderId={orderId}
          comments={comments.data}
          currentUserId={currentUserId}
          canModerate={canModerate}
          canMention={canMention}
        />
      </CardContent>
    </Card>
  );
}

/** The payments card: what was paid in and out on this order, and what is owed. */
async function OrderMoneySection({
  order,
  locale,
  today,
  outstanding,
  requests,
  can,
}: {
  order: OrderDetail;
  locale: string;
  today: string;
  outstanding: string;
  requests: Promise<MoneyReads>;
  can: { record: boolean; refund: boolean; expenses: boolean };
}) {
  const orderId = order.id;
  const typeName = (doc: OrderDocument) => documentTypeName(doc, locale);
  const [payments, translatorPayouts, notaryPayouts, expenses] = await requests;

  // ── Money, shaped for the card ────────────────────────────────────────────
  const hereOf = (allocations: { order_id: number | null; amount_allocated: string }[]) =>
    tetriToString(
      allocations
        .filter((a) => a.order_id === orderId)
        .reduce((sum, a) => sum + tetri(a.amount_allocated), 0),
    );

  const paymentRows: MoneyRow[] = (payments?.data?.items ?? []).map((p) => ({
    id: p.id,
    date: p.payment_date,
    method: p.method,
    amount: p.amount,
    here: hereOf(p.allocations),
    notes: p.notes,
  }));
  const translatorPayoutRows: MoneyRow[] = (translatorPayouts?.data ?? []).map((p) => ({
    id: p.id,
    date: p.payment_date,
    method: p.method,
    amount: p.amount,
    here: hereOf(p.allocations),
    who: p.translator_name,
    notes: p.notes,
  }));
  const notaryPayoutRows: MoneyRow[] = (notaryPayouts?.data ?? []).map((p) => {
    const mine = p.allocations.filter((a) => a.order_id === orderId);
    return {
      id: p.id,
      date: p.payment_date,
      method: p.method,
      amount: p.amount,
      here: hereOf(mine),
      who: [...new Set(mine.map((a) => a.notary_name).filter(Boolean))].join(", ") || null,
      notes: p.notes,
      viaTranslatorPaymentId: p.paid_via_translator_payment_id,
    };
  });

  // What is still owed on this order, per translator and per notarised
  // document — pre-fills the payout dialogs. Null when costs are hidden.
  const owedTranslators: OwedTranslator[] = [];
  for (const doc of order.documents) {
    if (!doc.translator_id || owedTranslators.some((p) => p.id === doc.translator_id)) continue;
    const theirs = order.documents.filter((d) => d.translator_id === doc.translator_id);
    const costs = theirs.map((d) => d.translator_cost);
    const paid = (translatorPayouts?.data ?? [])
      .filter((p) => p.translator_id === doc.translator_id)
      .reduce((sum, p) => sum + tetri(hereOf(p.allocations)), 0);
    owedTranslators.push({
      id: doc.translator_id,
      name: doc.translator_name ?? `#${doc.translator_id}`,
      owed: costs.some((c) => c === null)
        ? null
        : tetriToString(Math.max(0, costs.reduce((s, c) => s + tetri(c), 0) - paid)),
    });
  }
  const notaryDocuments: OwedNotaryDocument[] = order.documents
    .filter((d) => d.is_notarized)
    .map((d) => {
      const paid = (notaryPayouts?.data ?? [])
        .flatMap((p) => p.allocations)
        .filter((a) => a.order_document_id === d.id)
        .reduce((sum, a) => sum + tetri(a.amount_allocated), 0);
      return {
        documentId: d.id,
        label: `${typeName(d)} · ${d.source_language.toUpperCase()}→${d.target_language.toUpperCase()}`,
        notaryId: d.notary_id,
        notaryName: d.notary_name,
        owed: d.notary_cost === null ? null : tetriToString(Math.max(0, tetri(d.notary_cost) - paid)),
      };
    });

  return (
    <OrderMoney
      orderId={order.id}
      clientId={order.client_id}
      clientName={order.client_name}
      today={today}
      outstanding={outstanding}
      payments={paymentRows}
      translatorPayouts={translatorPayoutRows}
      notaryPayouts={notaryPayoutRows}
      expenses={(expenses.data?.items ?? []).map((e) => ({
        id: e.id,
        date: e.expense_date,
        category: e.category,
        description: e.description,
        amount: e.amount,
      }))}
      translators={owedTranslators}
      notaryDocuments={notaryDocuments}
      can={can}
    />
  );
}
