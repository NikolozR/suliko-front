"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { useLocale, useTranslations } from "next-intl";
import { useActionState, useRef } from "react";

import { Link } from "@office/i18n/navigation";
import {
  createNotaryAction,
  updateNotaryAction,
  type NotaryFormState,
} from "@office/features/notaries/actions";
import type { NotaryDetail } from "@office/features/directory/types";
import { Field, FormAlert, SubmitButton, useFocusOnError } from "@office/shared/components/form/fields";
import { UnsavedChangesGuard } from "@office/shared/components/form/unsaved-changes-guard";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@office/shared/components/ui/card";
import { Input } from "@office/shared/components/ui/input";
import { Textarea } from "@office/shared/components/ui/textarea";
import { PHONE_PLACEHOLDER } from "@office/shared/lib/phone";

/**
 * One form for both create and edit.
 *
 * No portal credentials anywhere in it: notaries are admin-managed records,
 * not accounts. If that changes it is a deliberate decision on the API first.
 */
export function NotaryForm({ notary }: { notary?: NotaryDetail }) {
  const t = useTranslations("common");
  const td = useTranslations("directory");
  const tn = useTranslations("notaries");
  const locale = useLocale();
  const isEdit = Boolean(notary);

  const [state, formAction] = useActionState<NotaryFormState, FormData>(
    isEdit ? updateNotaryAction : createNotaryAction,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  useFocusOnError(formRef, state);

  const value = (field: string, fallback?: string | null) =>
    state.values?.[field] ?? fallback ?? "";

  const errors = state.fieldErrors ?? {};
  const invalid = (field: keyof typeof errors) => Boolean(errors[field]?.length);

  return (
    <form ref={formRef} action={formAction} noValidate className="max-w-3xl">
      <UnsavedChangesGuard formRef={formRef} />
      <input type="hidden" name="locale" value={locale} />
      {notary && <input type="hidden" name="id" value={notary.id} />}

      <FormAlert message={state.error} />

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{td("identity")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field name="name" label={tn("notaryName")} errors={errors.name} className="sm:col-span-2">
              <Input
                id="name"
                name="name"
                defaultValue={value("name", notary?.name)}
                autoFocus
                required
                maxLength={255}
                aria-invalid={invalid("name")}
              />
            </Field>

            <Field name="phone" label={td("phone")} errors={errors.phone}>
              <Input
                id="phone"
                name="phone"
                inputMode="tel"
                autoComplete="off"
                placeholder={PHONE_PLACEHOLDER}
                type="tel"
                defaultValue={value("phone", notary?.phone)}
                maxLength={50}
                aria-invalid={invalid("phone")}
              />
            </Field>

            <Field name="email" label={td("email")} errors={errors.email}>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={value("email", notary?.email)}
                maxLength={255}
                aria-invalid={invalid("email")}
              />
            </Field>

            <Field
              name="registration_number"
              label={tn("registrationNumber")}
              errors={errors.registration_number}
              hint={tn("registrationHint")}
            >
              <Input
                id="registration_number"
                name="registration_number"
                defaultValue={value("registration_number", notary?.registration_number)}
                maxLength={100}
                className="font-mono"
                aria-invalid={invalid("registration_number")}
              />
            </Field>

            <Field
              name="office_address"
              label={td("officeAddress")}
              errors={errors.office_address}
              hint={tn("officeHint")}
            >
              <Input
                id="office_address"
                name="office_address"
                defaultValue={value("office_address", notary?.office_address)}
                maxLength={255}
                aria-invalid={invalid("office_address")}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{td("bankDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <Field
              name="bank_iban"
              label={td("iban")}
              errors={errors.bank_iban}
              hint={
                isEdit
                  ? td("ibanKeepHint")
                  : tn("ibanHintNew")
              }
              className="sm:col-span-3"
            >
              <Input
                id="bank_iban"
                name="bank_iban"
                defaultValue={value("bank_iban")}
                placeholder={
                  isEdit ? (notary?.bank_iban_masked ?? "GE00XX0000000000000000") : undefined
                }
                maxLength={34}
                className="font-mono"
                aria-invalid={invalid("bank_iban")}
              />
            </Field>

            <Field name="bank_inn" label={td("taxId")} errors={errors.bank_inn}>
              <Input
                id="bank_inn"
                name="bank_inn"
                defaultValue={value("bank_inn", notary?.bank_inn)}
                maxLength={20}
                className="font-mono"
                aria-invalid={invalid("bank_inn")}
              />
            </Field>

            <Field name="bank_code" label={td("bankCode")} errors={errors.bank_code}>
              <Input
                id="bank_code"
                name="bank_code"
                defaultValue={value("bank_code", notary?.bank_code)}
                maxLength={20}
                className="font-mono"
                aria-invalid={invalid("bank_code")}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <Field name="comment" label={td("internalNotes")} errors={errors.comment}>
              <Textarea
                id="comment"
                name="comment"
                rows={4}
                defaultValue={value("comment", notary?.comment)}
                aria-invalid={invalid("comment")}
              />
            </Field>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <SubmitButton label={isEdit ? t("save") : t("create")} />
        <Button variant="ghost" asChild>
          <Link href={notary ? `/notaries/${notary.id}` : "/notaries"}>{t("cancel")}</Link>
        </Button>
      </div>
    </form>
  );
}
