// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import type { ReactNode } from "react";

import type { Permission } from "@office/shared/auth/permissions";
import { getSession } from "@office/shared/auth/session";

/**
 * Render children only when the current session holds a permission.
 *
 * This is a Server Component, so the gated markup is never sent to a browser
 * that shouldn't see it — better than rendering it and hiding with CSS.
 *
 * **This is still UX, not security.** Every route and mutation re-checks
 * server-side. See src/shared/auth/permissions.ts.
 */
export async function Can({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const session = await getSession();
  const allowed = !!session?.permissions.includes(permission);

  return <>{allowed ? children : fallback}</>;
}

/**
 * Render children when ANY of the permissions is held. Useful for a section
 * that several roles reach by different routes.
 */
export async function CanAny({
  permissions,
  children,
  fallback = null,
}: {
  permissions: readonly Permission[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const session = await getSession();
  const allowed = permissions.some((p) => session?.permissions.includes(p));

  return <>{allowed ? children : fallback}</>;
}
