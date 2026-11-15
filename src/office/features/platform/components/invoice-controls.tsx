"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Check, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { BillingInvoice } from "@office/features/billing/api";
import { setInvoiceStatusAction, type PlatformFormState } from "@office/features/platform/actions";
import { selectClass } from "@office/shared/components/form/fields";
import { Button } from "@office/shared/components/ui/button";
import { Input } from "@office/shared/components/ui/input";
import { cn } from "@office/shared/lib/utils";

const STATUSES = ["open", "sent", "paid", "waived"] as const;

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
 * Follow one invoice by hand: open (worked out, not asked for yet), sent (asked
 * for by bank transfer), paid, or waived, with a note for what was agreed.
 * The bureau sees it once it is no longer open.
 */
export function InvoiceControls({ invoice }: { invoice: BillingInvoice }) {
  const t = useTranslations("platform.billing");
  const [state, formAction] = useActionState<PlatformFormState, FormData>(
    setInvoiceStatusAction,
    {},
  );

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={invoice.id} />
      <select
        name="status"
        aria-label={t("invoiceStatus")}
        className={cn(selectClass, "w-36")}
        defaultValue={invoice.status}
      >
        {STATUSES.map((status) => (
          <option key={status} value={status}>
            {t(`status.${status}`)}
          </option>
        ))}
      </select>
      <Input
        name="note"
        aria-label={t("note")}
        placeholder={t("note")}
        maxLength={500}
        defaultValue={invoice.note ?? ""}
        className="w-44"
      />
      <SaveButton />
      {state.error && (
        <span role="alert" className="text-destructive text-xs">
          {state.error}
        </span>
      )}
      {state.ok && !state.error && (
        <span role="status" className="text-status-success text-xs">
          {t("saved")}
        </span>
      )}
    </form>
  );
}
