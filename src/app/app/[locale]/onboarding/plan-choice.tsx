"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { ArrowRight, Check, Loader2, Minus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { type AuthFormState, choosePlanAction } from "@office/shared/auth/actions";
import { type Plan, PLANS } from "@office/shared/auth/plans";
import { Button } from "@office/shared/components/ui/button";
import { cn } from "@office/shared/lib/utils";

function SubmitButton({ label, disabled }: { label?: string; disabled?: boolean }) {
  const t = useTranslations("onboarding");
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="brand" size="lg" disabled={pending || disabled}>
      {pending ? <Loader2 className="animate-spin" /> : <ArrowRight />}
      {label ?? t("planSubmit")}
    </Button>
  );
}

/**
 * The plan cards.
 *
 * Native radio inputs rather than a Radix component, deliberately: a Radix
 * trigger holds its value in React state and never reaches FormData, so the
 * server action would receive `undefined`. The same note is on `selectClass`
 * in `shared/components/form/fields.tsx`.
 */
/**
 * Also the Settings → Plan tab: pass the plan in force as `current` and where
 * to come back to as `next`. On onboarding neither is set.
 */
export function PlanChoice({
  current,
  next,
  submitLabel,
  note,
}: {
  current?: Plan;
  next?: string;
  submitLabel?: string;
  note?: string;
} = {}) {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const [state, formAction] = useActionState<AuthFormState, FormData>(choosePlanAction, {});
  const [selected, setSelected] = useState<Plan>(current ?? "freelancer");

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      {next && <input type="hidden" name="next" value={next} />}

      {state.error && (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
        >
          {state.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {PLANS.map((plan) => {
          const included = t.raw(`plans.${plan}.included`) as string[];
          const excluded = t.raw(`plans.${plan}.excluded`) as string[];
          const isSelected = selected === plan;

          return (
            <label
              key={plan}
              className={cn(
                "flex cursor-pointer flex-col gap-3 rounded-lg border p-5 transition-colors",
                isSelected
                  ? "border-suliko-default-color bg-suliko-default-color/[0.06]"
                  : "border-border hover:bg-muted/50",
              )}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="plan"
                  value={plan}
                  checked={isSelected}
                  onChange={() => setSelected(plan)}
                  className="mt-1 size-4 shrink-0 accent-[var(--suliko-default-color)]"
                />
                <div className="space-y-1">
                  <p className="font-semibold">{t(`plans.${plan}.name`)}</p>
                  <p className="text-muted-foreground text-xs">{t(`plans.${plan}.tagline`)}</p>
                </div>
              </div>

              <ul className="space-y-1.5">
                {included.map((line) => (
                  <li key={line} className="flex gap-2 text-xs">
                    <Check className="text-status-success mt-0.5 size-3.5 shrink-0" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
                {excluded.map((line) => (
                  <li key={line} className="text-muted-foreground flex gap-2 text-xs">
                    <Minus className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </label>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton label={submitLabel} disabled={current !== undefined && selected === current} />
        <p className="text-muted-foreground text-xs">{note ?? t("planChangeLater")}</p>
      </div>
    </form>
  );
}
