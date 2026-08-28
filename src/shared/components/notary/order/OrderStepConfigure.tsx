"use client";

import { useLocale, useTranslations } from "next-intl";
import { FileText, Plus, Trash2, Truck, Zap } from "lucide-react";
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
  CheckTile,
  FieldError,
  NumberField,
  SectionTitle,
  SelectField,
  Tile,
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

  return (
    <div className="space-y-6">
      {state.documents.map((doc, index) => {
        const prefix = `documents.${index}`;
        const targets = doc.fromLang ? targetsFor(reference, doc.fromLang) : [];
        const copyTypes = copyTypesFor(reference, doc.serviceType);

        return (
          <div
            key={doc.id}
            className="rounded-2xl border border-border bg-muted/30 p-4 space-y-4"
          >
            {/* Card header */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <FileText className="h-4 w-4 text-suliko-default-color" />
                {t("document")} #{index + 1}
              </span>
              {state.documents.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveDocument(doc.id)}
                  className="flex items-center gap-1 text-xs text-red-500 transition-colors hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t("remove")}
                </button>
              )}
            </div>

            {/* Languages */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SelectField
                required
                label={t("fromLanguage")}
                placeholder={t("selectLanguage")}
                value={doc.fromLang}
                options={sourceOptions}
                error={errors[`${prefix}.fromLang`]}
                onChange={(value) => handleSourceChange(doc, value)}
              />
              <SelectField
                required
                label={t("toLanguage")}
                placeholder={doc.fromLang ? t("selectLanguage") : t("selectSourceFirst")}
                value={doc.toLang}
                disabled={!doc.fromLang}
                options={targets.map((lang) => ({
                  value: lang.language_code,
                  label: displayLanguageName(lang, locale),
                }))}
                error={errors[`${prefix}.toLang`]}
                onChange={(value) => onPatchDocument(doc.id, { toLang: value })}
              />
            </div>

            {/* Document type + pages */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SelectField
                required
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
                required
                label={t("pages")}
                min={MIN_PAGES}
                max={MAX_PAGES}
                value={doc.pages}
                error={errors[`${prefix}.pages`]}
                onChange={(value) => onPatchDocument(doc.id, { pages: value })}
              />
            </div>

            {/* Service type — the UI split of copy_type */}
            <div>
              <SectionTitle>{t("serviceType")}</SectionTitle>
              <div className="grid grid-cols-2 gap-2">
                <Tile
                  selected={doc.serviceType === "regular"}
                  onClick={() => handleServiceTypeChange(doc, "regular")}
                  title={t("serviceRegular")}
                  subtitle={t("serviceRegularHint")}
                />
                <Tile
                  selected={doc.serviceType === "notary"}
                  onClick={() => handleServiceTypeChange(doc, "notary")}
                  title={t("serviceNotary")}
                  subtitle={t("serviceNotaryHint")}
                />
              </div>
            </div>

            {/* Copy type */}
            <div>
              <SectionTitle>{t("copyType")}</SectionTitle>
              <div
                className={`grid gap-2 ${GRID_COLS[Math.min(copyTypes.length, 3)] ?? GRID_COLS[1]}`}
              >
                {copyTypes.map((copyType) => (
                  <Tile
                    key={copyType.value}
                    selected={doc.copyType === copyType.value}
                    onClick={() => onPatchDocument(doc.id, { copyType: copyType.value })}
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
      <button
        type="button"
        onClick={onAddDocument}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-suliko-default-color/50 hover:text-suliko-default-color"
      >
        <Plus className="h-4 w-4" />
        {t("addDocument")}
      </button>

      {/* Delivery speed */}
      <div>
        <SectionTitle hint={t("urgencyHint")}>
          <span className="flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-suliko-default-color" />
            {t("urgency")}
          </span>
        </SectionTitle>
        <div
          className={`grid gap-2 ${
            GRID_COLS[Math.min(reference.urgency_levels.length, 3)] ?? GRID_COLS[1]
          }`}
        >
          {reference.urgency_levels.map((level) => {
            const surcharge = Math.round((level.multiplier - 1) * 100);
            return (
              <Tile
                key={level.value}
                selected={state.urgency === level.value}
                onClick={() => onSetUrgency(level.value)}
                title={level.label}
                badge={surcharge > 0 ? `+${surcharge}%` : undefined}
              />
            );
          })}
        </div>
      </div>

      {/* Handover */}
      <div>
        <SectionTitle hint={t("handoverHint")}>
          <span className="flex items-center gap-1.5">
            <Truck className="h-4 w-4 text-suliko-default-color" />
            {t("handover")}
          </span>
        </SectionTitle>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {reference.handover_methods.map((method) => (
            <CheckTile
              key={method.value}
              checked={state.handover.includes(method.value)}
              onToggle={() => onToggleHandover(method.value)}
              title={method.label}
              badge={
                method.extra_cost > 0
                  ? `+${method.extra_cost} ${currencySymbol(reference.currency)}`
                  : undefined
              }
            />
          ))}
        </div>
        <FieldError message={errors.handover} />
      </div>
    </div>
  );
}
