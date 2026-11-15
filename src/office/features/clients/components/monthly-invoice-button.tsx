"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { CalendarRange, FileText } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { useRouter } from "@office/i18n/navigation";
import { monthNames } from "@office/shared/lib/months";
import { Button } from "@office/shared/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  dialogFormClass,
} from "@office/shared/components/ui/dialog";

const SELECT =
  "border-input bg-background focus-visible:ring-ring/50 mt-1.5 h-9 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-[3px]";

/**
 * "Monthly invoice" on a business client: pick the month, open the invoice.
 * The month starts on the one just finished, which is the one people bill.
 */
export function MonthlyInvoiceButton({ clientId }: { clientId: number }) {
  const t = useTranslations("clients.monthly");
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const [year, setYear] = useState(last.getFullYear());
  const [month, setMonth] = useState(last.getMonth() + 1);

  const names = monthNames(locale);
  const years = Array.from(
    { length: 5 },
    (_, index) => now.getFullYear() - index,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarRange /> {t("action")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader icon={FileText} hue="teal">
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("body")}</DialogDescription>
        </DialogHeader>
        <form
          className={dialogFormClass}
          onSubmit={(event) => {
            event.preventDefault();
            router.push(
              `/clients/${clientId}/monthly-invoice?month=${year}-${String(month).padStart(2, "0")}`,
            );
          }}
        >
          <DialogBody className="grid grid-cols-[1fr_7rem] gap-3">
            <label className="text-sm font-medium">
              {t("month")}
              <select
                className={SELECT}
                value={month}
                onChange={(event) => setMonth(Number(event.target.value))}
              >
                {names.map((name, index) => (
                  <option key={name} value={index + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              {t("year")}
              <select
                className={SELECT}
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
              >
                {years.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" variant="brand">
              <FileText /> {t("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
