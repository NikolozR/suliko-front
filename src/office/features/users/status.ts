// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
/**
 * Where a person is, as the Users list says it.
 *
 * "Active" used to cover both someone who works here every day and someone who
 * accepted an invitation and has never signed in, which is exactly the person
 * who needs attention. These four are told apart from what the API already
 * sends; `not_signed_in` also covers anyone added directly who never used the
 * account.
 */
export type UserState = "off" | "invited" | "not_signed_in" | "signed_in";

/** The states a list can be filtered to (`state` on `GET /users`). */
export const USER_FILTER_STATES = ["invited", "not_signed_in", "signed_in"] as const;
export type UserFilterState = (typeof USER_FILTER_STATES)[number];

export function isUserFilterState(value: unknown): value is UserFilterState {
  return (USER_FILTER_STATES as readonly unknown[]).includes(value);
}

interface StateFields {
  is_active: boolean;
  invitation_pending?: boolean;
  last_login_at: string | null;
}

export function userState(user: StateFields): UserState {
  if (!user.is_active) return "off";
  if (user.invitation_pending) return "invited";
  if (!user.last_login_at) return "not_signed_in";
  return "signed_in";
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days since `iso`, never negative. */
export function daysSince(iso: string, now: number = Date.now()): number {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return 0;
  return Math.max(0, Math.floor((now - then) / DAY_MS));
}
