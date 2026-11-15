"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Check, Gift, Loader2, Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { setFreeMonthAction, type PlatformFormState } from "@office/features/platform/actions";
import { Button } from "@office/shared/components/ui/button";

function SaveButton() {
  const t = useTranslations("platform.billing");
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Check />}
      {t("save")}
    </Button>
  );
}

/**
 * "Make this month free": a box to tick for the account's current month. Ticked
 * and saved, the whole month has no fee; unticked and saved, it is billed again.
 * Only the fee is waived: the package's order limit still applies.
 */
export function FreeMonthCheck({
  tenantId,
  period,
  free,
}: {
  tenantId: number;
  /** "2026-10": the month the box is for. */
  period: string;
  free: boolean;
}) {
  const t = useTranslations("platform.billing");
  const [state, formAction] = useActionState<PlatformFormState, FormData>(setFreeMonthAction, {});

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="tenant_id" value={tenantId} />
      <input type="hidden" name="period" value={period} />
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            // A new key when the saved value changes, so the box shows what is stored.
            key={String(free)}
            type="checkbox"
            name="free"
            defaultChecked={free}
            className="size-4"
          />
          {t("makeFree")}
        </label>
        <SaveButton />
        {state.ok && !state.error && (
          <span role="status" className="text-status-success text-xs">
            {t("saved")}
          </span>
        )}
      </div>
      <p className="text-muted-foreground text-xs">{t("makeFreeNote")}</p>
      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}
    </form>
  );
}

/**
 * The same switch for one row of the months list: a month with no invoice can be
 * made free, or its free mark taken back, in one click.
 */
export function FreeMonthButton({
  tenantId,
  period,
  free,
}: {
  tenantId: number;
  period: string;
  free: boolean;
}) {
  const t = useTranslations("platform.billing");
  const [state, formAction, pending] = useActionState<PlatformFormState, FormData>(
    setFreeMonthAction,
    {},
  );

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="tenant_id" value={tenantId} />
      <input type="hidden" name="period" value={period} />
      {/* A checkbox is only sent when ticked: this is the value the click sets. */}
      <input type="hidden" name="free" value={free ? "false" : "true"} />
      <Button type="submit" variant="ghost" size="sm" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : free ? <Undo2 /> : <Gift />}
        {free ? t("takeFreeBack") : t("makeMonthFree")}
      </Button>
      {state.error && (
        <span role="alert" className="text-destructive text-xs">
          {state.error}
        </span>
      )}
    </form>
  );
}
