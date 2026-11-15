"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { FilePlus2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { prepareInvoicesAction, type PrepareFormState } from "@office/features/platform/actions";
import { Button } from "@office/shared/components/ui/button";

function PrepareButton({ monthName }: { monthName: string }) {
  const t = useTranslations("platform.billing");
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="brand" size="sm" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <FilePlus2 />}
      {t("prepare", { month: monthName })}
    </Button>
  );
}

/**
 * Work out every bureau's invoice for the month shown. Only a month that has
 * ended is billed, and a bureau that already has an invoice for it is left
 * alone, so running this again only picks up what was missed.
 */
export function PrepareInvoicesForm({
  period,
  monthName,
}: {
  /** "2026-09", sent to the API. */
  period: string;
  /** "September 2026", shown on the button. */
  monthName: string;
}) {
  const t = useTranslations("platform.billing");
  const [state, formAction] = useActionState<PrepareFormState, FormData>(
    prepareInvoicesAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="period" value={period} />
      <PrepareButton monthName={monthName} />
      <p className="text-muted-foreground text-xs">{t("prepareNote")}</p>
      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}
      {state.result && !state.error && (
        <p role="status" className="text-sm">
          {t("prepared", {
            created: state.result.created,
            existing: state.result.existing,
            notEnded: state.result.not_ended,
            nothingDue: state.result.nothing_due,
          })}
        </p>
      )}
    </form>
  );
}
