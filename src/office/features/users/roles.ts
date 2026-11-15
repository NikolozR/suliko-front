// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { ASSIGNABLE_ROLES, type AssignableRole } from "@office/features/users/schema";
import type { Role } from "@office/shared/auth/permissions";

/**
 * Seniority, the same order as `RANK` in `api/v1/users.py`. The API is what
 * enforces it; this only keeps a form from offering a role it would refuse, and
 * a read-only list from offering a filter for people it will not show.
 */
const RANK: Record<Role, number> = { staff: 1, manager: 2, admin: 3, owner: 4, superuser: 5 };

/** The roles someone may invite or see: their own and every one below it. */
export function rolesUpTo(role: Role): AssignableRole[] {
  return ASSIGNABLE_ROLES.filter((candidate) => RANK[candidate] <= RANK[role]);
}
