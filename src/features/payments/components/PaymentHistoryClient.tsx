"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Receipt } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Skeleton } from "@/features/ui/components/ui/skeleton";
import { getPaymentHistory, PaymentRecord } from "../paymentHistoryService";
import { PaymentRow } from "./PaymentRow";

export default function PaymentHistoryClient() {
  const t = useTranslations("Payments");
  const [items, setItems] = useState<PaymentRecord[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getPaymentHistory().then(setItems).catch(() => setError(true));
  }, []);


  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 pb-24 md:pb-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Receipt className="h-6 w-6" /> {t("title")}
        </h1>
        <Link href="/price" className="text-sm font-semibold text-emerald-600 hover:underline">
          {t("topUp")}
        </Link>
      </div>

      {error && <p className="text-sm text-red-500">{t("error")}</p>}

      {!items && !error && (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      )}

      {items && items.length === 0 && (
        <p className="text-muted-foreground rounded-xl border border-border bg-card p-8 text-center">
          {t("empty")}
        </p>
      )}

      {items && items.length > 0 && (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card px-4">
          {items.map((p) => <PaymentRow key={p.id} payment={p} />)}
        </ul>
      )}
    </div>
  );
}
