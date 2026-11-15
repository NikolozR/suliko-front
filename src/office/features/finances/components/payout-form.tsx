"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { HandCoins, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useRef, useState, useTransition } from "react";

import {
  payTranslatorAction,
  translatorBalanceAction,
  type FinanceFormState,
} from "@office/features/finances/actions";
import type { TranslatorBalance } from "@office/features/finances/api";
import { PAYMENT_METHOD_VALUES } from "@office/features/finances/constants";
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
import { CURRENCY_SYMBOL, formatMoneyString } from "@office/shared/lib/money";

/**
 * Pay a translator — the month-end transfer, not tied to particular orders.
 *
 * An unallocated payout still reduces what the translator is owed, exactly as
 * the PHP counted it, so this form needs no allocation table. Paying for
 * specific jobs is done from the order, where the cost is on screen.
 */
export function PayoutForm({
  today,
  translators,
  initialTranslatorId,
}: {
  today: string;
  translators: { id: number; name: string }[];
  initialTranslatorId?: number;
}) {
  const t = useTranslations("finances.form");
  const tc = useTranslations("common");
  const te = useTranslations("enums.paymentMethod");
  const locale = useLocale();
  const idempotencyKey = useIdempotencyKey();

  const [state, formAction] = useActionState<FinanceFormState, FormData>(payTranslatorAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  useFocusOnError(formRef, state);
  const errors = state.fieldErrors ?? {};
  const value = (field: string, fallback = "") => state.values?.[field] ?? fallback;

  const [translatorId, setTranslatorId] = useState(
    value("translator_id", initialTranslatorId ? String(initialTranslatorId) : ""),
  );
  const [amount, setAmount] = useState(value("amount"));
  const [balance, setBalance] = useState<TranslatorBalance | null>(null);
  const [isLoading, startLoading] = useTransition();

  const pick = (id: string) => {
    setTranslatorId(id);
    setBalance(null);
    if (!id) return;
    startLoading(async () => {
      const found = await translatorBalanceAction(Number(id));
      setBalance(found);
      // Pre-fill what is owed — the usual payout — but never over a typed amount.
      if (found && Number(found.outstanding) > 0) {
        setAmount((current) => current || found.outstanding);
      }
    });
  };

  return (
    <form ref={formRef} action={formAction} noValidate>
      <UnsavedChangesGuard formRef={formRef} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="idempotency_key" value={idempotencyKey} />
      <input type="hidden" name="allocations" value="[]" />

      <FormAlert message={state.error} stepUp={state.stepUp} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("payoutTitle")}</CardTitle>
          <p className="text-muted-foreground text-xs">{t("payoutHint")}</p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field
            name="translator_id"
            label={t("translator")}
            errors={errors.translator_id}
            className="sm:col-span-2"
            hint={
              balance
                ? t("translatorBalance", {
                    earned: formatMoneyString(balance.earned),
                    paid: formatMoneyString(balance.paid),
                    owed: formatMoneyString(balance.outstanding),
                  })
                : undefined
            }
          >
            <div className="flex items-center gap-2">
              <select
                id="translator_id"
                name="translator_id"
                className={selectClass}
                value={translatorId}
                onChange={(event) => pick(event.target.value)}
                required
              >
                <option value="">{t("pickTranslator")}</option>
                {translators.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
              {isLoading && <Loader2 className="text-muted-foreground size-4 animate-spin" />}
            </div>
          </Field>

          <Field name="amount" label={`${t("amount")} (${CURRENCY_SYMBOL})`} errors={errors.amount}>
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

          <Field name="notes" label={t("notes")} errors={errors.notes}>
            <Input id="notes" name="notes" defaultValue={value("notes")} maxLength={255} />
          </Field>
        </CardContent>
      </Card>

      <div className="mt-4 flex items-center gap-2">
        <SubmitButton label={t("payTranslator")} icon={<HandCoins />} />
        <Button variant="ghost" asChild>
          <Link href="/finances?tab=payouts">{tc("cancel")}</Link>
        </Button>
      </div>
    </form>
  );
}
