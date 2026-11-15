"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { useLocale, useTranslations } from "next-intl";
import { useActionState, useRef } from "react";

import { Link } from "@office/i18n/navigation";
import {
  createTranslatorAction,
  updateTranslatorAction,
  type TranslatorFormState,
} from "@office/features/translators/actions";
import { CITY_CODES } from "@office/features/translators/cities";
import { WORK_KINDS, workKindOf } from "@office/features/translators/work-kind";
import { translatorWork, type TranslatorDetail } from "@office/features/directory/types";
import { groupPairs } from "@office/features/translators/pairs";
import {
  LanguagePairsField,
  type PairLanguage,
} from "@office/features/translators/components/language-pairs-field";
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
import { Checkbox } from "@office/shared/components/ui/checkbox";
import { Input } from "@office/shared/components/ui/input";
import { Label } from "@office/shared/components/ui/label";
import { Textarea } from "@office/shared/components/ui/textarea";
import { PHONE_PLACEHOLDER } from "@office/shared/lib/phone";

/**
 * One form for both create and edit.
 *
 * Together rather than apart so a field added in one cannot be forgotten in
 * the other — the commonest way these two screens drift.
 *
 * Bank details sit in their own card because they are payment credentials, not
 * contact details: the visual separation is the cue that this half of the form
 * is the half that moves money.
 */
export function TranslatorForm({
  translator,
  languages,
}: {
  translator?: TranslatorDetail;
  /** The bureau's active languages, for the pair dropdowns. */
  languages: readonly PairLanguage[];
}) {
  const t = useTranslations("common");
  const td = useTranslations("directory");
  const tt = useTranslations("translators");
  const locale = useLocale();
  const isEdit = Boolean(translator);

  const [state, formAction] = useActionState<TranslatorFormState, FormData>(
    isEdit ? updateTranslatorAction : createTranslatorAction,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  useFocusOnError(formRef, state);

  // After a failed submit the server echoes back what was typed, so nothing is
  // lost. Falls back to the record being edited, then to blank.
  const value = (field: string, fallback?: string | null) =>
    state.values?.[field] ?? fallback ?? "";

  const errors = state.fieldErrors ?? {};
  const invalid = (field: keyof typeof errors) => Boolean(errors[field]?.length);

  // A fresh translator is active; an edit reflects the stored flag. The echoed
  // value wins after a failed submit so the checkbox does not silently reset.
  const activeDefault = state.values
    ? state.values.is_active === "on"
    : (translator?.is_active ?? true);

  // The same for what they can be given. A new translator does documents only,
  // which is what every translator was before these choices existed.
  const work = translator ? translatorWork(translator) : null;
  const checked = (field: string, stored: boolean) =>
    state.values ? state.values[field] === "on" : stored;
  const workKind =
    state.values?.work_kind ?? workKindOf(work?.written ?? true, work?.oral ?? false);
  const echoedCities: string[] | null = (() => {
    try {
      return state.values?.cities ? JSON.parse(state.values.cities) : null;
    } catch {
      return null;
    }
  })();
  const selectedCities = echoedCities ?? work?.cities ?? [];
  const tcity = useTranslations("cities");
  const echoedPairs = (() => {
    try {
      return state.values?.language_pairs ? JSON.parse(state.values.language_pairs) : null;
    } catch {
      return null;
    }
  })();

  return (
    <form ref={formRef} action={formAction} noValidate className="max-w-4xl">
      <UnsavedChangesGuard formRef={formRef} />
      <input type="hidden" name="locale" value={locale} />
      {translator && <input type="hidden" name="id" value={translator.id} />}

      <FormAlert message={state.error} />

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{td("profile")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field name="name" label={tt("fullName")} errors={errors.name} className="sm:col-span-2">
              <Input
                id="name"
                name="name"
                defaultValue={value("name", translator?.name)}
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
                defaultValue={value("phone", translator?.phone)}
                maxLength={50}
                aria-invalid={invalid("phone")}
              />
            </Field>

            <Field name="email" label={td("email")} errors={errors.email}>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={value("email", translator?.email)}
                maxLength={255}
                aria-invalid={invalid("email")}
              />
            </Field>

            <Field
              name="office_address"
              label={td("officeAddress")}
              errors={errors.office_address}
              hint={tt("form.officeHint")}
              className="sm:col-span-2"
            >
              <Input
                id="office_address"
                name="office_address"
                defaultValue={value("office_address", translator?.office_address)}
                maxLength={255}
                aria-invalid={invalid("office_address")}
              />
            </Field>

            <Field
              name="experience_from"
              label={tt("since")}
              errors={errors.experience_from}
            >
              <Input
                id="experience_from"
                name="experience_from"
                type="date"
                defaultValue={value("experience_from", translator?.experience_from)}
                aria-invalid={invalid("experience_from")}
              />
            </Field>

            <Field
              name="default_rate"
              label={tt("form.defaultRateLabel")}
              errors={errors.default_rate}
              hint={tt("form.defaultRateHint")}
            >
              <Input
                id="default_rate"
                name="default_rate"
                inputMode="decimal"
                defaultValue={value("default_rate", translator?.default_rate)}
                aria-invalid={invalid("default_rate")}
              />
            </Field>

            <div className="flex items-center gap-2 sm:col-span-2">
              <Checkbox id="is_active" name="is_active" defaultChecked={activeDefault} />
              <Label htmlFor="is_active" className="font-normal">
                {tt("activeDescription")}
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{tt("form.workTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Keyed by what came back: after a failed save the form is reset
                to each field's first value, so it remounts with the echo. */}
            <fieldset
              key={JSON.stringify([state.values?.work_kind, state.values?.can_notarize])}
              className="space-y-3"
            >
              <div className="max-w-xs space-y-2">
                <Label htmlFor="work_kind">{tt("work")}</Label>
                <select
                  id="work_kind"
                  name="work_kind"
                  className={selectClass}
                  defaultValue={workKind}
                >
                  {WORK_KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {tt(`workKind.${kind}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="can_notarize"
                  name="can_notarize"
                  defaultChecked={checked("can_notarize", work?.canNotarize ?? false)}
                />
                <Label htmlFor="can_notarize" className="font-normal">
                  {tt("canNotarize")}
                </Label>
              </div>
            </fieldset>

            <Field
              name="language_pairs"
              label={tt("form.pairsLabel")}
              errors={errors.language_pairs}
              hint={tt("form.pairsHint")}
            >
              <LanguagePairsField
                name="language_pairs"
                languages={languages}
                initial={echoedPairs ?? groupPairs(work?.pairs ?? [])}
                invalid={invalid("language_pairs")}
                defaultRate={translator?.default_rate}
              />
            </Field>

            <fieldset key={JSON.stringify(selectedCities)} className="space-y-2">
              <legend className="mb-1 text-sm font-medium">{tt("form.citiesLabel")}</legend>
              <p className="text-muted-foreground text-xs">{tt("form.citiesHint")}</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
                {CITY_CODES.map((code) => (
                  <div key={code} className="flex items-center gap-2">
                    <Checkbox
                      id={`city_${code}`}
                      name="cities"
                      value={code}
                      defaultChecked={selectedCities.includes(code)}
                    />
                    <Label htmlFor={`city_${code}`} className="font-normal">
                      {tcity(code)}
                    </Label>
                  </div>
                ))}
              </div>
            </fieldset>
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
                  : tt("form.ibanHintNew")
              }
              className="sm:col-span-3"
            >
              <Input
                id="bank_iban"
                name="bank_iban"
                // Deliberately not prefilled on edit: the API returns this
                // masked, so prefilling would write the mask over the real
                // value the first time someone saved an unrelated field.
                defaultValue={value("bank_iban")}
                placeholder={
                  isEdit ? (translator?.bank_iban_masked ?? "GE00XX0000000000000000") : undefined
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
                defaultValue={value("bank_inn", translator?.bank_inn)}
                maxLength={20}
                className="font-mono"
                aria-invalid={invalid("bank_inn")}
              />
            </Field>

            <Field name="bank_code" label={td("bankCode")} errors={errors.bank_code}>
              <Input
                id="bank_code"
                name="bank_code"
                defaultValue={value("bank_code", translator?.bank_code)}
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
                defaultValue={value("comment", translator?.comment)}
                aria-invalid={invalid("comment")}
              />
            </Field>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <SubmitButton label={isEdit ? t("save") : t("create")} />
        <Button variant="ghost" asChild>
          <Link href={translator ? `/translators/${translator.id}` : "/translators"}>
            {t("cancel")}
          </Link>
        </Button>
      </div>
    </form>
  );
}
