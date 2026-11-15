"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { ArrowUpCircle, Check, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { upgradePackageAction, type UpgradeFormState } from "@office/features/billing/actions";
import type { BillingPackage } from "@office/features/billing/api";
import { Button } from "@office/shared/components/ui/button";
import { formatMoneyString } from "@office/shared/lib/money";

function ConfirmButton() {
  const t = useTranslations("billing.upgrade");
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="brand" size="sm" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Check />}
      {t("confirm")}
    </Button>
  );
}

/**
 * Move up to a bigger package: a button, then a short summary of the terms with a
 * box to tick, then one confirmation. The package changes at once, so an account
 * that was stopped at its limit can add its next order straight away.
 */
export function UpgradePackage({
  pack,
  termsVersion,
  highlight = false,
}: {
  pack: BillingPackage;
  termsVersion: string;
  /** The account is stopped at its limit, so this is the thing to do now. */
  highlight?: boolean;
}) {
  const t = useTranslations("billing.upgrade");
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<UpgradeFormState, FormData>(upgradePackageAction, {});
  const price =
    pack.monthly_price === null
      ? ""
      : Number(pack.monthly_price) === 0
        ? t("free")
        : formatMoneyString(pack.monthly_price);

  if (state.ok) {
    return (
      <p role="status" className="text-status-success text-sm">
        {t("done", { tier: pack.tier })}
      </p>
    );
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant={highlight ? "brand" : "outline"}
        size="sm"
        onClick={() => setOpen(true)}
      >
        <ArrowUpCircle /> {t("choose")}
      </Button>
    );
  }

  return (
    <form action={formAction} className="bg-muted/40 w-full space-y-3 rounded-md border p-3 text-sm">
      <input type="hidden" name="tier" value={pack.tier} />
      <input type="hidden" name="terms_version" value={termsVersion} />
      <p className="font-medium">
        {t("heading", { tier: pack.tier, orders: pack.orders_included })}
      </p>
      <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-xs">
        <li>{t("terms.fee", { price })}</li>
        <li>{t("terms.now")}</li>
        <li>{t("terms.invoice")}</li>
        <li>{t("terms.down")}</li>
      </ul>
      <label className="flex items-start gap-2 text-xs">
        <input type="checkbox" name="accepted_terms" className="mt-0.5" required />
        <span>{t("accept")}</span>
      </label>
      {state.error && (
        <p role="alert" className="text-destructive text-xs">
          {state.error}
        </p>
      )}
      <div className="flex gap-2">
        <ConfirmButton />
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
