"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import {
  AlertTriangle,
  Phone,
  Save,
  StickyNote,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useRef, useState, useTransition } from "react";

import {
  createClientAction,
  duplicatesAction,
  updateClientAction,
  type ClientFormState,
} from "@office/features/clients/actions";
import type { ClientDetail, PossibleDuplicate } from "@office/features/clients/api";
import { CLIENT_TYPES } from "@office/features/clients/schema";
import { ACQUISITION_SOURCES } from "@office/features/clients/sources";
import { Link } from "@office/i18n/navigation";
import {
  Field,
  FormAlert,
  SubmitButton,
  selectClass,
  useFocusOnError,
} from "@office/shared/components/form/fields";
import { UnsavedChangesGuard } from "@office/shared/components/form/unsaved-changes-guard";
import { OptionSelect } from "@office/shared/components/form/option-select";
import { IconChip } from "@office/shared/components/icon-chip";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent } from "@office/shared/components/ui/card";
import { Input } from "@office/shared/components/ui/input";
import { Textarea } from "@office/shared/components/ui/textarea";
import { RowLink } from "@office/shared/components/data/row-link";
import type { Hue } from "@office/shared/lib/hues";
import { PHONE_PLACEHOLDER } from "@office/shared/lib/phone";

/** One titled block of the form, so a long form reads as three short ones. */
function Section({
  icon,
  hue,
  title,
  children,
}: {
  icon: LucideIcon;
  hue: Hue;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="mb-4">
      <CardContent className="grid gap-4 px-6 py-0 sm:grid-cols-2">
        <h2 className="flex items-center gap-2.5 text-base font-semibold sm:col-span-2">
          <IconChip icon={icon} hue={hue} />
          {title}
        </h2>
        {children}
      </CardContent>
    </Card>
  );
}

/**
 * One form for both create and edit.
 *
 * Keeping them together means a field added in one place cannot be forgotten
 * in the other — the commonest way these two screens drift apart.
 *
 * Leaving the phone, email or ID number box checks for an existing client with
 * the same detail, as the PHP app did: the same person entered twice splits
 * their orders and balance across two records nobody reconciles. A warning,
 * never a refusal — two family members can share a phone.
 */
export function ClientForm({
  client,
  sourceOptions = [],
  canAddSources = false,
}: {
  client?: ClientDetail;
  /** The bureau's own acquisition sources, after the built-in ones. */
  sourceOptions?: readonly string[];
  canAddSources?: boolean;
}) {
  const t = useTranslations("clients.form");
  const tc = useTranslations("common");
  const te = useTranslations("enums.clientType");
  const ts = useTranslations("enums.acquisitionSource");
  const locale = useLocale();
  const isEdit = Boolean(client);
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction] = useActionState<ClientFormState, FormData>(
    isEdit ? updateClientAction : createClientAction,
    {},
  );
  useFocusOnError(formRef, state);
  const [duplicates, setDuplicates] = useState<PossibleDuplicate[]>([]);
  const [, startChecking] = useTransition();

  // After a failed submit the server echoes back what was typed, so nothing is
  // lost. Falls back to the record being edited, then to blank.
  const value = (field: string, fallback?: string | null) =>
    state.values?.[field] ?? fallback ?? "";

  const errors = state.fieldErrors ?? {};
  const invalid = (field: keyof typeof errors) =>
    Boolean(errors[field]?.length);

  const checkDuplicates = () => {
    const form = formRef.current;
    if (!form) return;
    const read = (name: string) => String(new FormData(form).get(name) ?? "");
    startChecking(async () => {
      setDuplicates(
        await duplicatesAction({
          phone: read("phone"),
          email: read("email"),
          personalNumber: read("personal_number"),
          excludeId: client?.id,
        }),
      );
    });
  };

  return (
    <form ref={formRef} action={formAction} noValidate className="max-w-3xl">
      <UnsavedChangesGuard formRef={formRef} />
      <input type="hidden" name="locale" value={locale} />
      {client && <input type="hidden" name="id" value={client.id} />}

      <FormAlert message={state.error} stepUp={state.stepUp} />

      {duplicates.length > 0 && (
        <div
          role="status"
          className="border-status-warning/40 bg-status-warning/10 mb-4 flex items-start gap-3 rounded-md border px-3 py-3 text-sm"
        >
          <AlertTriangle
            className="text-status-warning mt-0.5 size-4 shrink-0"
            aria-hidden
          />
          <div className="space-y-1.5">
            <p className="font-medium">{t("duplicatesTitle")}</p>
            <p className="text-muted-foreground text-xs">
              {t("duplicatesBody")}
            </p>
            <ul className="space-y-1">
              {duplicates.map((match) => (
                <li
                  key={match.id}
                  className="flex flex-wrap items-center gap-2"
                >
                  <RowLink
                    href={`/clients/${match.id}`}
                    target="_blank"
                    className="text-link font-medium hover:underline"
                  >
                    {match.name} · #{match.number}
                  </RowLink>
                  <span className="text-muted-foreground text-xs">
                    {match.matched_on
                      .map((field) =>
                        t.has(`matched.${field}`)
                          ? t(`matched.${field}`)
                          : field,
                      )
                      .join(", ")}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground text-xs">{t("stillSave")}</p>
          </div>
        </div>
      )}

      <Section icon={UserRound} hue="blue" title={t("sectionIdentity")}>
        <Field
          name="name"
          label={t("name")}
          errors={errors.name}
          className="sm:col-span-2"
        >
          <Input
            id="name"
            name="name"
            defaultValue={value("name", client?.name)}
            autoFocus
            required
            maxLength={255}
            aria-invalid={invalid("name")}
          />
        </Field>

        <Field
          name="client_type"
          label={t("clientType")}
          errors={errors.client_type}
        >
          {/* A native select, not the Radix one: Radix's trigger is a button
                that holds its value in React state, which does not serialise
                into FormData for a server action without a hidden input. */}
          <select
            id="client_type"
            name="client_type"
            defaultValue={value("client_type", client?.client_type) || "B2C"}
            className={selectClass}
          >
            {CLIENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {te(type.value)}
              </option>
            ))}
          </select>
        </Field>

        <Field
          name="personal_number"
          label={t("idNumber")}
          errors={errors.personal_number}
          hint={isEdit ? t("idNumberHintEdit") : t("idNumberHintNew")}
        >
          <Input
            id="personal_number"
            name="personal_number"
            defaultValue={value("personal_number")}
            maxLength={50}
            onBlur={checkDuplicates}
            // Deliberately NOT prefilled on edit: the API only ever returns
            // this masked, so prefilling would write the mask (•••••1234)
            // back over the real value.
            placeholder={
              isEdit ? (client?.personal_number_masked ?? "") : undefined
            }
            aria-invalid={invalid("personal_number")}
          />
        </Field>
      </Section>

      <Section icon={Phone} hue="teal" title={t("sectionContact")}>
        <Field name="phone" label={t("phone")} errors={errors.phone}>
          <Input
            id="phone"
            name="phone"
            inputMode="tel"
            autoComplete="off"
            placeholder={PHONE_PLACEHOLDER}
            type="tel"
            defaultValue={value("phone", client?.phone)}
            maxLength={50}
            onBlur={checkDuplicates}
            aria-invalid={invalid("phone")}
          />
        </Field>

        <Field name="email" label={t("email")} errors={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={value("email", client?.email)}
            maxLength={255}
            onBlur={checkDuplicates}
            aria-invalid={invalid("email")}
          />
        </Field>

        <Field
          name="address"
          label={t("address")}
          errors={errors.address}
          className="sm:col-span-2"
        >
          <Input
            id="address"
            name="address"
            defaultValue={value("address", client?.address)}
            maxLength={500}
            aria-invalid={invalid("address")}
          />
        </Field>
      </Section>

      <Section icon={StickyNote} hue="amber" title={t("sectionMore")}>
        <Field
          name="acquisition_source"
          label={t("source")}
          errors={errors.acquisition_source}
          hint={t("sourceHint")}
          className="sm:col-span-2"
        >
          <OptionSelect
            id="acquisition_source"
            name="acquisition_source"
            list="acquisition_source"
            builtIns={ACQUISITION_SOURCES.map((key) => ({
              value: key,
              label: ts(key),
            }))}
            custom={sourceOptions}
            defaultValue={value(
              "acquisition_source",
              client?.acquisition_source,
            )}
            canAdd={canAddSources}
            invalid={invalid("acquisition_source")}
          />
        </Field>

        <Field
          name="notes"
          label={t("notes")}
          errors={errors.notes}
          className="sm:col-span-2"
        >
          <Textarea
            id="notes"
            name="notes"
            rows={4}
            defaultValue={value("notes", client?.notes)}
            aria-invalid={invalid("notes")}
          />
        </Field>
      </Section>

      <div className="mt-4 flex items-center gap-2">
        <SubmitButton
          label={isEdit ? tc("save") : tc("create")}
          icon={<Save />}
        />
        <Button variant="ghost" asChild>
          <Link href={client ? `/clients/${client.id}` : "/clients"}>
            {tc("cancel")}
          </Link>
        </Button>
      </div>
    </form>
  );
}
