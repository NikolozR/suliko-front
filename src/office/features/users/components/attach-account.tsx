"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { CircleAlert, Loader2, UserCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useMemo, useState, useTransition } from "react";

import {
  attachAccountAction,
  lookupAccountAction,
  type UserFormState,
} from "@office/features/users/actions";
import type { AccountLookup } from "@office/features/users/api";
import { guardedAction } from "@office/features/users/guarded-action";
import { Field, FormAlert, SubmitButton } from "@office/shared/components/form/fields";
import { Card, CardContent, CardHeader, CardTitle } from "@office/shared/components/ui/card";
import { Input } from "@office/shared/components/ui/input";

/**
 * Move an invitation to the sign-in the person really uses.
 *
 * An invitation made for an address stalls when the person registered on
 * suliko.ge with a phone number: Office matches the sign-in name suliko.ge
 * proved, and a number is never an address. Until this, the way out was to
 * delete them and invite the number. Here the manager types the number, sees
 * the name suliko.ge holds for it, and confirms that it is the right person:
 * the member keeps their role and access and from then on signs in as that
 * number.
 *
 * The confirmation is the point. A number is only ever attached after the
 * manager has read who it belongs to, never on the strength of typing alone.
 */
export function AttachAccount({ userId, locale }: { userId: number; locale: string }) {
  const t = useTranslations("users");
  const action = useMemo(() => guardedAction(attachAccountAction, t("callFailed")), [t]);
  const [state, formAction] = useActionState<UserFormState, FormData>(action, {});

  const [login, setLogin] = useState(state.values?.login ?? "");
  const [found, setFound] = useState<AccountLookup | null>(null);
  const [searching, startSearch] = useTransition();

  // Debounced, like the invite form's search: once the number is typed, not per key.
  useEffect(() => {
    const timer = setTimeout(() => {
      startSearch(async () => setFound(await lookupAccountAction(login, { maskName: true })));
    }, 400);
    return () => clearTimeout(timer);
  }, [login]);

  const person = found?.exists ? found : null;
  const nobody = found !== null && !found.exists && login.trim() !== "";

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-base">{t("attachTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="id" value={userId} />
          <input type="hidden" name="locale" value={locale} />
          <p className="text-sm">{t("attachBody")}</p>

          <Field name="login" label={t("attachNumber")} className="max-w-sm">
            <Input
              id="login"
              name="login"
              inputMode="tel"
              autoComplete="off"
              placeholder={t("numberPlaceholder")}
              value={login}
              onChange={(event) => setLogin(event.target.value)}
            />
          </Field>

          <div aria-live="polite" className="min-h-5 text-sm">
            {searching ? (
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Loader2 className="size-4 animate-spin" aria-hidden /> {t("attachSearching")}
              </span>
            ) : person ? (
              <span className="text-status-success flex items-start gap-1.5">
                <UserCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  {person.full_name
                    ? t("attachFound", { name: person.full_name })
                    : t("attachFoundNoName")}
                </span>
              </span>
            ) : nobody ? (
              <span className="text-status-warning flex items-start gap-1.5">
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{t("attachNobody")}</span>
              </span>
            ) : null}
          </div>

          <FormAlert message={state.error} stepUp={state.stepUp} />
          <div className="flex flex-wrap items-center gap-3">
            {/* Only once suliko.ge has named someone: nothing to confirm before. */}
            <SubmitButton
              label={person?.full_name ? t("attachConfirm", { name: person.full_name }) : t("attach")}
              icon={<UserCheck />}
              variant="outline"
              disabled={!person}
            />
            <p className="text-muted-foreground text-xs">{t("attachHint")}</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
