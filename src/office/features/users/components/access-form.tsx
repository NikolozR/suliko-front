"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useState } from "react";

import { updateUserAccessAction, type UserFormState } from "@office/features/users/actions";
import type { User } from "@office/features/users/api";
import { PermissionChecklist } from "@office/features/users/components/permission-checklist";
import type { PermissionGroup } from "@office/features/users/permission-catalogue";
import { permissionsForRole, type Permission } from "@office/shared/auth/permissions";
import { FormAlert, SubmitButton } from "@office/shared/components/form/fields";
import { Button } from "@office/shared/components/ui/button";

/**
 * Edit what one employee may do.
 *
 * Its own form rather than a section of the profile edit, for the same reason
 * the password form is separate: saving this revokes the target's live
 * sessions, and a change of email address must not do that as a side effect.
 */
export function AccessForm({
  user,
  groups,
  grantable,
  isSelf,
}: {
  user: User;
  groups: PermissionGroup[];
  grantable: readonly Permission[];
  /** The API refuses self-edits; saying so up front beats a 422. */
  isSelf: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("users");
  const tRole = useTranslations("enums.role");
  const [state, formAction] = useActionState<UserFormState, FormData>(
    updateUserAccessAction,
    {},
  );

  const [checked, setChecked] = useState<Set<Permission>>(
    () => new Set(user.permissions as Permission[]),
  );

  const held = new Set(grantable);

  function toggle(permission: Permission) {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(permission)) next.delete(permission);
      else next.add(permission);
      return next;
    });
  }

  if (isSelf) {
    return (
      <p className="text-muted-foreground text-sm">{t("cannotChangeOwnAccess")}</p>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="id" value={user.id} />

      <FormAlert message={state.error} stepUp={state.stepUp} />

      {state.ok && (
        <div
          role="status"
          className="border-status-success/30 bg-status-success/10 rounded-md border px-3 py-2 text-sm"
        >
          {t("accessSaved")}
        </div>
      )}

      <PermissionChecklist
        groups={groups}
        checked={checked}
        onToggle={toggle}
        grantable={held}
      />

      <div className="flex flex-wrap items-center gap-2">
        <SubmitButton label={t("saveAccess")} icon={<ShieldCheck />} />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            setChecked(new Set(permissionsForRole(user.role).filter((p) => held.has(p))))
          }
        >
          {t("resetToRole", { role: tRole(user.role) })}
        </Button>
      </div>
    </form>
  );
}
