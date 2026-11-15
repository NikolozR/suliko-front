"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Building2, Check, Coins } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Fragment, useActionState, useEffect, useRef, useState } from "react";

import {
  updateGeneralAction,
  type SettingsFormState,
} from "@office/features/settings/actions";
import type { GeneralSettings, Language } from "@office/features/settings/api";
import {
  Field,
  FormAlert,
  SubmitButton,
  selectClass,
  useFocusOnError,
} from "@office/shared/components/form/fields";
import { UnsavedChangesGuard } from "@office/shared/components/form/unsaved-changes-guard";
import { IconChip } from "@office/shared/components/icon-chip";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@office/shared/components/ui/card";
import { Input } from "@office/shared/components/ui/input";
import { CURRENCY_SYMBOL } from "@office/shared/lib/money";

/** Zones offered first — where the product is sold and where clients are. */
const COMMON_ZONES = [
  "Asia/Tbilisi",
  "Europe/Istanbul",
  "Europe/Berlin",
  "Europe/London",
  "UTC",
];

/**
 * General settings.
 *
 * Most of these fields feed `suliko.domain.pricing` directly, so the card says
 * so rather than leaving someone to discover it by changing the express
 * multiplier and watching next week's quotes move.
 *
 * Stays on the page after saving — this is a form people adjust two fields in
 * and check, not one they submit and leave.
 */
/**
 * The organisation's settings record, in two halves: `organisation` (name,
 * timezone, default language, system email) on the General tab, `pricing`
 * (speed multipliers and due days, courier fee, translator share) at the top
 * of the Pricing tab. Pricing used to be split between General and Pricing
 * (audit F24); now everything about a price is in one place.
 */
export function GeneralForm({
  general,
  section,
  languages = [],
}: {
  general: GeneralSettings;
  section: "organisation" | "pricing";
  /** The bureau's languages, offered for the default language. */
  languages?: readonly Language[];
}) {
  const t = useTranslations("settings.general");
  const locale = useLocale();
  const [state, formAction] = useActionState<SettingsFormState, FormData>(
    updateGeneralAction,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  useFocusOnError(formRef, state);
  // What the unsaved-changes guard knows: whether anything was edited.
  const [dirty, setDirty] = useState(false);

  const value = (field: string, fallback?: string | number | null) =>
    state.values?.[field] ??
    (fallback === null || fallback === undefined ? "" : String(fallback));

  const errors = state.fieldErrors ?? {};
  const invalid = (field: string) => Boolean(errors[field]?.length);

  // Stored as a fraction with three decimals, shown as a percentage with one:
  // exactly the same precision, so an untouched field saves back unchanged.
  const sharePercent = String(
    Number((Number(general.default_translator_share) * 100).toFixed(1)),
  );

  // The full IANA list is filled in after mount: the server's ICU and the
  // browser's can list different zones, and rendering either during SSR would
  // make the options disagree at hydration.
  const [allZones, setAllZones] = useState<string[]>([]);
  useEffect(() => {
    try {
      const intl = Intl as unknown as {
        supportedValuesOf?: (key: string) => string[];
      };
      setAllZones(intl.supportedValuesOf?.("timeZone") ?? []);
    } catch {
      setAllZones([]);
    }
  }, []);
  const first =
    general.timezone && !COMMON_ZONES.includes(general.timezone)
      ? [...COMMON_ZONES, general.timezone]
      : COMMON_ZONES;
  const zones = [...first, ...allZones.filter((zone) => !first.includes(zone))];

  // The active languages, plus the stored one if it has since been switched
  // off, so the select never silently shows something else.
  const active = languages.filter((language) => language.is_active);
  const languageOptions = active.some(
    (language) => language.code === general.default_language,
  )
    ? active
    : [
        ...active,
        {
          id: 0,
          code: general.default_language,
          name_en: "",
          name_ka: "",
          is_active: false,
        },
      ];

  const urgencies = [
    { key: "standard", label: t("standard") },
    { key: "express", label: t("express") },
    { key: "urgent", label: t("urgent") },
  ] as const;

  // The card's last row, stuck to the bottom of the screen while the card
  // is on it: on a short laptop screen Save used to be below the fold. Only
  // there once something has been changed, so an untouched form has no
  // button to wonder about. On a phone it stops above the bottom bar.
  const saveBar = dirty && (
    <div className="bg-card border-border sticky bottom-[var(--bottom-bar)] z-10 -mb-6 flex justify-end rounded-b-xl border-t px-6 py-3">
      <SubmitButton label={t("saveSettings")} />
    </div>
  );

  return (
    <form ref={formRef} action={formAction} noValidate>
      <UnsavedChangesGuard
        formRef={formRef}
        resetOn={state.ok ? state : undefined}
        onDirtyChange={setDirty}
      />
      <FormAlert message={state.error} stepUp={state.stepUp} />

      {state.ok && (
        <p className="border-status-success/40 bg-status-success/10 mb-4 flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
          <Check className="text-status-success size-4 shrink-0" aria-hidden />
          {t("saved")}
        </p>
      )}

      <div className="space-y-4">
        {/* The other half of the record rides along unchanged, so saving
            either tab never blanks the fields the other one shows. */}
        {section === "organisation" ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2.5 text-base">
                <IconChip icon={Building2} hue="blue" />
                {t("organisation")}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field
                name="organisation_name"
                label={t("organisationName")}
                errors={errors.organisation_name}
                hint={t("organisationNameHint")}
              >
                <Input
                  id="organisation_name"
                  name="organisation_name"
                  defaultValue={value(
                    "organisation_name",
                    general.organisation_name,
                  )}
                  required
                  maxLength={255}
                  aria-invalid={invalid("organisation_name")}
                />
              </Field>

              <Field
                name="timezone"
                label={t("timezone")}
                errors={errors.timezone}
                hint={t("timezoneHint")}
              >
                <select
                  id="timezone"
                  name="timezone"
                  className={selectClass}
                  defaultValue={value(
                    "timezone",
                    general.timezone || "Asia/Tbilisi",
                  )}
                >
                  {zones.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                name="default_language"
                label={t("defaultLanguage")}
                errors={errors.default_language}
                hint={t("defaultLanguageHint")}
              >
                {/* A list of the bureau's languages, not a box for "ka": a code
                    typed by hand could name a language the bureau has not got. */}
                <select
                  id="default_language"
                  name="default_language"
                  className={selectClass}
                  defaultValue={value(
                    "default_language",
                    general.default_language,
                  )}
                  aria-invalid={invalid("default_language")}
                >
                  {languageOptions.map((language) => (
                    <option key={language.code} value={language.code}>
                      {(locale === "ka"
                        ? language.name_ka
                        : language.name_en) || language.code}{" "}
                      ({language.code})
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                name="system_email"
                label={t("systemEmail")}
                errors={errors.system_email}
                hint={t("systemEmailHint")}
              >
                <Input
                  id="system_email"
                  name="system_email"
                  type="email"
                  defaultValue={value("system_email", general.system_email)}
                  maxLength={255}
                  aria-invalid={invalid("system_email")}
                />
              </Field>
            </CardContent>
            {saveBar}
          </Card>
        ) : (
          <>
            <input
              type="hidden"
              name="organisation_name"
              value={general.organisation_name ?? ""}
            />
            <input
              type="hidden"
              name="timezone"
              value={general.timezone || "Asia/Tbilisi"}
            />
            <input
              type="hidden"
              name="default_language"
              value={general.default_language ?? ""}
            />
            <input
              type="hidden"
              name="system_email"
              value={general.system_email ?? ""}
            />
          </>
        )}

        {section === "pricing" ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2.5 text-base">
                <IconChip icon={Coins} hue="amber" />
                {t("pricing")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                {t("pricingHint")}
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  name="due_days_standard"
                  label={t("dueDays")}
                  errors={errors.due_days_standard}
                >
                  <Input
                    id="due_days_standard"
                    name="due_days_standard"
                    inputMode="numeric"
                    defaultValue={value(
                      "due_days_standard",
                      general.due_days_standard ?? "",
                    )}
                    required
                    aria-invalid={invalid("due_days_standard")}
                  />
                </Field>
              </div>
              {/* Express and urgent are not offered any more. The API still holds their
                  factors and days, so they are sent back unchanged. */}
              {urgencies.map(({ key }) => (
                <Fragment key={key}>
                  <input
                    type="hidden"
                    name={`urgency_multiplier_${key}`}
                    value={String(general[`urgency_multiplier_${key}`] ?? "")}
                  />
                  {key !== "standard" && (
                    <input
                      type="hidden"
                      name={`due_days_${key}`}
                      value={String(general[`due_days_${key}`] ?? "")}
                    />
                  )}
                </Fragment>
              ))}
              <p className="text-muted-foreground text-xs">
                {t("dueDaysHint")}
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  name="delivery_fee"
                  label={t("courierFee", { currency: CURRENCY_SYMBOL })}
                  errors={errors.delivery_fee}
                  hint={t("courierFeeHint")}
                >
                  <Input
                    id="delivery_fee"
                    name="delivery_fee"
                    inputMode="decimal"
                    defaultValue={value("delivery_fee", general.delivery_fee)}
                    required
                    aria-invalid={invalid("delivery_fee")}
                  />
                </Field>

                <Field
                  name="default_translator_share"
                  label={t("translatorShare")}
                  errors={errors.default_translator_share}
                  hint={t("translatorShareHint")}
                >
                  <Input
                    id="default_translator_share"
                    name="default_translator_share"
                    inputMode="decimal"
                    defaultValue={value(
                      "default_translator_share",
                      sharePercent,
                    )}
                    required
                    aria-invalid={invalid("default_translator_share")}
                  />
                </Field>

                <Field
                  name="pricing_unit"
                  label={t("pricingUnit")}
                  errors={errors.pricing_unit}
                  hint={t("pricingUnitHint")}
                >
                  <select
                    id="pricing_unit"
                    name="pricing_unit"
                    className={selectClass}
                    defaultValue={value(
                      "pricing_unit",
                      general.pricing_unit ?? "pages",
                    )}
                  >
                    <option value="pages">{t("pricingUnitPages")}</option>
                    <option value="characters">
                      {t("pricingUnitCharacters")}
                    </option>
                  </select>
                </Field>

                <Field
                  name="characters_per_page"
                  label={t("charactersPerPage")}
                  errors={errors.characters_per_page}
                  hint={t("charactersPerPageHint")}
                >
                  <Input
                    id="characters_per_page"
                    name="characters_per_page"
                    inputMode="numeric"
                    defaultValue={value(
                      "characters_per_page",
                      String(general.characters_per_page ?? 1800),
                    )}
                    aria-invalid={invalid("characters_per_page")}
                  />
                </Field>
              </div>
            </CardContent>
            {saveBar}
          </Card>
        ) : (
          <>
            {urgencies.map(({ key }) => (
              <Fragment key={key}>
                <input
                  type="hidden"
                  name={`urgency_multiplier_${key}`}
                  value={String(general[`urgency_multiplier_${key}`] ?? "")}
                />
                <input
                  type="hidden"
                  name={`due_days_${key}`}
                  value={String(general[`due_days_${key}`] ?? "")}
                />
              </Fragment>
            ))}
            <input
              type="hidden"
              name="delivery_fee"
              value={general.delivery_fee ?? ""}
            />
            <input
              type="hidden"
              name="default_translator_share"
              value={sharePercent}
            />
            <input
              type="hidden"
              name="pricing_unit"
              value={general.pricing_unit ?? "pages"}
            />
            <input
              type="hidden"
              name="characters_per_page"
              value={String(general.characters_per_page ?? 1800)}
            />
          </>
        )}
      </div>
    </form>
  );
}
