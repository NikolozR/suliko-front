// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
/**
 * Subscription plans.
 *
 * Mirrors `api.suliko.ge/src/suliko/domain/plans.py`; the backend's
 * `tests/test_parity.py` parses this file and asserts the two agree.
 *
 * ## This file is UX, not security
 *
 * Same standing as `permissions.ts`. The API intersects the role's
 * permissions with the plan's before it ever answers `/auth/session`, so a
 * session arrives here already masked and the sidebar needs no plan logic to
 * hide, say, Finances. What this file is for is the handful of screens no
 * permission guards — Dashboard, Calculator and Notifications are open to
 * every role — plus the onboarding and upgrade screens, which have to
 * describe a plan the tenant is not on yet.
 */

import type { Role } from "@office/shared/auth/permissions";

export const PLANS = ["freelancer", "bureau"] as const;
export type Plan = (typeof PLANS)[number];

/** What a tenant that has not chosen yet is treated as. The narrower one. */
export const DEFAULT_PLAN: Plan = "freelancer";

/**
 * Screens with no permission of their own, so the permission mask cannot
 * reach them and they are named here instead.
 */
export const FEATURES = ["notifications"] as const;
export type Feature = (typeof FEATURES)[number];

const FREELANCER_FEATURES: Feature[] = [];
const BUREAU_FEATURES: Feature[] = ["notifications"];

export const PLAN_FEATURES: Record<Plan, readonly Feature[]> = {
  freelancer: FREELANCER_FEATURES,
  bureau: BUREAU_FEATURES,
};

export function planAllows(plan: Plan, feature: Feature): boolean {
  return PLAN_FEATURES[plan]?.includes(feature) ?? false;
}

/** Parse the string the API sends. Unknown values fall back to the default. */
export function toPlan(value: string | null | undefined): Plan {
  return (PLANS as readonly string[]).includes(value ?? "") ? (value as Plan) : DEFAULT_PLAN;
}

/**
 * Labels for the onboarding and upgrade screens.
 *
 * Kept next to the plan definitions rather than in the message catalogue
 * because the catalogue is keyed by string and these have to stay in step
 * with `PLANS` — a plan added without a label should be a type error, not a
 * blank card.
 */
export const PLAN_LABELS: Record<Plan, string> = {
  freelancer: "Freelancer",
  bureau: "Bureau",
};

const ROLE_LABELS: Record<Role, string> = {
  superuser: "Superuser",
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  staff: "Staff",
};

/**
 * What to CALL someone's role, given the plan their organisation is on.
 *
 * A freelancer is stored as the owner of their own organisation — they have
 * to be, to change its settings and its plan — but "owner" of a one-person
 * business reads as an error to the person looking at it. Only the label
 * changes; permissions still come from the role and the plan, never from this.
 */
export function roleLabel(role: Role, plan: Plan): string {
  if (role === "owner" && plan === "freelancer") return "Freelancer";
  return ROLE_LABELS[role] ?? role;
}
