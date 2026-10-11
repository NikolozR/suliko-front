"use client";

import { useLocale, useTranslations } from "next-intl";
import { Check, Clock } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { dueOf, formatDate, type DocumentStatus } from "../display";

const CHIP = "inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium";

const TONES = {
  red: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  amber: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400",
  green: "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400",
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  quiet: "bg-muted text-muted-foreground",
};

/** A date further off than this is given as the date, not as a count of days. */
const COUNTED_DAYS = 14;

/**
 * When an order is due, said as people think of it ("Due in 4 days") and
 * louder the closer it is. Once everything is sent there is nothing left to
 * hurry, so it is the plain date.
 */
export function DueBadge({ dueDate, done = false }: { dueDate: string | null; done?: boolean }) {
  const t = useTranslations("Orders");
  const locale = useLocale();
  const due = dueOf(dueDate);
  if (due.when === "none") {
    return <span className="shrink-0 text-xs text-muted-foreground">{t("noDue")}</span>;
  }

  const on = formatDate(due.date, locale);
  const text =
    done || due.days > COUNTED_DAYS
      ? t("dueOn", { date: on })
      : due.days < 0
        ? t("overdueBy", { days: -due.days })
        : due.days === 0
          ? t("dueToday")
          : due.days === 1
            ? t("dueTomorrow")
            : t("dueIn", { days: due.days });
  const tone = done ? "quiet" : due.urgency === "overdue" ? "red" : due.urgency === "soon" ? "amber" : "quiet";

  return (
    <span className={cn(CHIP, TONES[tone])} title={on}>
      <Clock className="h-3.5 w-3.5" aria-hidden />
      {text}
    </span>
  );
}

/** Where one document stands for this translator. */
export function StatusChip({ status }: { status: DocumentStatus }) {
  const t = useTranslations("Orders");
  return (
    <span className={cn(CHIP, TONES[status === "sent" ? "green" : status === "inProgress" ? "blue" : "quiet"])}>
      {status === "sent" && <Check className="h-3.5 w-3.5" aria-hidden />}
      {t(status === "sent" ? "statusSent" : status === "inProgress" ? "statusInProgress" : "statusNotStarted")}
    </span>
  );
}

/** How much of an order has been handed in: "2 of 3 sent". */
export function SentChip({ sent, total }: { sent: number; total: number }) {
  const t = useTranslations("Orders");
  const all = total > 0 && sent >= total;
  return (
    <span className={cn(CHIP, TONES[all ? "green" : sent > 0 ? "blue" : "quiet"])}>
      {all && <Check className="h-3.5 w-3.5" aria-hidden />}
      {all ? t("allSent") : t("sentOf", { sent, total })}
    </span>
  );
}
