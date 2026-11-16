"use client";

import NextLink from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { fetchAssignments } from "@/features/orders/api";
import { cn } from "@/shared/lib/utils";

/**
 * Orders' two sources, at the top of the Orders screen: this office's own
 * orders, and the ones translation bureaus have assigned to this person. The
 * second appears only when at least one bureau works with them (or it is open).
 */
export function OrdersSourceSwitch({
  active,
  officeHref,
  bureausHref,
  officeCount,
}: {
  active: "office" | "bureaus";
  /** Full addresses (/ka/orders, /ka/orders?view=bureaus). */
  officeHref: string;
  bureausHref: string;
  officeCount?: number;
}) {
  const t = useTranslations("Orders");
  const [bureauCount, setBureauCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAssignments().then((loaded) => {
      if (!cancelled) setBureauCount(loaded.status === "ok" ? loaded.data.length : 0);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // On the office view, no bureau work: nothing to switch to.
  if (active === "office" && !bureauCount) return null;

  const tab = (key: "office" | "bureaus", href: string, label: string, count: number | null | undefined) => (
    <NextLink
      href={href}
      aria-current={active === key ? "page" : undefined}
      className={cn(
        "inline-flex h-(--btn-h-sm) items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
        active === key
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
      {typeof count === "number" && (
        <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums text-muted-foreground">{count}</span>
      )}
    </NextLink>
  );

  return (
    <nav aria-label={t("viewLabel")} className="mb-4 inline-flex gap-1 rounded-lg bg-muted p-1">
      {tab("office", officeHref, t("viewOffice"), officeCount)}
      {tab("bureaus", bureausHref, t("viewBureaus"), bureauCount)}
    </nav>
  );
}
