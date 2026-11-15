"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import {
  ChevronDown,
  Coins,
  FilePen,
  FilePlus,
  Languages,
  Mic,
  Pencil,
  Plus,
  Save,
  Stamp,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import type { CopyType, ReferenceData } from "@office/features/calculator/types";
import {
  addDocumentAction,
  quickCreateDocumentTypeAction,
  quickCreateNotaryAction,
  quickCreateTranslatorAction,
  updateDocumentAction,
  type OrderFormState,
} from "@office/features/orders/actions";
import { NotarisationFields } from "@office/features/orders/components/notarisation-fields";
import {
  copyTypeNotarises,
  normaliseCopyType,
} from "@office/features/orders/copy-types";
import type { PricingUnit } from "@office/features/orders/pricing-unit";
import type { Assignee, OrderDocument } from "@office/features/orders/types";
import { Field, selectClass } from "@office/shared/components/form/fields";
import { FormDialog } from "@office/shared/components/form/form-dialog";
import { QuickAddDialog } from "@office/shared/components/form/quick-add-dialog";
import { Button } from "@office/shared/components/ui/button";
import { Checkbox } from "@office/shared/components/ui/checkbox";
import { Input } from "@office/shared/components/ui/input";
import { Label } from "@office/shared/components/ui/label";
import { PHONE_PLACEHOLDER } from "@office/shared/lib/phone";

/**
 * Add a document to an existing order, or change one — the PHP office screen
 * let staff fix a page count or a price in place, and so does this.
 *
 * The API re-prices a document when what is translated changes (pair, type,
 * pages, copy type, notarisation), EXCEPT for a money figure sent in the same
 * request. So an edit sends only what changed (see `updateDocumentAction`),
 * and a price someone left untouched follows the new details.
 */

const pagesOf = (pageCount: string) =>
  Math.max(1, Math.floor(Number(pageCount)) || 1);

interface Props {
  orderId: number;
  /** The order's own day ("YYYY-MM-DD"): where a new interpreting line starts. */
  orderDate?: string;
  reference: ReferenceData;
  /** What the order is calculated by: its lines follow it. */
  pricingUnit: PricingUnit;
  translators: Assignee[];
  notaries: Assignee[];
  canAssignTranslators: boolean;
  canSeeCosts: boolean;
  /** Each gates the "+" next to its field — the API enforces the same permission. */
  canManageDocumentTypes: boolean;
  canCreateTranslators: boolean;
  canCreateNotaries: boolean;
}

/** A titled block of the dialog's form: one thing to decide at a time. */
function Group({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
      <h3 className="text-muted-foreground flex items-center gap-2 text-sm font-medium sm:col-span-2">
        <Icon className="size-4" aria-hidden />
        {title}
      </h3>
      {children}
    </section>
  );
}

function DocumentFields({
  state,
  document,
  orderDate,
  reference,
  pricingUnit,
  translators,
  notaries,
  canAssignTranslators,
  canSeeCosts,
  canManageDocumentTypes,
  canCreateTranslators,
  canCreateNotaries,
}: Omit<Props, "orderId"> & {
  state: OrderFormState;
  document?: OrderDocument;
}) {
  const t = useTranslations("orders");
  const tq = useTranslations("orders.quickAdd");
  const locale = useLocale();
  const errors = (state.fieldErrors ?? {}) as Record<
    string,
    string[] | undefined
  >;
  const echoed = (field: string, fallback: string) =>
    state.values?.[field] ?? fallback;

  // Interpreting: minutes instead of pages, and no document type, copy type or notary.
  const [oral, setOral] = useState(
    echoed("service_type", document?.service_type ?? "written") === "oral",
  );
  // An order calculated by characters asks for them as well as pages.
  const byCharacters = pricingUnit === "characters";
  const [characterCount, setCharacterCount] = useState(
    echoed(
      "character_count",
      document?.character_count ? String(document.character_count) : "",
    ),
  );
  // Interpreting only: where and when. A new line starts on the order's own day.
  const [place, setPlace] = useState(
    echoed("interpreting_place", document?.interpreting_place ?? ""),
  );
  const [placeDate, setPlaceDate] = useState(
    echoed(
      "interpreting_date",
      document ? (document.interpreting_date ?? "") : (orderDate ?? ""),
    ),
  );
  const [placeTime, setPlaceTime] = useState(
    echoed(
      "interpreting_time",
      (document?.interpreting_time ?? "").slice(0, 5),
    ),
  );
  const [source, setSource] = useState(
    echoed("source_language", document?.source_language ?? ""),
  );
  const [target, setTarget] = useState(
    echoed("target_language", document?.target_language ?? ""),
  );
  const [copyType, setCopyType] = useState<CopyType>(
    (state.values?.copy_type as CopyType | undefined) ??
      (document
        ? normaliseCopyType(document.copy_type, document.is_notarized)
        : "original"),
  );
  const notarised = !oral && copyTypeNotarises(copyType);
  const [documentTypeId, setDocumentTypeId] = useState(
    echoed("document_type_id", String(document?.document_type_id ?? "")),
  );
  const [translatorId, setTranslatorId] = useState(
    echoed("translator_id", String(document?.translator_id ?? "")),
  );
  const [notaryId, setNotaryId] = useState(
    echoed("notary_id", String(document?.notary_id ?? "")),
  );
  // Clearable while typing — restored to at least 1 on blur, not on every
  // keystroke, or a backspace to retype the count never gets past "1".
  const [pageCount, setPageCount] = useState(
    echoed("page_count", String(document?.page_count ?? 1)),
  );

  // Extended in place when the "+" beside a field creates a new record.
  const [documentTypeOptions, setDocumentTypeOptions] = useState(
    reference.document_types,
  );
  const [translatorOptions, setTranslatorOptions] = useState(translators);
  const [notaryOptions, setNotaryOptions] = useState(notaries);
  // A changing `key` remounts the dialog on every open, so a failed attempt's
  // error does not linger into the next one — see `QuickAddDialog`'s own note.
  const [docTypeAddOpen, setDocTypeAddOpen] = useState(false);
  const [docTypeAddNonce, setDocTypeAddNonce] = useState(0);
  const [translatorAddOpen, setTranslatorAddOpen] = useState(false);
  const [translatorAddNonce, setTranslatorAddNonce] = useState(0);
  const [notaryAddOpen, setNotaryAddOpen] = useState(false);
  const [notaryAddNonce, setNotaryAddNonce] = useState(0);

  // The price overrides stay folded unless there is something in them (an edit
  // of a document with a manual price) or something wrong with them.
  const hasOverride =
    Boolean(echoed("price", document?.price ?? "")) ||
    Boolean(echoed("translator_cost", document?.translator_cost ?? "")) ||
    Boolean(echoed("notary_cost", document?.notary_cost ?? "")) ||
    Boolean(errors.price || errors.translator_cost || errors.notary_cost);

  const nameOf = (item: { name_en: string; name_ka: string }) =>
    locale === "ka"
      ? item.name_ka || item.name_en
      : item.name_en || item.name_ka;

  // Every active language, not only pairs with a configured rate — same
  // reasoning as the order builder. Whatever the document already has is
  // included regardless, so an edit never loses a language its own pair has
  // since gone inactive.
  const sources = reference.languages.filter(
    (l) => l.code === source || l.code === document?.source_language,
  );
  const targets = reference.languages.filter(
    (l) => l.code !== source || l.code === target,
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <input
        type="hidden"
        name="service_type"
        value={oral ? "oral" : "written"}
      />
      <div className="flex items-center gap-2 sm:col-span-2">
        <Checkbox
          id="oral"
          checked={oral}
          onCheckedChange={(on) => setOral(on === true)}
        />
        <Label htmlFor="oral" className="font-normal">
          {t("oralLabel")}
        </Label>
      </div>
      <Group icon={Languages} title={t("documentDialog.groupDocument")}>
        <Field
          name="source_language"
          label={t("from")}
          errors={errors.source_language}
          required
        >
          <select
            id="source_language"
            name="source_language"
            className={selectClass}
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              setTarget("");
            }}
          >
            <option value="">–</option>
            {sources.map((l) => (
              <option key={l.code} value={l.code}>
                {nameOf(l)}
              </option>
            ))}
          </select>
        </Field>

        <Field
          name="target_language"
          label={t("to")}
          errors={errors.target_language}
          required
        >
          <select
            id="target_language"
            name="target_language"
            className={selectClass}
            value={target}
            disabled={!source}
            onChange={(e) => setTarget(e.target.value)}
          >
            <option value="">{source ? "–" : t("pickSourceFirst")}</option>
            {targets.map((l) => (
              <option key={l.code} value={l.code}>
                {nameOf(l)}
              </option>
            ))}
          </select>
        </Field>

        {!oral && (
          <Field
            name="document_type_id"
            label={t("documentType")}
            errors={errors.document_type_id}
            required
          >
            <div className="flex gap-1.5">
              <select
                id="document_type_id"
                name="document_type_id"
                className={selectClass}
                value={documentTypeId}
                onChange={(e) => setDocumentTypeId(e.target.value)}
              >
                <option value="">–</option>
                {documentTypeOptions.map((type) => (
                  <option key={type.id} value={type.id}>
                    {nameOf(type)}
                  </option>
                ))}
              </select>
              {canManageDocumentTypes && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  aria-label={t("addDocumentType")}
                  title={t("addDocumentType")}
                  onClick={() => {
                    setDocTypeAddNonce((n) => n + 1);
                    setDocTypeAddOpen(true);
                  }}
                >
                  <Plus />
                </Button>
              )}
            </div>
          </Field>
        )}

        {byCharacters && !oral && (
          <Field
            name="character_count"
            label={t("characters")}
            errors={errors.character_count}
            hint={t("charactersHint", {
              count: reference.characters_per_page ?? 1800,
            })}
            required
          >
            <Input
              id="character_count"
              name="character_count"
              inputMode="numeric"
              value={characterCount}
              onChange={(e) =>
                setCharacterCount(e.target.value.replace(/[^\d\s]/g, ""))
              }
            />
          </Field>
        )}

        {/* Calculated by characters, the pages are only the notary's: asked for
          where there is a notary fee, and carried quietly otherwise. */}
        {oral || !byCharacters || notarised ? (
          <Field
            name="page_count"
            label={
              oral
                ? t("minutes")
                : byCharacters
                  ? t("pagesForNotary")
                  : t("pages")
            }
            errors={errors.page_count}
            required
          >
            <Input
              id="page_count"
              name="page_count"
              type="number"
              inputMode="numeric"
              min={1}
              max={10000}
              value={pageCount}
              onChange={(e) => setPageCount(e.target.value)}
              onBlur={() => setPageCount(String(pagesOf(pageCount)))}
            />
          </Field>
        ) : (
          <input
            type="hidden"
            name="page_count"
            value={String(pagesOf(pageCount))}
          />
        )}

        {/* Read by presence, like a native checkbox's FormData entry, so it
          must be absent — not empty — when the document is not notarised. */}
        {notarised && <input type="hidden" name="is_notarized" value="on" />}
      </Group>
      {oral && (
        <Group icon={Mic} title={t("documentDialog.groupInterpreting")}>
          {/* Where and when the interpreting takes place. All optional; the price
          does not depend on it. */}
          <>
            <Field
              name="interpreting_place"
              label={t("placeLabel")}
              errors={errors.interpreting_place}
              className="sm:col-span-2"
            >
              <Input
                id="interpreting_place"
                name="interpreting_place"
                maxLength={500}
                placeholder={t("placePlaceholder")}
                value={place}
                onChange={(e) => setPlace(e.target.value)}
              />
            </Field>
            <Field
              name="interpreting_date"
              label={t("placeDate")}
              errors={errors.interpreting_date}
            >
              <Input
                id="interpreting_date"
                name="interpreting_date"
                type="date"
                value={placeDate}
                onChange={(e) => setPlaceDate(e.target.value)}
              />
            </Field>
            <Field
              name="interpreting_time"
              label={t("placeTime")}
              errors={errors.interpreting_time}
            >
              <Input
                id="interpreting_time"
                name="interpreting_time"
                type="time"
                value={placeTime}
                onChange={(e) => setPlaceTime(e.target.value)}
              />
            </Field>
          </>
        </Group>
      )}
      {!oral && (
        <Group icon={Stamp} title={t("documentDialog.groupNotary")}>
          {/* Notarisation first: it decides which copy types exist. */}
          <NotarisationFields
            idPrefix="document"
            name="copy_type"
            copyType={copyType}
            onChange={setCopyType}
          />
          <Field name="notary_id" label={t("notary")} errors={errors.notary_id}>
            <div className="flex gap-1.5">
              <select
                id="notary_id"
                // No notarisation, no notary: a disabled select posts nothing.
                name="notary_id"
                className={selectClass}
                disabled={!notarised}
                value={notarised ? notaryId : ""}
                onChange={(e) => setNotaryId(e.target.value)}
              >
                <option value="">
                  {notarised ? t("unassigned") : t("notNotarised")}
                </option>
                {notaryOptions.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
              {canCreateNotaries && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  aria-label={t("addNotary")}
                  title={t("addNotary")}
                  disabled={!notarised}
                  onClick={() => {
                    setNotaryAddNonce((n) => n + 1);
                    setNotaryAddOpen(true);
                  }}
                >
                  <Plus />
                </Button>
              )}
            </div>
          </Field>
        </Group>
      )}
      {(canAssignTranslators || (document?.translator_id ?? false)) && (
        <Group icon={UserRound} title={t("documentDialog.groupTeam")}>
          {/* Not shown is not "unassigned": without this an edit by someone who
          cannot assign translators would clear the one already there. */}
          {!canAssignTranslators && document?.translator_id && (
            <input
              type="hidden"
              name="translator_id"
              value={document.translator_id}
            />
          )}
          {canAssignTranslators && (
            <Field
              name="translator_id"
              label={t("translator")}
              errors={errors.translator_id}
            >
              <div className="flex gap-1.5">
                <select
                  id="translator_id"
                  name="translator_id"
                  className={selectClass}
                  value={translatorId}
                  onChange={(e) => setTranslatorId(e.target.value)}
                >
                  <option value="">{t("unassigned")}</option>
                  {translatorOptions.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>
                {canCreateTranslators && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    aria-label={t("addTranslator")}
                    title={t("addTranslator")}
                    onClick={() => {
                      setTranslatorAddNonce((n) => n + 1);
                      setTranslatorAddOpen(true);
                    }}
                  >
                    <Plus />
                  </Button>
                )}
              </div>
            </Field>
          )}
        </Group>
      )}
      <details
        className="group bg-muted/30 rounded-lg border sm:col-span-2"
        open={hasOverride}
      >
        <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm font-medium">
          <Coins className="text-hue-amber-ink size-4" aria-hidden />
          {t("documentDialog.groupPrice")}
          <ChevronDown
            className="text-muted-foreground ml-auto size-4 transition-transform group-open:rotate-180"
            aria-hidden
          />
        </summary>
        <div className="px-3 pb-3">
          <div className="bg-muted/40 grid gap-3 rounded-md p-3 sm:col-span-2 sm:grid-cols-3">
            <Field
              name="price"
              label={t("priceOverride")}
              errors={errors.price}
            >
              <Input
                id="price"
                name="price"
                inputMode="decimal"
                defaultValue={echoed("price", document?.price ?? "")}
              />
            </Field>
            {canSeeCosts && canAssignTranslators && (
              <Field
                name="translator_cost"
                label={t("translatorCostOverride")}
                errors={errors.translator_cost}
              >
                <Input
                  id="translator_cost"
                  name="translator_cost"
                  inputMode="decimal"
                  defaultValue={echoed(
                    "translator_cost",
                    document?.translator_cost ?? "",
                  )}
                />
              </Field>
            )}
            {canSeeCosts && notarised && (
              <Field
                name="notary_cost"
                label={t("notaryCostOverride")}
                errors={errors.notary_cost}
              >
                <Input
                  id="notary_cost"
                  name="notary_cost"
                  inputMode="decimal"
                  defaultValue={echoed(
                    "notary_cost",
                    document?.notary_cost ?? "",
                  )}
                />
              </Field>
            )}
            <p className="text-muted-foreground text-xs sm:col-span-3">
              {document ? t("documentDialog.editHint") : t("overrideHint")}
            </p>
          </div>
        </div>
      </details>
      {canManageDocumentTypes && (
        <QuickAddDialog
          key={`doc-type-${docTypeAddNonce}`}
          open={docTypeAddOpen}
          onOpenChange={setDocTypeAddOpen}
          title={tq("documentTypeTitle")}
          description={tq("documentTypeDescription")}
          action={quickCreateDocumentTypeAction}
          onCreated={(type) => {
            setDocumentTypeOptions((current) => [
              ...current,
              {
                id: type.id,
                name_en: type.name_en,
                name_ka: type.name_ka,
                price_multiplier: type.price_multiplier,
              },
            ]);
            setDocumentTypeId(String(type.id));
          }}
        >
          {(dialogState) => {
            const fieldErrors = dialogState.fieldErrors ?? {};
            return (
              <>
                <Field
                  name="dt_name_ka"
                  label={tq("nameKa")}
                  errors={fieldErrors.name_ka}
                >
                  <Input
                    id="dt_name_ka"
                    name="name_ka"
                    autoFocus
                    required
                    maxLength={255}
                    defaultValue={dialogState.values?.name_ka}
                  />
                </Field>
                <Field
                  name="dt_name_en"
                  label={tq("nameEn")}
                  errors={fieldErrors.name_en}
                >
                  <Input
                    id="dt_name_en"
                    name="name_en"
                    required
                    maxLength={255}
                    defaultValue={dialogState.values?.name_en}
                  />
                </Field>
              </>
            );
          }}
        </QuickAddDialog>
      )}

      {canCreateTranslators && (
        <QuickAddDialog
          key={`translator-${translatorAddNonce}`}
          open={translatorAddOpen}
          onOpenChange={setTranslatorAddOpen}
          title={tq("translatorTitle")}
          description={tq("translatorDescription")}
          action={quickCreateTranslatorAction}
          onCreated={(person) => {
            setTranslatorOptions((current) => [...current, person]);
            setTranslatorId(String(person.id));
          }}
        >
          {(dialogState) => {
            const fieldErrors = dialogState.fieldErrors ?? {};
            return (
              <>
                <Field
                  name="tr_name"
                  label={tq("translatorName")}
                  errors={fieldErrors.name}
                >
                  <Input
                    id="tr_name"
                    name="name"
                    autoFocus
                    required
                    maxLength={255}
                    defaultValue={dialogState.values?.name}
                  />
                </Field>
                <Field
                  name="tr_phone"
                  label={tq("phone")}
                  errors={fieldErrors.phone}
                >
                  <Input
                    id="tr_phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="off"
                    placeholder={PHONE_PLACEHOLDER}
                    defaultValue={dialogState.values?.phone}
                  />
                </Field>
                <Field
                  name="tr_email"
                  label={tq("email")}
                  errors={fieldErrors.email}
                >
                  <Input
                    id="tr_email"
                    name="email"
                    type="email"
                    defaultValue={dialogState.values?.email}
                  />
                </Field>
                <Field
                  name="tr_default_rate"
                  label={tq("defaultRate")}
                  errors={fieldErrors.default_rate}
                  hint={tq("defaultRateHint")}
                >
                  <Input
                    id="tr_default_rate"
                    name="default_rate"
                    inputMode="decimal"
                    defaultValue={dialogState.values?.default_rate}
                  />
                </Field>
              </>
            );
          }}
        </QuickAddDialog>
      )}

      {canCreateNotaries && (
        <QuickAddDialog
          key={`notary-${notaryAddNonce}`}
          open={notaryAddOpen}
          onOpenChange={setNotaryAddOpen}
          title={tq("notaryTitle")}
          description={tq("notaryDescription")}
          action={quickCreateNotaryAction}
          onCreated={(person) => {
            setNotaryOptions((current) => [...current, person]);
            setNotaryId(String(person.id));
          }}
        >
          {(dialogState) => {
            const fieldErrors = dialogState.fieldErrors ?? {};
            return (
              <>
                <Field
                  name="nt_name"
                  label={tq("notaryName")}
                  errors={fieldErrors.name}
                >
                  <Input
                    id="nt_name"
                    name="name"
                    autoFocus
                    required
                    maxLength={255}
                    defaultValue={dialogState.values?.name}
                  />
                </Field>
                <Field
                  name="nt_phone"
                  label={tq("phone")}
                  errors={fieldErrors.phone}
                >
                  <Input
                    id="nt_phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="off"
                    placeholder={PHONE_PLACEHOLDER}
                    defaultValue={dialogState.values?.phone}
                  />
                </Field>
                <Field
                  name="nt_email"
                  label={tq("email")}
                  errors={fieldErrors.email}
                >
                  <Input
                    id="nt_email"
                    name="email"
                    type="email"
                    defaultValue={dialogState.values?.email}
                  />
                </Field>
              </>
            );
          }}
        </QuickAddDialog>
      )}
    </div>
  );
}

export function AddDocumentDialog(props: Props) {
  const t = useTranslations("orders");
  return (
    <FormDialog<OrderFormState>
      wide
      trigger={
        <Button variant="outline" size="sm">
          <Plus /> {t("addDocument")}
        </Button>
      }
      title={t("documentDialog.addTitle")}
      description={t("documentDialog.description")}
      icon={FilePlus}
      hue="blue"
      action={addDocumentAction}
      submitLabel={t("documentDialog.add")}
      submitIcon={<Plus />}
    >
      {(state) => (
        <>
          <input type="hidden" name="order_id" value={props.orderId} />
          <input type="hidden" name="pricing_unit" value={props.pricingUnit} />
          <DocumentFields {...props} state={state} />
        </>
      )}
    </FormDialog>
  );
}

export function EditDocumentDialog({
  document,
  ...props
}: Props & { document: OrderDocument }) {
  const t = useTranslations("orders");
  // What the form opened with; the action sends only fields that differ.
  const original = JSON.stringify({
    service_type: document.service_type ?? "written",
    document_type_id: document.document_type_id,
    source_language: document.source_language,
    target_language: document.target_language,
    page_count: document.page_count,
    character_count: document.character_count ?? null,
    // Null, not absent: an untouched empty place is then not seen as a change.
    interpreting_place: document.interpreting_place ?? null,
    interpreting_date: document.interpreting_date ?? null,
    interpreting_time: document.interpreting_time
      ? document.interpreting_time.slice(0, 5)
      : null,
    // As the form shows it, so an untouched save is not seen as a change.
    copy_type: normaliseCopyType(document.copy_type, document.is_notarized),
    is_notarized: document.is_notarized,
    translator_id: document.translator_id,
    notary_id: document.notary_id,
    price: document.price,
    translator_cost: document.translator_cost,
    notary_cost: document.notary_cost,
  });

  return (
    <FormDialog<OrderFormState>
      wide
      trigger={
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("detail.editDocument")}
          title={t("detail.editDocument")}
        >
          <Pencil />
        </Button>
      }
      title={t("documentDialog.editTitle")}
      description={t("documentDialog.description")}
      icon={FilePen}
      hue="blue"
      action={updateDocumentAction}
      submitLabel={t("documentDialog.save")}
      submitIcon={<Save />}
    >
      {(state) => (
        <>
          <input type="hidden" name="order_id" value={props.orderId} />
          <input type="hidden" name="document_id" value={document.id} />
          <input type="hidden" name="original" value={original} />
          <input type="hidden" name="pricing_unit" value={props.pricingUnit} />
          <DocumentFields {...props} document={document} state={state} />
        </>
      )}
    </FormDialog>
  );
}
