"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Loader2, Wallet } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";

import {
  clientOrdersAction,
  recordPaymentAction,
  type FinanceFormState,
} from "@office/features/finances/actions";
import { PAYMENT_METHOD_VALUES } from "@office/features/finances/constants";
import { ClientPicker, type PickedClient } from "@office/features/orders/components/client-picker";
import type { OrderSummary } from "@office/features/orders/types";
import { Link } from "@office/i18n/navigation";
import {
  Field,
  FormAlert,
  SubmitButton,
  selectClass,
  useFocusOnError,
} from "@office/shared/components/form/fields";
import { UnsavedChangesGuard } from "@office/shared/components/form/unsaved-changes-guard";
import { useIdempotencyKey } from "@office/shared/components/form/form-dialog";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@office/shared/components/ui/card";
import { Input } from "@office/shared/components/ui/input";
import { RowLink } from "@office/shared/components/data/row-link";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@office/shared/components/ui/table";
import { formatDate } from "@office/shared/lib/dates";
import { CURRENCY_SYMBOL, formatMoneyString, parseTetri, tetriToString } from "@office/shared/lib/money";
import { cn } from "@office/shared/lib/utils";

/**
 * Record one client payment across several orders.
 *
 * This is the PHP app's `bulk_payments.php`. The shape it enforces is the
 * point: one payment row, N allocation rows. Nothing anywhere stores "amount
 * paid" on an order — it is always derived from allocations, which is what
 * makes a client settling six invoices with one transfer representable at all.
 *
 * ## Arithmetic in tetri
 *
 * Every total on this screen is summed as integer tetri and formatted back at
 * the end. Adding 0.1 and 0.2 as floats gives 0.30000000000000004, and on a
 * screen whose job is to say whether the allocations match the payment, that
 * is the difference between "balanced" and "over by a hundredth".
 */

const tetri = (value: string) => Math.max(0, parseTetri(value) ?? 0);
const money = (value: number) => formatMoneyString(tetriToString(value));

export function PaymentForm({
  today,
  initialClient = null,
}: {
  /** The bureau's today, for the date default. */
  today: string;
  /** Preselected — "Record payment" on a client's page. */
  initialClient?: PickedClient | null;
}) {
  const t = useTranslations("finances.form");
  const tc = useTranslations("common");
  const te = useTranslations("enums.paymentMethod");
  const locale = useLocale();
  const idempotencyKey = useIdempotencyKey();

  const [state, formAction] = useActionState<FinanceFormState, FormData>(
    recordPaymentAction,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  useFocusOnError(formRef, state);

  const echoed: PickedClient | null = state.values?.client_id
    ? {
        id: Number(state.values.client_id),
        name: state.values.client_id_label || `#${state.values.client_id}`,
        client_type: state.values.client_id_type === "B2B" ? "B2B" : "B2C",
      }
    : null;

  const [client, setClient] = useState<PickedClient | null>(initialClient);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoading, startLoading] = useTransition();

  const [amount, setAmount] = useState(state.values?.amount ?? "");
  /** Allocation per order id, as typed. */
  const [allocated, setAllocated] = useState<Record<number, string>>({});

  const errors = state.fieldErrors ?? {};
  const value = (field: string, fallback = "") => state.values?.[field] ?? fallback;

  // Reload the order list whenever the client changes, and drop any
  // allocations from the previous one — they belong to another account.
  useEffect(() => {
    setAllocated({});
    if (!client) {
      setOrders([]);
      return;
    }
    startLoading(async () => setOrders(await clientOrdersAction(client.id)));
  }, [client]);

  const outstandingOf = (order: OrderSummary) => Math.max(0, tetri(order.total) - tetri(order.paid));

  const allocatedTetri = Object.values(allocated).reduce((sum, v) => sum + tetri(v), 0);
  const amountTetri = tetri(amount);
  const remaining = amountTetri - allocatedTetri;
  const overAllocated = remaining < 0;

  /** What gets posted — only the rows with a real amount on them. */
  const allocationsJson = JSON.stringify(
    Object.entries(allocated)
      .filter(([, v]) => tetri(v) > 0)
      .map(([orderId, v]) => ({
        order_id: Number(orderId),
        amount_allocated: tetriToString(tetri(v)),
      })),
  );

  /**
   * Fill the oldest orders first until the payment runs out.
   *
   * This is what people actually do with a bank transfer that arrives with no
   * reference, and doing it by hand across eight orders is where the errors
   * come from.
   */
  function autoAllocate() {
    let left = amountTetri;
    const next: Record<number, string> = {};
    for (const order of [...orders].sort((a, b) => a.id - b.id)) {
      if (left <= 0) break;
      const owed = outstandingOf(order);
      if (owed <= 0) continue;
      const take = Math.min(owed, left);
      next[order.id] = tetriToString(take);
      left -= take;
    }
    setAllocated(next);
  }

  return (
    <form ref={formRef} action={formAction} noValidate>
      <UnsavedChangesGuard formRef={formRef} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="allocations" value={allocationsJson} />
      <input type="hidden" name="idempotency_key" value={idempotencyKey} />

      <FormAlert message={state.error} stepUp={state.stepUp} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("paymentTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field
                name="client_id"
                label={t("client")}
                errors={errors.client_id}
                className="sm:col-span-2"
              >
                {/* The picker owns the hidden input that the submit reads;
                    `onPick` is what keeps the order table below in step. */}
                <ClientPicker
                  initial={initialClient ?? echoed}
                  invalid={Boolean(errors.client_id?.length)}
                  onPick={setClient}
                />
              </Field>

              <Field
                name="amount"
                label={`${t("amountReceived")} (${CURRENCY_SYMBOL})`}
                errors={errors.amount}
              >
                <Input
                  id="amount"
                  name="amount"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0.00"
                  required
                  aria-invalid={Boolean(errors.amount?.length)}
                />
              </Field>

              <Field name="payment_date" label={t("paymentDate")} errors={errors.payment_date}>
                <Input
                  id="payment_date"
                  name="payment_date"
                  type="date"
                  defaultValue={value("payment_date", today)}
                  required
                />
              </Field>

              <Field name="method" label={t("method")} errors={errors.method}>
                <select
                  id="method"
                  name="method"
                  className={selectClass}
                  defaultValue={value("method", "bank_transfer")}
                >
                  {PAYMENT_METHOD_VALUES.map((method) => (
                    <option key={method} value={method}>
                      {te(method)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field name="notes" label={t("notes")} errors={errors.notes} hint={t("notesHint")}>
                <Input id="notes" name="notes" defaultValue={value("notes")} maxLength={255} />
              </Field>
            </CardContent>
          </Card>

          <Card className="overflow-hidden py-0">
            <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold">{t("allocateTitle")}</h2>
                <p className="text-muted-foreground text-xs">{t("allocateBody")}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={autoAllocate}
                disabled={orders.length === 0 || amountTetri <= 0}
              >
                {t("oldestFirst")}
              </Button>
            </div>

            <CardContent className="p-0">
              {errors.allocations?.map((message) => (
                <p key={message} role="alert" className="text-destructive px-4 py-3 text-xs">
                  {message}
                </p>
              ))}

              {isLoading ? (
                <p className="text-muted-foreground flex items-center justify-center gap-2 py-12 text-sm">
                  <Loader2 className="size-4 animate-spin" /> {t("loadingOrders")}
                </p>
              ) : !client ? (
                <p className="text-muted-foreground py-12 text-center text-sm">
                  {t("pickClientFirst")}
                </p>
              ) : orders.length === 0 ? (
                <p className="text-muted-foreground py-12 text-center text-sm">
                  {t("nothingOutstanding")}
                </p>
              ) : (
                <div className="custom_scroll">
                  <Table className="stack-mobile">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">{t("order")}</TableHead>
                        <TableHead className="w-28">{t("date")}</TableHead>
                        <TableHead className="w-28 text-right">{t("total")}</TableHead>
                        <TableHead className="w-28 text-right">{t("paid")}</TableHead>
                        <TableHead className="w-28 text-right">{t("outstanding")}</TableHead>
                        <TableHead className="w-36 text-right">{t("allocate")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell data-full className="tabular-nums">
                            <RowLink
                              href={`/translations/${order.id}`}
                              className="inline-flex min-h-6 min-w-6 items-center hover:text-link font-medium"
                            >
                              #{order.number}
                            </RowLink>
                          </TableCell>
                          <TableCell data-label={t("date")} className="text-muted-foreground text-xs">
                            {formatDate(order.order_date)}
                          </TableCell>
                          <TableCell data-label={t("total")} className="text-right tabular-nums">
                            {formatMoneyString(order.total)}
                          </TableCell>
                          <TableCell data-label={t("paid")} className="text-muted-foreground text-right tabular-nums">
                            {formatMoneyString(order.paid)}
                          </TableCell>
                          <TableCell data-label={t("outstanding")} className="text-right font-medium tabular-nums">
                            {money(outstandingOf(order))}
                          </TableCell>
                          <TableCell data-label={t("allocate")}>
                            <Input
                              aria-label={t("allocateAria", { id: order.number })}
                              inputMode="decimal"
                              placeholder="0.00"
                              value={allocated[order.id] ?? ""}
                              onChange={(event) =>
                                setAllocated((current) => ({
                                  ...current,
                                  [order.id]: event.target.value,
                                }))
                              }
                              className="h-8 text-right"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("summary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t("payment")}</dt>
                  <dd className="tabular-nums">{money(amountTetri)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t("allocated")}</dt>
                  <dd className="tabular-nums">{money(allocatedTetri)}</dd>
                </div>
                <div
                  className={cn(
                    "border-border flex justify-between border-t pt-2 font-semibold",
                    overAllocated && "text-destructive",
                  )}
                >
                  <dt>{overAllocated ? t("overBy") : t("unallocated")}</dt>
                  <dd className="tabular-nums">{money(Math.abs(remaining))}</dd>
                </div>
              </dl>

              {overAllocated && (
                <p role="alert" className="text-destructive text-xs">
                  {t("overAllocated")}
                </p>
              )}

              <p className="text-muted-foreground border-border border-t pt-3 text-xs">
                {t("unallocatedNote")}
              </p>
            </CardContent>
          </Card>

          <div className="mt-4 flex items-center gap-2">
            <SubmitButton label={t("recordPayment")} icon={<Wallet />} />
            <Button variant="ghost" asChild>
              <Link href="/finances?tab=payments">{tc("cancel")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
