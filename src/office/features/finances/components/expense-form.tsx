"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Receipt } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useRef } from "react";

import { createExpenseAction, type FinanceFormState } from "@office/features/finances/actions";
import { EXPENSE_CATEGORIES } from "@office/features/finances/constants";
import { Link } from "@office/i18n/navigation";
import {
  Field,
  FormAlert,
  SubmitButton,
  selectClass,
  useFocusOnError,
} from "@office/shared/components/form/fields";
import { UnsavedChangesGuard } from "@office/shared/components/form/unsaved-changes-guard";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@office/shared/components/ui/card";
import { Input } from "@office/shared/components/ui/input";
import { CURRENCY_SYMBOL } from "@office/shared/lib/money";

/**
 * The expense fields, shared by the Finances form below and the "Add expense"
 * dialog on an order.
 *
 * The order field is the one that matters: an expense with an order on it
 * reduces that order's profit, and one without is a general business cost that
 * reduces none. Getting this wrong makes a single order look unprofitable, or
 * hides a real cost inside one — so the hint says exactly what the field does
 * rather than just naming it.
 */
export function ExpenseFields({
  state,
  today,
  orderId,
}: {
  state: FinanceFormState;
  today: string;
  /** Fixed to one order (the order page's dialog); the field is then hidden. */
  orderId?: number;
}) {
  const t = useTranslations("finances.form");
  const te = useTranslations("enums.expenseCategory");
  const value = (field: string, fallback = "") => state.values?.[field] ?? fallback;
  const errors = state.fieldErrors ?? {};

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field
        name="description"
        label={t("description")}
        errors={errors.description}
        className="sm:col-span-2"
      >
        <Input
          id="description"
          name="description"
          defaultValue={value("description")}
          autoFocus
          required
          maxLength={255}
          aria-invalid={Boolean(errors.description?.length)}
        />
      </Field>

      <Field name="amount" label={`${t("amount")} (${CURRENCY_SYMBOL})`} errors={errors.amount}>
        <Input
          id="amount"
          name="amount"
          inputMode="decimal"
          defaultValue={value("amount")}
          placeholder="0.00"
          required
          aria-invalid={Boolean(errors.amount?.length)}
        />
      </Field>

      <Field name="expense_date" label={t("expenseDate")} errors={errors.expense_date}>
        <Input
          id="expense_date"
          name="expense_date"
          type="date"
          defaultValue={value("expense_date", today)}
          required
        />
      </Field>

      <Field name="category" label={t("category")} errors={errors.category}>
        <select
          id="category"
          name="category"
          className={selectClass}
          defaultValue={value("category", "other")}
        >
          {EXPENSE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {te(category)}
            </option>
          ))}
        </select>
      </Field>

      {orderId ? (
        <input type="hidden" name="order_id" value={orderId} />
      ) : (
        <Field
          name="order_id"
          label={t("chargeToOrder")}
          errors={errors.order_id}
          hint={t("chargeHint")}
        >
          <Input
            id="order_id"
            name="order_id"
            inputMode="numeric"
            defaultValue={value("order_id")}
            placeholder={t("orderPlaceholder")}
            aria-invalid={Boolean(errors.order_id?.length)}
          />
        </Field>
      )}
    </div>
  );
}

/** Record a business expense, from the Finances screen. */
export function ExpenseForm({ today, orderId }: { today: string; orderId?: number }) {
  const t = useTranslations("finances.form");
  const tc = useTranslations("common");
  const locale = useLocale();

  const [state, formAction] = useActionState<FinanceFormState, FormData>(
    createExpenseAction,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  useFocusOnError(formRef, state);

  return (
    <form ref={formRef} action={formAction} noValidate>
      <UnsavedChangesGuard formRef={formRef} />
      <input type="hidden" name="locale" value={locale} />
      {orderId && <input type="hidden" name="return_to" value={`/translations/${orderId}`} />}

      <FormAlert message={state.error} stepUp={state.stepUp} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("expenseTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseFields
            state={{
              ...state,
              values: { order_id: orderId ? String(orderId) : "", ...state.values },
            }}
            today={today}
          />
        </CardContent>
      </Card>

      <div className="mt-4 flex items-center gap-2">
        <SubmitButton label={t("addExpense")} icon={<Receipt />} />
        <Button variant="ghost" asChild>
          <Link href="/finances?tab=expenses">{tc("cancel")}</Link>
        </Button>
      </div>
    </form>
  );
}
