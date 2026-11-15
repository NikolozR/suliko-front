"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Check, CircleAlert, ShieldPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useRef } from "react";

import { grantSuperusersAction, type SuperuserFormState } from "@office/features/platform/actions";
import type { SuperuserGrantResult } from "@office/features/platform/api";
import { Field, FormAlert, SubmitButton, useFocusOnError } from "@office/shared/components/form/fields";
import { Textarea } from "@office/shared/components/ui/textarea";

/**
 * Let a list of suliko.ge accounts into the platform area.
 *
 * One sign-in per line: the email address or phone number the person uses on
 * suliko.ge. They then sign in to Suliko Office with that and their suliko.ge
 * password. The API answers every line on its own, so the result is a list of
 * who got in and who did not rather than one verdict for the lot.
 */
export function SuperuserGrantForm() {
  const t = useTranslations("platform.superusers");
  const [state, formAction] = useActionState<SuperuserFormState, FormData>(
    grantSuperusersAction,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  useFocusOnError(formRef, state);

  return (
    <form ref={formRef} action={formAction} noValidate className="space-y-3">
      <FormAlert message={state.error} stepUp={state.stepUp} />

      <Field name="identifiers" label={t("listLabel")} hint={t("listHint")}>
        <Textarea
          name="identifiers"
          rows={4}
          // A refused submit comes back with what was typed; an accepted one
          // comes back empty, ready for the next list.
          defaultValue={state.identifiers ?? ""}
          placeholder={t("listPlaceholder")}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
      </Field>

      <SubmitButton label={t("add")} icon={<ShieldPlus />} />

      {state.results && state.results.length > 0 && (
        <ul className="border-border divide-border divide-y rounded-md border text-sm">
          {state.results.map((result) => (
            <ResultLine key={result.identifier} result={result} />
          ))}
        </ul>
      )}
    </form>
  );
}

function ResultLine({ result }: { result: SuperuserGrantResult }) {
  const t = useTranslations("platform.superusers");
  const isIn = result.status === "granted" || result.status === "already";

  return (
    <li className="flex items-start gap-2 px-3 py-2">
      {isIn ? (
        <Check className="text-status-success mt-0.5 size-4 shrink-0" aria-hidden />
      ) : (
        <CircleAlert className="text-destructive mt-0.5 size-4 shrink-0" aria-hidden />
      )}
      <div className="min-w-0">
        <span className="font-medium break-all">{result.identifier}</span>
        {result.superuser?.full_name && (
          <span className="text-muted-foreground"> · {result.superuser.full_name}</span>
        )}
        <span className={isIn ? "text-muted-foreground block" : "text-destructive block"}>
          {/* The API's own sentence where it has one (a refused address, a
              clash); otherwise ours for the status. */}
          {result.detail ?? t(`result.${result.status}`)}
        </span>
        {result.password_moved_to_suliko && (
          <span className="text-status-warning block">{t("passwordMoved")}</span>
        )}
      </div>
    </li>
  );
}
