"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { CircleCheck, HandCoins, Info, Receipt, Stamp, Wallet } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";

import {
  createExpenseAction,
  deleteExpenseAction,
  deleteNotaryPayoutAction,
  deletePaymentAction,
  deleteTranslatorPayoutAction,
  payNotaryAction,
  payTranslatorAction,
  recordPaymentAction,
  type FinanceFormState,
} from "@office/features/finances/actions";
import { ExpenseFields } from "@office/features/finances/components/expense-form";
import { PAYMENT_METHOD_VALUES } from "@office/features/finances/constants";
import { ConfirmDeleteButton } from "@office/shared/components/form/confirm-delete-button";
import { Field, selectClass } from "@office/shared/components/form/fields";
import { FormDialog, useIdempotencyKey } from "@office/shared/components/form/form-dialog";
import { Button } from "@office/shared/components/ui/button";
import { Input } from "@office/shared/components/ui/input";
import { formatDate } from "@office/shared/lib/dates";
import { CURRENCY_SYMBOL, formatMoneyString, parseTetri, tetriToString } from "@office/shared/lib/money";
import { useTimezone } from "@office/shared/components/timezone-context";
import { cn } from "@office/shared/lib/utils";

/**
 * The order screen's money: what the client paid towards it, what was paid
 * out for it, and what it cost — with the buttons to record each, right where
 * the numbers are. In the PHP app this was the bottom half of
 * `view_translation.php`, and it is where most payments were recorded.
 *
 * It is the lower half of the order's summary panel, under the total and the
 * balance, not a card of its own: money is read and recorded in one place.
 *
 * Amounts owed are worked out on the server (from the documents and the
 * payouts already allocated to this order) and only pre-fill the forms; the
 * API re-checks every allocation.
 */

export interface MoneyRow {
  id: number;
  date: string;
  method: string;
  /** The whole payment or payout. */
  amount: string;
  /** How much of it went to this order. */
  here: string;
  /** Who: the translator or notaries paid. */
  who?: string | null;
  notes?: string | null;
  viaTranslatorPaymentId?: number | null;
}

export interface ExpenseRow {
  id: number;
  date: string;
  category: string;
  description: string;
  amount: string;
}

export interface OwedTranslator {
  id: number;
  name: string;
  /** Still owed for this order; null when costs are hidden from this user. */
  owed: string | null;
}

export interface OwedNotaryDocument {
  documentId: number;
  label: string;
  notaryId: number | null;
  notaryName: string | null;
  owed: string | null;
}

const tetri = (value: string | null | undefined) => Math.max(0, parseTetri(value) ?? 0);

function MethodSelect({ state }: { state: FinanceFormState }) {
  const t = useTranslations("orders.money");
  const te = useTranslations("enums.paymentMethod");
  return (
    <Field name="method" label={t("method")} errors={state.fieldErrors?.method}>
      <select
        id="method"
        name="method"
        className={selectClass}
        defaultValue={state.values?.method ?? "bank_transfer"}
      >
        {PAYMENT_METHOD_VALUES.map((method) => (
          <option key={method} value={method}>
            {te(method)}
          </option>
        ))}
      </select>
    </Field>
  );
}

function CommonFields({ state, today }: { state: FinanceFormState; today: string }) {
  const t = useTranslations("orders.money");
  const locale = useLocale();
  const key = useIdempotencyKey();
  return (
    <>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="stay" value="1" />
      <input type="hidden" name="idempotency_key" value={key} />
      <Field name="payment_date" label={t("date")} errors={state.fieldErrors?.payment_date}>
        <Input
          id="payment_date"
          name="payment_date"
          type="date"
          defaultValue={state.values?.payment_date ?? today}
          required
        />
      </Field>
      <MethodSelect state={state} />
      <Field name="notes" label={t("notes")} errors={state.fieldErrors?.notes} className="sm:col-span-2">
        <Input id="notes" name="notes" maxLength={255} defaultValue={state.values?.notes ?? ""} />
      </Field>
    </>
  );
}

function AmountField({
  state,
  value,
  onChange,
}: {
  state: FinanceFormState;
  value: string;
  onChange: (value: string) => void;
}) {
  const t = useTranslations("orders.money");
  return (
    <Field
      name="amount"
      label={`${t("amount")} (${CURRENCY_SYMBOL})`}
      errors={state.fieldErrors?.amount ?? state.fieldErrors?.allocations}
    >
      <Input
        id="amount"
        name="amount"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus
        required
      />
    </Field>
  );
}

/**
 * What is owed, and what the amount being typed does to it.
 *
 * The figure the form is about sits above the fields, where the PHP screen
 * kept "Due / Paid / Balance", and the line under it answers the question
 * the person has while typing: does this settle it, what is left, or is it
 * too much. It used to be one grey sentence under the amount.
 *
 * Nothing is shown to someone who may not see costs (`owed` is null).
 */
function OwedNote({
  label,
  owed,
  amount,
  over,
}: {
  label: string;
  /** In tetri; null when this user may not see the figure. */
  owed: number | null;
  /** What is typed, in tetri. */
  amount: number;
  /** What "too much" means here: credit for the client, or just a larger payout. */
  over: "credit" | "payout";
}) {
  const t = useTranslations("orders.money");
  if (owed === null) return null;

  const left = owed - amount;
  const money = (value: number) => formatMoneyString(tetriToString(value));
  const outcome =
    amount <= 0
      ? null
      : left === 0
        ? { tone: "green" as const, text: t("settles") }
        : left > 0
          ? { tone: "amber" as const, text: t("remains", { amount: money(left) }) }
          : over === "credit"
            ? { tone: "blue" as const, text: t("creditOver", { amount: money(-left) }) }
            : { tone: "amber" as const, text: t("payoutOver", { amount: money(-left) }) };

  const tones = {
    green: { box: "border-hue-green-ink/25 bg-hue-green-tint", ink: "text-hue-green-ink" },
    amber: { box: "border-hue-amber-ink/25 bg-hue-amber-tint", ink: "text-hue-amber-ink" },
    blue: { box: "border-hue-blue-ink/25 bg-hue-blue-tint", ink: "text-hue-blue-ink" },
  };
  const Mark = outcome?.tone === "green" ? CircleCheck : Info;

  return (
    <div
      className={cn(
        "rounded-lg border px-3.5 py-3 sm:col-span-2",
        outcome ? tones[outcome.tone].box : "bg-muted/50",
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 text-sm">{label}</span>
        <span className="shrink-0 text-lg font-semibold whitespace-nowrap tabular-nums">
          {money(owed)}
        </span>
      </div>
      {outcome && (
        <p className={cn("mt-1 flex items-start gap-1.5 text-xs font-medium", tones[outcome.tone].ink)}>
          <Mark className="mt-px size-3.5 shrink-0" aria-hidden />
          {outcome.text}
        </p>
      )}
    </div>
  );
}

/**
 * One of a few, each with what it is owed beside it: every translator on the
 * order and their balance at a glance, where a dropdown showed one name and
 * hid the rest. Native radios, so the choice reaches FormData under `name`
 * and the arrow keys move between rows.
 */
function ChoiceRows({
  name,
  legend,
  options,
  value,
  onChange,
  errors,
}: {
  name: string;
  legend: string;
  options: { value: number; label: string; detail?: string | null; owed: string | null }[];
  value: number;
  onChange: (value: number) => void;
  errors?: string[];
}) {
  return (
    <fieldset className="space-y-2 sm:col-span-2">
      <legend className="mb-2 text-sm leading-none font-medium">{legend}</legend>
      <div className="grid gap-1.5">
        {options.map((option) => (
          <label
            key={option.value}
            className="border-input has-[:checked]:border-suliko-default-color has-[:checked]:bg-hue-blue-tint/60 has-[:focus-visible]:ring-ring/50 flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm transition-colors has-[:focus-visible]:ring-[3px]"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="accent-suliko-default-color size-4 shrink-0"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{option.label}</span>
              {option.detail && (
                <span className="text-muted-foreground block truncate text-xs">{option.detail}</span>
              )}
            </span>
            {option.owed !== null && (
              <span className="shrink-0 tabular-nums">{formatMoneyString(option.owed)}</span>
            )}
          </label>
        ))}
      </div>
      {errors?.length ? <p className="text-destructive text-xs">{errors.join(" ")}</p> : null}
    </fieldset>
  );
}

function PaymentFields({
  state,
  today,
  orderId,
  clientId,
  outstanding,
}: {
  state: FinanceFormState;
  today: string;
  orderId: number;
  clientId: number;
  outstanding: string;
}) {
  const t = useTranslations("orders.money");
  const owed = tetri(outstanding);
  const [amount, setAmount] = useState(state.values?.amount ?? (owed > 0 ? outstanding : ""));
  // Up to what this order owes; anything over stays on the client as credit.
  const allocate = Math.min(tetri(amount), owed);
  const allocations =
    allocate > 0 ? [{ order_id: orderId, amount_allocated: tetriToString(allocate) }] : [];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="client_id" value={clientId} />
      <input type="hidden" name="allocations" value={JSON.stringify(allocations)} />
      <OwedNote label={t("owedLabel")} owed={owed} amount={tetri(amount)} over="credit" />
      <AmountField state={state} value={amount} onChange={setAmount} />
      <CommonFields state={state} today={today} />
    </div>
  );
}

function TranslatorPayoutFields({
  state,
  today,
  orderId,
  translators,
}: {
  state: FinanceFormState;
  today: string;
  orderId: number;
  translators: OwedTranslator[];
}) {
  const t = useTranslations("orders.money");
  const first = translators.find((p) => tetri(p.owed) > 0) ?? translators[0];
  const [translatorId, setTranslatorId] = useState(
    Number(state.values?.translator_id ?? first?.id ?? 0),
  );
  const current = translators.find((p) => p.id === translatorId);
  const defaultAmount = (person?: OwedTranslator) =>
    person?.owed && tetri(person.owed) > 0 ? person.owed : "";
  const [amount, setAmount] = useState(state.values?.amount ?? defaultAmount(current));

  // Allocated to this order up to what it owes this translator; with costs
  // hidden the owed figure is unknown, so the API does the capping.
  const owed = current?.owed === null || current?.owed === undefined ? null : tetri(current.owed);
  const allocate = owed === null ? tetri(amount) : Math.min(tetri(amount), owed);
  const allocations =
    allocate > 0 ? [{ order_id: orderId, amount_allocated: tetriToString(allocate) }] : [];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="allocations" value={JSON.stringify(allocations)} />
      <ChoiceRows
        name="translator_id"
        legend={t("translator")}
        options={translators.map((person) => ({
          value: person.id,
          label: person.name,
          owed: person.owed,
        }))}
        value={translatorId}
        onChange={(id) => {
          setTranslatorId(id);
          setAmount(defaultAmount(translators.find((p) => p.id === id)));
        }}
        errors={state.fieldErrors?.translator_id}
      />
      {current && (
        <OwedNote
          label={t("translatorOwedLabel", { name: current.name })}
          owed={owed}
          amount={tetri(amount)}
          over="payout"
        />
      )}
      <AmountField state={state} value={amount} onChange={setAmount} />
      <CommonFields state={state} today={today} />
    </div>
  );
}

function NotaryPayoutFields({
  state,
  today,
  orderId,
  documents,
}: {
  state: FinanceFormState;
  today: string;
  orderId: number;
  documents: OwedNotaryDocument[];
}) {
  const t = useTranslations("orders.money");
  const first = documents.find((d) => tetri(d.owed) > 0) ?? documents[0];
  const [documentId, setDocumentId] = useState(first?.documentId ?? 0);
  const current = documents.find((d) => d.documentId === documentId);
  const defaultAmount = (doc?: OwedNotaryDocument) =>
    doc?.owed && tetri(doc.owed) > 0 ? doc.owed : "";
  const [amount, setAmount] = useState(state.values?.amount ?? defaultAmount(current));

  const owed = current?.owed === null || current?.owed === undefined ? null : tetri(current.owed);
  const allocate = owed === null ? tetri(amount) : Math.min(tetri(amount), owed);
  const allocations =
    current && allocate > 0
      ? [{ document_id: current.documentId, amount: tetriToString(allocate) }]
      : [];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="documents" value={JSON.stringify(allocations)} />
      <input type="hidden" name="order_id" value={orderId} />
      <input type="hidden" name="notary_id" value={current?.notaryId ?? ""} />
      {/* The action reads `documents` and `notary_id` above; this name only
          groups the radios. */}
      <ChoiceRows
        name="document_choice"
        legend={t("document")}
        options={documents.map((doc) => ({
          value: doc.documentId,
          label: doc.label,
          detail: doc.notaryName,
          owed: doc.owed,
        }))}
        value={documentId}
        onChange={(id) => {
          setDocumentId(id);
          setAmount(defaultAmount(documents.find((d) => d.documentId === id)));
        }}
      />
      {current && (
        <OwedNote label={t("notaryOwedLabel")} owed={owed} amount={tetri(amount)} over="payout" />
      )}
      <AmountField state={state} value={amount} onChange={setAmount} />
      <CommonFields state={state} today={today} />
    </div>
  );
}

/** A heading inside the panel: small capitals over a group of lines. */
function Heading({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{children}</h3>
  );
}

function Section({
  title,
  rows,
  render,
}: {
  title: string;
  rows: unknown[];
  render: () => ReactNode;
}) {
  if (rows.length === 0) return null;
  return (
    <section className="space-y-1">
      <Heading>{title}</Heading>
      <ul className="divide-border divide-y text-sm">{render()}</ul>
    </section>
  );
}

/**
 * One way money leaves the order: to whom, what is still owed, and the
 * button that records paying it.
 *
 * The PHP screen had a card for each (Notary Fees, Translator Payouts,
 * Expenses), every one with its own button. Here they are three lines of one
 * list. What a translator was still owed could, until this, only be seen by
 * opening the dialog.
 */
function OutgoingRow({
  label,
  note,
  tone = "plain",
  action,
}: {
  label: string;
  note?: ReactNode;
  tone?: "due" | "settled" | "plain";
  action?: ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{label}</p>
        {note && (
          <p
            className={cn(
              "flex items-center gap-1 text-xs tabular-nums",
              tone === "due" && "text-hue-amber-ink font-medium",
              tone === "settled" && "text-hue-green-ink",
              tone === "plain" && "text-muted-foreground",
            )}
          >
            {note}
          </p>
        )}
      </div>
      {action}
    </li>
  );
}

export function OrderMoney({
  orderId,
  clientId,
  clientName,
  today,
  outstanding,
  payments,
  translatorPayouts,
  notaryPayouts,
  expenses,
  translators,
  notaryDocuments,
  can,
}: {
  orderId: number;
  clientId: number;
  clientName: string;
  today: string;
  outstanding: string;
  payments: MoneyRow[];
  translatorPayouts: MoneyRow[];
  notaryPayouts: MoneyRow[];
  expenses: ExpenseRow[];
  translators: OwedTranslator[];
  notaryDocuments: OwedNotaryDocument[];
  can: { record: boolean; refund: boolean; expenses: boolean };
}) {
  const t = useTranslations("orders.money");
  const tf = useTranslations("finances");
  const tm = useTranslations("enums.paymentMethod");
  const tx = useTranslations("enums.expenseCategory");
  const timeZone = useTimezone();
  const returnTo = `/translations/${orderId}`;
  const locale = useLocale();

  const method = (value: string) => (tm.has(value) ? tm(value) : value);
  const money = (value: number) => formatMoneyString(tetriToString(value));
  const nothing =
    payments.length + translatorPayouts.length + notaryPayouts.length + expenses.length === 0;

  // Null as soon as one figure is hidden: half a sum would be a wrong sum.
  const owedIn = (rows: { owed: string | null }[]) =>
    rows.some((row) => row.owed === null) ? null : rows.reduce((sum, row) => sum + tetri(row.owed), 0);
  const owedNote = (owed: number | null): { note?: ReactNode; tone: "due" | "settled" | "plain" } =>
    owed === null
      ? { tone: "plain" }
      : owed > 0
        ? { note: t("owed", { amount: money(owed) }), tone: "due" }
        : {
            note: (
              <>
                <CircleCheck className="size-3.5 shrink-0" aria-hidden /> {t("settled")}
              </>
            ),
            tone: "settled",
          };

  const payable = notaryDocuments.filter((d) => d.notaryId !== null);
  const spent = expenses.reduce((sum, row) => sum + tetri(row.amount), 0);
  const showOutgoing =
    translators.length > 0 || notaryDocuments.length > 0 || can.expenses || expenses.length > 0;

  const moneyLine = (row: MoneyRow, kind: "payment" | "payout", remove: (f: FormData) => Promise<void>, deletable: boolean) => (
    <li key={`${kind}-${row.id}`} className="flex items-start justify-between gap-2 py-2">
      <div className="min-w-0">
        {row.who && <p className="truncate font-medium">{row.who}</p>}
        <p className="text-muted-foreground text-xs">
          {formatDate(row.date, timeZone)} · {method(row.method)}
        </p>
        {row.here !== row.amount && (
          <p className="text-muted-foreground text-xs">
            {t("ofTotal", {
              here: formatMoneyString(row.here),
              total: formatMoneyString(row.amount),
            })}
          </p>
        )}
        {row.viaTranslatorPaymentId && (
          <p className="text-muted-foreground text-xs">
            {tf("viaTranslator", { id: row.viaTranslatorPaymentId })}
          </p>
        )}
        {row.notes && <p className="text-muted-foreground text-xs">{row.notes}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <span className="font-semibold tabular-nums">{formatMoneyString(row.here)}</span>
        {deletable && (
          <ConfirmDeleteButton
            compact
            id={row.id}
            name={tf(`delete.${kind}`, { id: row.id })}
            description={tf("delete.description")}
            action={remove}
            fields={{ return_to: returnTo }}
          />
        )}
      </div>
    </li>
  );

  return (
    <div className="space-y-5">
      {can.record && (
        <FormDialog<FinanceFormState>
          trigger={
            <Button variant="brand" className="w-full">
              <Wallet /> {t("recordPayment")}
            </Button>
          }
          title={t("recordPayment")}
          description={t("recordPaymentDescription", { client: clientName })}
          icon={Wallet}
          hue="green"
          action={recordPaymentAction}
          submitLabel={t("save")}
          submitIcon={<Wallet />}
        >
          {(state) => (
            <PaymentFields
              state={state}
              today={today}
              orderId={orderId}
              clientId={clientId}
              outstanding={outstanding}
            />
          )}
        </FormDialog>
      )}

      {showOutgoing && (
        <section className="space-y-1">
          <Heading>{t("outgoing")}</Heading>
          <ul className="divide-border divide-y">
            {translators.length > 0 && (
              <OutgoingRow
                label={t("translatorPayouts")}
                {...owedNote(owedIn(translators))}
                action={
                  can.record && (
                    <FormDialog<FinanceFormState>
                      trigger={
                        <Button variant="outline" size="sm" title={t("payTranslator")}>
                          <HandCoins /> {t("pay")}
                        </Button>
                      }
                      title={t("payTranslator")}
                      description={t("payTranslatorDescription")}
                      icon={HandCoins}
                      hue="violet"
                      action={payTranslatorAction}
                      submitLabel={t("save")}
                      submitIcon={<HandCoins />}
                    >
                      {(state) => (
                        <TranslatorPayoutFields
                          state={state}
                          today={today}
                          orderId={orderId}
                          translators={translators}
                        />
                      )}
                    </FormDialog>
                  )
                }
              />
            )}
            {notaryDocuments.length > 0 && (
              <OutgoingRow
                label={t("notaryPayouts")}
                {...owedNote(owedIn(notaryDocuments))}
                action={
                  can.record &&
                  payable.length > 0 && (
                    <FormDialog<FinanceFormState>
                      trigger={
                        <Button variant="outline" size="sm" title={t("payNotary")}>
                          <Stamp /> {t("pay")}
                        </Button>
                      }
                      title={t("payNotary")}
                      description={t("payNotaryDescription")}
                      icon={Stamp}
                      hue="plum"
                      action={payNotaryAction}
                      submitLabel={t("save")}
                      submitIcon={<Stamp />}
                    >
                      {(state) => (
                        <NotaryPayoutFields
                          state={state}
                          today={today}
                          orderId={orderId}
                          documents={payable}
                        />
                      )}
                    </FormDialog>
                  )
                }
              />
            )}
            {(can.expenses || expenses.length > 0) && (
              <OutgoingRow
                label={t("expenses")}
                note={money(spent)}
                action={
                  can.expenses && (
                    <FormDialog<FinanceFormState>
                      trigger={
                        <Button variant="outline" size="sm" title={t("addExpense")}>
                          <Receipt /> {t("add")}
                        </Button>
                      }
                      title={t("addExpense")}
                      description={t("addExpenseDescription")}
                      icon={Receipt}
                      hue="amber"
                      action={createExpenseAction}
                      submitLabel={t("save")}
                      submitIcon={<Receipt />}
                    >
                      {(state) => (
                        <>
                          <input type="hidden" name="locale" value={locale} />
                          <input type="hidden" name="stay" value="1" />
                          <ExpenseFields state={state} today={today} orderId={orderId} />
                        </>
                      )}
                    </FormDialog>
                  )
                }
              />
            )}
          </ul>
        </section>
      )}

      {nothing && <p className="text-muted-foreground text-xs">{t("noPayments")}</p>}

      <Section
        title={t("clientPayments")}
        rows={payments}
        render={() => payments.map((row) => moneyLine(row, "payment", deletePaymentAction, can.refund))}
      />
      <Section
        title={t("translatorPayouts")}
        rows={translatorPayouts}
        render={() =>
          translatorPayouts.map((row) =>
            moneyLine(row, "payout", deleteTranslatorPayoutAction, can.refund),
          )
        }
      />
      <Section
        title={t("notaryPayouts")}
        rows={notaryPayouts}
        render={() =>
          notaryPayouts.map((row) => moneyLine(row, "payout", deleteNotaryPayoutAction, can.refund))
        }
      />
      <Section
        title={t("expenses")}
        rows={expenses}
        render={() =>
          expenses.map((row) => (
            <li key={`expense-${row.id}`} className="flex items-start justify-between gap-2 py-2">
              <div className="min-w-0">
                <p className="truncate font-medium">{row.description}</p>
                <p className="text-muted-foreground text-xs">
                  {formatDate(row.date, timeZone)} ·{" "}
                  {tx.has(row.category) ? tx(row.category) : row.category}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <span className="font-semibold tabular-nums">{formatMoneyString(row.amount)}</span>
                {can.expenses && (
                  <ConfirmDeleteButton
                    compact
                    id={row.id}
                    name={tf("delete.expense", { id: row.id })}
                    description={tf("delete.description")}
                    action={deleteExpenseAction}
                    fields={{ return_to: returnTo }}
                  />
                )}
              </div>
            </li>
          ))
        }
      />
    </div>
  );
}
