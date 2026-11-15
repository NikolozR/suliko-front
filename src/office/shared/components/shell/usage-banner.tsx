"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Gauge } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@office/i18n/navigation";
import { cn } from "@office/shared/lib/utils";

/**
 * This month's orders against the package, as the shell shows them.
 *
 * Money is already formatted: it came off the wire as decimal strings and
 * never becomes a number here.
 */
export interface ShellUsage {
  orders: number;
  included: number;
  /** "ok" under 80 percent of the included orders, "near" from there, "limit" at all of them. */
  level: "ok" | "near" | "limit";
  /** All the orders are used: new ones are refused until the package is raised. */
  blocked: boolean;
}

/**
 * "You have used 41 of 50 orders", from 80 percent of the package, and again
 * when all of it is used: then new orders are refused until the package is raised
 * on the Billing page, which this strip points to. It only warns; the refusal
 * itself is the server's.
 */
export function UsageBanner({ usage }: { usage: ShellUsage }) {
  const t = useTranslations("shell.usage");
  const tNav = useTranslations("nav");
  if (usage.level === "ok") return null;

  const limit = usage.level === "limit";
  return (
    <div
      role="status"
      className={cn(
        "mb-4 flex flex-wrap items-center gap-3 rounded-md border px-3 py-2 text-sm print:hidden",
        limit
          ? "border-destructive/40 bg-destructive/10"
          : "border-status-warning/40 bg-status-warning/10",
      )}
    >
      <Gauge
        className={cn("size-4 shrink-0", limit ? "text-destructive" : "text-status-warning")}
        aria-hidden
      />
      <p className="min-w-0 flex-1">
        {limit
          ? t("bannerLimit", { included: usage.included })
          : t("bannerNear", { orders: usage.orders, included: usage.included })}
      </p>
      <Link href="/billing" className="shrink-0 text-xs font-medium underline underline-offset-2">
        {tNav("billing")}
      </Link>
    </div>
  );
}
