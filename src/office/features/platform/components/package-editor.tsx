"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Check, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { BillingPackage } from "@office/features/billing/api";
import { editPackageAction, type PlatformFormState } from "@office/features/platform/actions";
import { Button } from "@office/shared/components/ui/button";
import { Input } from "@office/shared/components/ui/input";
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

/** One package: how many orders its fee covers, and the fee. */
function PackageForm({ pack }: { pack: BillingPackage }) {
  const t = useTranslations("platform.billing");
  const [state, formAction] = useActionState<PlatformFormState, FormData>(editPackageAction, {});
  const id = `${pack.audience}-${pack.tier}`;

  return (
    <form action={formAction} className="space-y-3 rounded-lg border p-3">
      <input type="hidden" name="audience" value={pack.audience} />
      <input type="hidden" name="tier" value={pack.tier} />
      <h4 className="font-semibold">{t("packageName", { tier: pack.tier })}</h4>

      <div className="space-y-1.5">
        <Label htmlFor={`included-${id}`}>{t("ordersIncluded")}</Label>
        <Input
          id={`included-${id}`}
          name="orders_included"
          type="number"
          inputMode="numeric"
          min={1}
          max={100000}
          required
          defaultValue={pack.orders_included}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`price-${id}`}>{t("monthlyPrice")}</Label>
        <Input
          id={`price-${id}`}
          name="monthly_price"
          inputMode="decimal"
          placeholder={t("noPrice")}
          defaultValue={pack.monthly_price ?? ""}
        />
        <p className="text-muted-foreground text-xs">{t("monthlyPriceHint")}</p>
      </div>

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

/**
 * The six packages: three for bureaus and three for freelancers, each set the
 * same for everyone of its kind. A change applies from now on.
 */
export function PackageEditor({ packages }: { packages: BillingPackage[] }) {
  const t = useTranslations("platform.billing");
  return (
    <div className="space-y-6">
      {(["bureau", "freelancer"] as const).map((audience) => (
        <div key={audience} className="space-y-3">
          <h3 className="text-sm font-semibold">{t(`audience.${audience}`)}</h3>
          <div className="grid gap-4 lg:grid-cols-3">
            {packages
              .filter((pack) => pack.audience === audience)
              .map((pack) => (
                <PackageForm
                  key={`${pack.audience}-${pack.tier}-${pack.orders_included}-${pack.monthly_price}`}
                  pack={pack}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
