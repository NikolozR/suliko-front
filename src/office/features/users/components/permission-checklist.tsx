"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { useTranslations } from "next-intl";

import type { PermissionGroup } from "@office/features/users/permission-catalogue";
import type { Permission } from "@office/shared/auth/permissions";
import { cn } from "@office/shared/lib/utils";

/**
 * The grid of access checkboxes, shared by the invite and edit forms.
 *
 * Native checkboxes named `permissions`, so the whole ticked set arrives in
 * FormData with no client state to serialise. A Radix control would hold its
 * value in React and never reach the server action — the same trap documented
 * on `selectClass` in `shared/components/form/fields.tsx`.
 *
 * Anything the CURRENT USER does not hold is rendered disabled rather than
 * hidden. Hiding it would leave an owner wondering why a box they remember
 * has vanished; disabling it says "you cannot pass on what you do not have",
 * which is the actual rule the API enforces.
 */
export function PermissionChecklist({
  groups,
  checked,
  onToggle,
  grantable,
}: {
  groups: PermissionGroup[];
  checked: ReadonlySet<Permission>;
  onToggle: (permission: Permission) => void;
  grantable: ReadonlySet<Permission>;
}) {
  const tGroup = useTranslations("permissionGroups");
  const tPerm = useTranslations("permissions");
  // Catalogue key for a permission: "orders.read" -> "orders_read".
  const label = (permission: string, fallback: string) => {
    const key = `${permission.replace(".", "_")}.label`;
    return tPerm.has(key) ? tPerm(key) : fallback;
  };
  const hint = (permission: string, fallback?: string) => {
    const key = `${permission.replace(".", "_")}.hint`;
    return tPerm.has(key) ? tPerm(key) : fallback;
  };

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <fieldset key={group.key} className="space-y-2">
          <legend className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            {tGroup.has(group.key) ? tGroup(group.key) : group.label}
          </legend>
          <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {group.options.map((option) => {
              const allowed = grantable.has(option.permission);
              return (
                <label
                  key={option.permission}
                  className={cn(
                    "flex items-start gap-2.5 text-sm",
                    allowed ? "cursor-pointer" : "cursor-not-allowed opacity-45",
                  )}
                >
                  <input
                    type="checkbox"
                    name="permissions"
                    value={option.permission}
                    checked={checked.has(option.permission)}
                    onChange={() => onToggle(option.permission)}
                    disabled={!allowed}
                    className="mt-0.5 size-4 shrink-0 accent-[var(--suliko-default-color)]"
                  />
                  <span className="space-y-0.5">
                    <span
                      className={cn(
                        "block",
                        option.ownerOnly && "text-status-warning font-medium",
                      )}
                    >
                      {label(option.permission, option.label)}
                    </span>
                    {hint(option.permission, option.hint) && (
                      <span className="text-muted-foreground block text-xs">
                        {hint(option.permission, option.hint)}
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
