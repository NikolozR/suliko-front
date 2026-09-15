"use client";

import { CalendarClock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/shared/lib/utils";
import type { LanguagePair } from "../types/types.Orders";
import { formatDate, isPastDue, pairLabel } from "../utils/orderFormat";

export function LanguagePairBadges({ pairs, className }: { pairs: LanguagePair[]; className?: string }) {
  const locale = useLocale();
  if (pairs.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {pairs.map((pair) => (
        <span
          key={`${pair.source_language}-${pair.target_language}`}
          className="inline-flex items-center rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-xs font-medium text-foreground"
        >
          {pairLabel(pair, locale)}
        </span>
      ))}
    </div>
  );
}

/**
 * The due date, amber once it has passed. Deliberately not "overdue": the
 * portal cannot see whether the bureau has already closed the order.
 */
export function DueDate({ value, className }: { value: string | null; className?: string }) {
  const locale = useLocale();
  const t = useTranslations("Orders");
  const past = isPastDue(value);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs",
        past ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground",
        className,
      )}
    >
      <CalendarClock className="h-3.5 w-3.5 shrink-0" />
      {value ? `${t("dueDate")}: ${formatDate(value, locale)}` : t("noDueDate")}
    </span>
  );
}
