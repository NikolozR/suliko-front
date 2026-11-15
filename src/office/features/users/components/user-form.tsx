"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { ShieldAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useRef } from "react";

import { Link } from "@office/i18n/navigation";
import { updateUserAction, type UserFormState } from "@office/features/users/actions";
import type { User } from "@office/features/users/api";
import { ASSIGNABLE_ROLES } from "@office/features/users/schema";
import {
  Field,
  FormAlert,
  SubmitButton,
  selectClass,
  useFocusOnError,
} from "@office/shared/components/form/fields";
import { UnsavedChangesGuard } from "@office/shared/components/form/unsaved-changes-guard";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@office/shared/components/ui/card";
import { Checkbox } from "@office/shared/components/ui/checkbox";
import { Input } from "@office/shared/components/ui/input";
import { Label } from "@office/shared/components/ui/label";

/**
 * Edit what this organisation decides about a member.
 *
 * Not their username (the handle the audit trail is written against), and
 * not their email or password: those belong to the person's own account,
 * shared by every organisation they are in, and only they change them.
 * People are added by invitation, never created here with a password.
 */
export function UserForm({ user }: { user: User }) {
  const t = useTranslations("common");
  const tUsers = useTranslations("users");
  const locale = useLocale();

  const [state, formAction] = useActionState<UserFormState, FormData>(updateUserAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  useFocusOnError(formRef, state);

  const value = (field: string, fallback?: string | null) =>
    state.values?.[field] ?? fallback ?? "";

  const errors = state.fieldErrors ?? {};
  const invalid = (field: keyof typeof errors) => Boolean(errors[field]?.length);

  const activeDefault = state.values ? state.values.is_active === "on" : user.is_active;

  return (
    <form ref={formRef} action={formAction} noValidate className="max-w-3xl">
      <UnsavedChangesGuard formRef={formRef} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="id" value={user.id} />

      <FormAlert message={state.error} stepUp={state.stepUp} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{tUsers("account")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field name="email_display" label={tUsers("email")}>
            <Input id="email_display" value={user.email ?? user.username} readOnly disabled />
            <p className="text-muted-foreground text-xs">{tUsers("emailIsTheirs")}</p>
          </Field>

          <Field name="full_name" label={tUsers("fullName")} errors={errors.full_name}>
            <Input
              id="full_name"
              name="full_name"
              defaultValue={value("full_name", user.full_name)}
              required
              maxLength={255}
              aria-invalid={invalid("full_name")}
            />
          </Field>

          <Field
            name="role"
            label={tUsers("role")}
            errors={errors.role}
            hint={tUsers("roleAboveHint")}
          >
            <select
              id="role"
              name="role"
              className={selectClass}
              defaultValue={value("role", user.role) || "staff"}
            >
              {ASSIGNABLE_ROLES.map((role) => (
                <option key={role} value={role}>
                  {tUsers(`roles.${role}`)}
                </option>
              ))}
            </select>
          </Field>

          <div className="flex items-center gap-2 sm:col-span-2">
            <Checkbox id="is_active" name="is_active" defaultChecked={activeDefault} />
            <Label htmlFor="is_active" className="font-normal">
              {tUsers("activeCanSignIn")}
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="text-muted-foreground flex items-start gap-3 p-4 text-sm">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>{tUsers("sessionRevokeNote")}</p>
        </CardContent>
      </Card>

      <div className="mt-4 flex items-center gap-2">
        <SubmitButton label={t("save")} />
        <Button variant="ghost" asChild>
          <Link href={`/users/${user.id}`}>{t("cancel")}</Link>
        </Button>
      </div>
    </form>
  );
}
