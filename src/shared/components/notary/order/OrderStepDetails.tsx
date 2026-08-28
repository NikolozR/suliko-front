"use client";

import { useTranslations } from "next-intl";
import { Building2, User } from "lucide-react";
import type { OrderReference } from "@/shared/utils/notaryOrderApi";
import { handoverRequiresAddress } from "@/shared/utils/notaryReferenceData";
import type { ClientType, OrderContact, OrderState, StepErrors } from "./orderState";
import { CheckTile, FieldError, FieldLabel, SectionTitle, TextField, Tile } from "./orderUi";

interface Props {
  state: OrderState;
  reference: OrderReference;
  errors: StepErrors;
  onPatchContact: (patch: Partial<OrderContact>) => void;
}

export default function OrderStepDetails({
  state,
  reference,
  errors,
  onPatchContact,
}: Props) {
  const t = useTranslations("NotaryPage.order");
  const { contact } = state;
  const isBusiness = contact.clientType === "business";
  const addressRequired = handoverRequiresAddress(reference, state.handover);

  const setClientType = (clientType: ClientType) => onPatchContact({ clientType });

  return (
    <div className="space-y-5">
      {/* Client type */}
      <div>
        <SectionTitle>{t("clientType")}</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          <Tile
            selected={!isBusiness}
            onClick={() => setClientType("individual")}
            title={t("individual")}
            icon={<User className="h-4 w-4 text-suliko-default-color" />}
          />
          <Tile
            selected={isBusiness}
            onClick={() => setClientType("business")}
            title={t("business")}
            icon={<Building2 className="h-4 w-4 text-suliko-default-color" />}
          />
        </div>
      </div>

      {/* Name / business identity */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField
          required
          label={isBusiness ? t("companyName") : t("firstName")}
          value={contact.firstName}
          error={errors.firstName}
          autoComplete={isBusiness ? "organization" : "given-name"}
          onChange={(value) => onPatchContact({ firstName: value })}
        />
        {isBusiness ? (
          /* The API has no company fields — the tax ID travels in last_name
             and is restated in the notes, which is what billing reads. */
          <TextField
            required
            label={t("businessId")}
            value={contact.businessId}
            error={errors.businessId}
            onChange={(value) => onPatchContact({ businessId: value })}
          />
        ) : (
          <TextField
            required
            label={t("lastName")}
            value={contact.lastName}
            error={errors.lastName}
            autoComplete="family-name"
            onChange={(value) => onPatchContact({ lastName: value })}
          />
        )}
      </div>

      {isBusiness && (
        <CheckTile
          checked={contact.needsInvoice}
          onToggle={() => onPatchContact({ needsInvoice: !contact.needsInvoice })}
          title={t("needsInvoice")}
        />
      )}

      {/* Contact */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField
          required
          type="email"
          label={t("email")}
          value={contact.email}
          error={errors.email}
          autoComplete="email"
          onChange={(value) => onPatchContact({ email: value })}
        />
        <TextField
          required
          type="tel"
          label={t("phone")}
          value={contact.phone}
          error={errors.phone}
          autoComplete="tel"
          placeholder="+995 5XX XXX XXX"
          onChange={(value) => onPatchContact({ phone: value })}
        />
      </div>

      {/* Address — required only when a chosen handover method needs one */}
      <TextField
        required={addressRequired}
        label={addressRequired ? t("address") : t("addressOptional")}
        value={contact.address}
        error={errors.address}
        autoComplete="street-address"
        onChange={(value) => onPatchContact({ address: value })}
      />

      {/* Notes */}
      <div>
        <FieldLabel>{t("notes")}</FieldLabel>
        <textarea
          rows={3}
          value={contact.notes}
          placeholder={t("notesPlaceholder")}
          onChange={(e) => onPatchContact({ notes: e.target.value })}
          className="w-full resize-y rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25"
        />
      </div>

      {/* Terms */}
      <div>
        <CheckTile
          checked={contact.terms}
          onToggle={() => onPatchContact({ terms: !contact.terms })}
          title={t("terms")}
        />
        <FieldError message={errors.terms} />
      </div>
    </div>
  );
}
