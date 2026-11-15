// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
/**
 * Permission model.
 *
 * Implements docs/03-SECURITY-AND-TENANCY.md §3. Roles are named bundles of
 * permission strings; code checks permissions, never roles. That is what lets
 * `manager` and `staff` actually differ (in the PHP app they are declared but
 * functionally identical, which is the gap this replaces).
 *
 * ## This file is UX, not security
 *
 * Everything here runs in the browser or in a Server Component, both of which
 * the user controls or can read. It exists to hide buttons and routes the user
 * cannot use. **The backend re-checks every permission on every request.**
 * A missing check here is a cosmetic bug; a missing check on the server is a
 * vulnerability.
 */

export const PERMISSIONS = [
  // Orders
  "orders.read",
  "orders.write",
  "orders.delete",
  "orders.change_status",

  // Directories
  "clients.read",
  "clients.write",
  "translators.read",
  "translators.write",
  "notaries.read",
  "notaries.write",

  // Money
  "finance.read",
  "finance.record_payment",
  "finance.refund",
  "finance.transfer", // outbound bank transfer — always step-up 2FA
  "finance.expenses",

  // Reporting. `reports.profit` is split out so staff can see revenue
  // without seeing margins.
  "reports.read",
  "reports.profit",

  // Administration. `users.invite` is the smaller half of `users.manage`:
  // invite people up to your own role, send an invitation again, and see the
  // members at or below your rank, read-only. `users.manage` implies it.
  "users.invite",
  "users.manage",
  "settings.manage",
  "apikeys.manage",
  "cms.manage",

  // Tenant-level
  "tenant.manage",
  "tenant.billing",

  // Platform-level (superuser only; never granted to a tenant role)
  "platform.tenants",
  "platform.impersonate",
  "platform.audit",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLES = ["superuser", "owner", "admin", "manager", "staff"] as const;
export type Role = (typeof ROLES)[number];

const STAFF: Permission[] = [
  "orders.read",
  "orders.write",
  "orders.change_status",
  "clients.read",
  "clients.write",
  "translators.read",
  "notaries.read",
  "reports.read",
];

const MANAGER: Permission[] = [
  ...STAFF,
  "orders.delete",
  "translators.write",
  "notaries.write",
  "finance.read",
  "finance.record_payment",
  "finance.expenses",
  "reports.profit",
  "users.invite",
];

const ADMIN: Permission[] = [
  ...MANAGER,
  "finance.refund",
  "finance.transfer",
  "users.manage",
  "settings.manage",
  "apikeys.manage",
  "cms.manage",
];

const OWNER: Permission[] = [...ADMIN, "tenant.manage", "tenant.billing"];

const SUPERUSER: Permission[] = [
  ...OWNER,
  "platform.tenants",
  "platform.impersonate",
  "platform.audit",
];

/** Role -> permission bundle. Deduplicated so the arrays stay comparable. */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  staff: [...new Set(STAFF)],
  manager: [...new Set(MANAGER)],
  admin: [...new Set(ADMIN)],
  owner: [...new Set(OWNER)],
  superuser: [...new Set(SUPERUSER)],
};

export function permissionsForRole(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/** Does this permission set include the given permission? */
export function hasPermission(
  granted: readonly Permission[] | undefined,
  permission: Permission,
): boolean {
  return !!granted?.includes(permission);
}

/** True when every listed permission is held. */
export function hasAllPermissions(
  granted: readonly Permission[] | undefined,
  permissions: readonly Permission[],
): boolean {
  return permissions.every((p) => hasPermission(granted, p));
}

/** True when at least one listed permission is held. */
export function hasAnyPermission(
  granted: readonly Permission[] | undefined,
  permissions: readonly Permission[],
): boolean {
  return permissions.some((p) => hasPermission(granted, p));
}

/**
 * Actions that require a fresh 2FA code regardless of session age
 * (docs/03-SECURITY-AND-TENANCY.md §4.2). Enforced server-side; listed here so
 * the UI can warn before opening the dialog.
 */
export const STEP_UP_PERMISSIONS: readonly Permission[] = [
  "finance.transfer",
  "apikeys.manage",
  "settings.manage",
  "users.manage",
  "users.invite",
  "tenant.manage",
  "platform.impersonate",
];

export function requiresStepUp(permission: Permission): boolean {
  return STEP_UP_PERMISSIONS.includes(permission);
}
