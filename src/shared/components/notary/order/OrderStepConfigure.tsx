"use client";

import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  BadgeCheck,
  CalendarDays,
  Clock,
  Copy,
  FileStack,
  FileText,
  Languages,
  Plus,
  Stamp,
  Trash2,
  Truck,
  Zap,
} from "lucide-react";
import type { OrderReference } from "@/shared/utils/notaryOrderApi";
import {
  copyTypesFor,
  displayLanguageName,
  sourcesFor,
  targetsFor,
} from "@/shared/utils/notaryReferenceData";
import { GRID_COLS, MAX_PAGES, MIN_PAGES } from "@/shared/utils/notaryOrderConfig";
import { currencySymbol } from "@/shared/utils/notaryEstimate";
import type { OrderDocument, OrderState, ServiceType, StepErrors } from "./orderState";
import { firstCopyTypeFor } from "./orderState";
import {
  CheckRow,
  FieldError,
  IconHeading,
  IconTile,
  NumberField,
  SelectField,
  ToggleRow,
  splitLabel,
  type BadgeTone,
} from "./orderUi";

interface Props {
  state: OrderState;
  reference: OrderReference;
  errors: StepErrors;
  onPatchDocument: (id: number, patch: Partial<OrderDocument>) => void;
  onAddDocument: () => void;
  onRemoveDocument: (id: number) => void;
  onSetUrgency: (value: string) => void;
  onToggleHandover: (value: string) => void;
}

/** Icons keyed on the partner's own `copy_type` codes, with a safe default. */
const COPY_TYPE_ICONS: Record<string, ReactNode> = {
  original: <FileText className="h-5 w-5 text-suliko-default-color" />,
  plain: <Copy className="h-5 w-5 text-teal-500" />,
  notary_original: <Stamp className="h-5 w-5 text-amber-500" />,
  notary_copy: <FileStack className="h-5 w-5 text-amber-500" />,
  notary_certified: <BadgeCheck className="h-5 w-5 text-emerald-500" />,
};

const URGENCY_ICONS: Record<string, ReactNode> = {
  standard: <CalendarDays className="h-5 w-5 text-suliko-default-color" />,
  express: <Truck className="h-5 w-5 text-amber-500" />,
  urgent: <Zap className="h-5 w-5 text-red-500" />,
};

export default function OrderStepConfigure({
  state,
  reference,
  errors,
  onPatchDocument,
  onAddDocument,
  onRemoveDocument,
  onSetUrgency,
  onToggleHandover,
}: Props) {
  const t = useTranslations("NotaryPage.order");
  const locale = useLocale();
  const symbol = currencySymbol(reference.currency);

  // Only languages the catalogue actually publishes a pair for.
  const sourceOptions = sourcesFor(reference).map((lang) => ({
    value: lang.language_code,
    label: displayLanguageName(lang, locale),
  }));

  /**
   * Changing the source clears the target when the pair no longer exists, so a
   * document can never sit on a combination the catalogue does not publish.
   */
  const handleSourceChange = (doc: OrderDocument, value: string) => {
    const stillValid =
      doc.toLang !== "" &&
      targetsFor(reference, value).some((l) => l.language_code === doc.toLang);
    onPatchDocument(doc.id, { fromLang: value, toLang: stillValid ? doc.toLang : "" });
  };

  const handleServiceTypeChange = (doc: OrderDocument, serviceType: ServiceType) => {
    onPatchDocument(doc.id, {
      serviceType,
      copyType: firstCopyTypeFor(reference, serviceType),
    });
  };

  /** Free is reassuring, a small uplift is a nudge, a big one is a warning. */
  const badgeFor = (multiplier: number): { text: string; tone: BadgeTone } => {
    const surcharge = Math.round((multiplier - 1) * 100);
    if (surcharge <= 0) return { text: t("basePrice"), tone: "green" };
    return {
      text: t("surchargeBadge", { percent: surcharge }),
      tone: surcharge > 50 ? "red" : "amber",
    };
  };

  return (
    <div className="space-y-6">
      {state.documents.map((doc, index) => {
        const prefix = `documents.${index}`;
        const targets = doc.fromLang ? targetsFor(reference, doc.fromLang) : [];
        const copyTypes = copyTypesFor(reference, doc.serviceType);

        return (
          <div key={doc.id} className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            {/* Card header */}
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <FileText className="h-4 w-4 text-suliko-default-color" />
                {t("document")} {index + 1}
              </span>
              {state.documents.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveDocument(doc.id)}
                  aria-label={t("remove")}
                  className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-500 transition-colors hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* From · To · Document type · Pages — one row on wide screens */}
            <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SelectField
                label={t("fromLanguage")}
                placeholder={t("fromPlaceholder")}
                value={doc.fromLang}
                options={sourceOptions}
                error={errors[`${prefix}.fromLang`]}
                onChange={(value) => handleSourceChange(doc, value)}
              />
              <SelectField
                label={t("toLanguage")}
                placeholder={doc.fromLang ? t("toPlaceholder") : t("selectSourceFirst")}
                value={doc.toLang}
                disabled={!doc.fromLang}
                options={targets.map((lang) => ({
                  value: lang.language_code,
                  label: displayLanguageName(lang, locale),
                }))}
                error={errors[`${prefix}.toLang`]}
                onChange={(value) => onPatchDocument(doc.id, { toLang: value })}
              />
              <SelectField
                label={t("documentType")}
                placeholder={t("selectType")}
                value={doc.documentType === "" ? "" : String(doc.documentType)}
                options={reference.document_types.map((type) => ({
                  value: String(type.type_id),
                  label:
                    locale === "ka" && type.type_name_georgian
                      ? type.type_name_georgian
                      : type.type_name,
                }))}
                error={errors[`${prefix}.documentType`]}
                onChange={(value) =>
                  onPatchDocument(doc.id, {
                    documentType: value === "" ? "" : Number(value),
                  })
                }
              />
              <NumberField
                label={t("pages")}
                min={MIN_PAGES}
                max={MAX_PAGES}
                value={doc.pages}
                error={errors[`${prefix}.pages`]}
                onChange={(value) => onPatchDocument(doc.id, { pages: value })}
              />
            </div>

            {/* Service type — the UI split of copy_type */}
            <div className="mb-5">
              <p className="mb-2 text-sm font-medium text-foreground">{t("serviceType")}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <IconTile
                  selected={doc.serviceType === "regular"}
                  onClick={() => handleServiceTypeChange(doc, "regular")}
                  icon={<Languages className="h-5 w-5 text-suliko-default-color" />}
                  title={t("serviceRegular")}
                  caption={t("serviceRegularHint")}
                />
                <IconTile
                  selected={doc.serviceType === "notary"}
                  onClick={() => handleServiceTypeChange(doc, "notary")}
                  icon={<Stamp className="h-5 w-5 text-amber-500" />}
                  title={t("serviceNotary")}
                  caption={t("serviceNotaryHint")}
                />
              </div>
            </div>

            {/* Copy type */}
            <div className="border-t border-border pt-4">
              <p className="mb-2 text-sm font-medium text-foreground">{t("copyType")}</p>
              <div
                className={`grid gap-3 ${
                  GRID_COLS[Math.min(copyTypes.length, 3)] ?? GRID_COLS[1]
                }`}
              >
                {copyTypes.map((copyType) => (
                  <IconTile
                    key={copyType.value}
                    selected={doc.copyType === copyType.value}
                    onClick={() => onPatchDocument(doc.id, { copyType: copyType.value })}
                    icon={
                      COPY_TYPE_ICONS[copyType.value] ?? (
                        <FileText className="h-5 w-5 text-suliko-default-color" />
                      )
                    }
                    title={copyType.label}
                  />
                ))}
              </div>
              <FieldError message={errors[`${prefix}.copyType`]} />
            </div>
          </div>
        );
      })}

      {/* Add document */}
      <div className="text-center">
        <button
          type="button"
          onClick={onAddDocument}
          className="inline-flex items-center gap-2 rounded-full border border-suliko-default-color/50 bg-card px-5 py-2 text-sm font-semibold text-suliko-default-color transition-colors hover:bg-suliko-default-color/10"
        >
          <Plus className="h-4 w-4" />
          {t("addDocument")}
        </button>
        <p className="mt-2 text-xs text-muted-foreground">{t("addDocumentHint")}</p>
      </div>

      {/* Delivery speed */}
      <div className="border-t border-border pt-6">
        <IconHeading icon={<Clock className="h-5 w-5 text-suliko-default-color" />}>
          {t("urgency")}
        </IconHeading>
        <div
          className={`grid gap-3 ${
            GRID_COLS[Math.min(reference.urgency_levels.length, 3)] ?? GRID_COLS[1]
          }`}
        >
          {reference.urgency_levels.map((level) => {
            const { title, detail } = splitLabel(level.label);
            const badge = badgeFor(level.multiplier);
            return (
              <IconTile
                key={level.value}
                selected={state.urgency === level.value}
                onClick={() => onSetUrgency(level.value)}
                icon={
                  URGENCY_ICONS[level.value] ?? (
                    <Clock className="h-5 w-5 text-suliko-default-color" />
                  )
                }
                title={title}
                caption={detail}
                badge={badge.text}
                badgeTone={badge.tone}
              />
            );
          })}
        </div>
      </div>

      {/* Delivery service */}
      <div className="border-t border-border pt-6">
        <IconHeading icon={<Truck className="h-5 w-5 text-suliko-default-color" />}>
          {t("handover")}
        </IconHeading>
        <div className="space-y-0.5">
          {reference.handover_methods.map((method) => {
            const checked = state.handover.includes(method.value);
            const label =
              method.extra_cost > 0
                ? `${method.label} (+${symbol}${method.extra_cost})`
                : method.label;

            // A method that adds a charge gets a switch rather than a tick box,
            // so it never reads as a free default.
            return method.extra_cost > 0 ? (
              <ToggleRow
                key={method.value}
                checked={checked}
                onToggle={() => onToggleHandover(method.value)}
                label={label}
              />
            ) : (
              <CheckRow
                key={method.value}
                checked={checked}
                onToggle={() => onToggleHandover(method.value)}
                label={label}
              />
            );
          })}
        </div>
        <FieldError message={errors.handover} />
      </div>
    </div>
  );
}
