// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import type { Permission } from "@office/shared/auth/permissions";
import type { Plan } from "@office/shared/auth/plans";

/**
 * The permission checkboxes an owner sees when inviting or editing someone.
 *
 * Grouped and labelled in the language of the product — "Delete orders", not
 * `orders.delete`. The owner is choosing which parts of THEIR bureau somebody
 * works in; they should not have to learn the permission catalogue to do it.
 *
 * ## What is deliberately absent
 *
 * `platform.*` — those reach across tenants and are the superuser's, never a
 * bureau's to hand out. The API refuses them outright (`NON_OVERRIDABLE` in
 * `domain/plans.py`), so offering them would be offering something that
 * cannot work.
 *
 * `tenant.manage` and `tenant.billing` are here but marked `ownerOnly`: they
 * are what "this person can change the plan and the billing details" means,
 * and handing them to an employee by accident is a different class of mistake
 * from handing them the Clients tab.
 */

export interface PermissionOption {
  permission: Permission;
  label: string;
  /** One line on what it actually lets them do. */
  hint?: string;
  /** Plans that include it. Absent means both. */
  plans?: readonly Plan[];
  /** Rendered with a warning tone — this one hands over the bureau itself. */
  ownerOnly?: boolean;
}

export interface PermissionGroup {
  key: string;
  label: string;
  options: readonly PermissionOption[];
}

const BUREAU_ONLY: readonly Plan[] = ["bureau"];

export const PERMISSION_GROUPS: readonly PermissionGroup[] = [
  {
    key: "orders",
    label: "Translations",
    options: [
      { permission: "orders.read", label: "See orders" },
      { permission: "orders.write", label: "Create and edit orders" },
      { permission: "orders.change_status", label: "Move orders through statuses" },
      {
        permission: "orders.delete",
        label: "Delete orders",
        hint: "Removes the order and its documents. Usually only for mistakes.",
      },
    ],
  },
  {
    key: "directory",
    label: "Directory",
    options: [
      { permission: "clients.read", label: "See clients" },
      { permission: "clients.write", label: "Add and edit clients" },
      { permission: "notaries.read", label: "See notaries" },
      { permission: "notaries.write", label: "Add and edit notaries" },
      {
        permission: "translators.read",
        label: "See translators",
        plans: BUREAU_ONLY,
      },
      {
        permission: "translators.write",
        label: "Add and edit translators",
        plans: BUREAU_ONLY,
      },
    ],
  },
  {
    key: "money",
    label: "Money",
    options: [
      {
        permission: "finance.read",
        label: "See the Finances screen",
        plans: BUREAU_ONLY,
      },
      {
        permission: "finance.record_payment",
        label: "Record client payments",
        plans: BUREAU_ONLY,
      },
      { permission: "finance.expenses", label: "Record expenses", plans: BUREAU_ONLY },
      {
        permission: "finance.refund",
        label: "Issue refunds",
        hint: "Sends money back to a client.",
        plans: BUREAU_ONLY,
      },
      {
        permission: "finance.transfer",
        label: "Send bank transfers",
        hint: "Pays translators and notaries. Always asks for a 2FA code.",
        plans: BUREAU_ONLY,
      },
    ],
  },
  {
    key: "reports",
    label: "Reports",
    options: [
      { permission: "reports.read", label: "See reports" },
      {
        permission: "reports.profit",
        label: "See profit and margins",
        hint: "Without this they see revenue but not what the bureau earns on it.",
      },
    ],
  },
  {
    key: "admin",
    label: "Administration",
    options: [
      {
        permission: "users.invite",
        label: "Invite people",
        hint: "Invite people up to their own role, send an invitation again and see who is waiting. Included with managing staff accounts.",
        plans: BUREAU_ONLY,
      },
      {
        permission: "users.manage",
        label: "Manage staff accounts",
        hint: "Invite people and change what they can do, including this list.",
        plans: BUREAU_ONLY,
      },
      { permission: "settings.manage", label: "Change settings and pricing" },
      {
        permission: "apikeys.manage",
        label: "Manage API keys",
        plans: BUREAU_ONLY,
      },
      {
        permission: "cms.manage",
        label: "Edit the public website",
        plans: BUREAU_ONLY,
      },
      {
        permission: "tenant.manage",
        label: "Change the organisation's plan",
        ownerOnly: true,
      },
      {
        permission: "tenant.billing",
        label: "See and change billing",
        ownerOnly: true,
      },
    ],
  },
];

/** The options a given plan may offer. */
export function groupsForPlan(plan: Plan): PermissionGroup[] {
  return PERMISSION_GROUPS.map((group) => ({
    ...group,
    options: group.options.filter((option) => !option.plans || option.plans.includes(plan)),
  })).filter((group) => group.options.length > 0);
}

/** Every permission the catalogue offers on this plan, for validation. */
export function offeredPermissions(plan: Plan): Permission[] {
  return groupsForPlan(plan).flatMap((group) => group.options.map((o) => o.permission));
}
