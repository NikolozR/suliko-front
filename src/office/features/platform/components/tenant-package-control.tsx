"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Check, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { BillingPackage } from "@office/features/billing/api";
import { setTenantPackageAction, type PlatformFormState } from "@office/features/platform/actions";
import { selectClass } from "@office/shared/components/form/fields";
import { Button } from "@office/shared/components/ui/button";
import { Label } from "@office/shared/components/ui/label";

function SaveButton() {
  const t = useTranslations("platform.billing");
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="brand" size="sm" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Check />}
      {t("save")}
    </Button>
  );
}

/**
 * Which order package a bureau is on. Only a superuser can change it, whatever
 * package it is on now: the bureau's own Billing page has no such control.
 */
export function TenantPackageControl({
  tenantId,
  tier,
  packages,
}: {
  tenantId: number;
  tier: number;
  packages: BillingPackage[];
}) {
  const t = useTranslations("platform.billing");
  const [state, formAction] = useActionState<PlatformFormState, FormData>(
    setTenantPackageAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="tenant_id" value={tenantId} />
      <div className="space-y-1.5">
        <Label htmlFor="package-tier">{t("package")}</Label>
        <select id="package-tier" name="tier" className={selectClass} defaultValue={String(tier)}>
          {packages.map((pack) => (
            <option key={pack.tier} value={pack.tier}>
              {t("packageOption", { tier: pack.tier, included: pack.orders_included })}
            </option>
          ))}
        </select>
      </div>
      <p className="text-muted-foreground text-xs">{t("tenantNote")}</p>
      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}
      <div className="flex items-center gap-3">
        <SaveButton />
        {state.ok && !state.error && (
          <span role="status" className="text-status-success text-xs">
            {t("saved")}
          </span>
        )}
      </div>
    </form>
  );
}
