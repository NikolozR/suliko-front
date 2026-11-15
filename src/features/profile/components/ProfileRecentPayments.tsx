"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Receipt } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/ui/components/ui/card";
import { Skeleton } from "@/features/ui/components/ui/skeleton";
import { getPaymentHistory, type PaymentRecord } from "@/features/payments/paymentHistoryService";
import { PaymentRow } from "@/features/payments/components/PaymentRow";

const RECENT = 5;

/** The last few payments, in view on the Billing section. The full list is /payments. */
export function ProfileRecentPayments() {
  const t = useTranslations("Payments");
  const [items, setItems] = useState<PaymentRecord[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getPaymentHistory().then((r) => setItems(r.slice(0, RECENT))).catch(() => setError(true));
  }, []);

  return (
    <Card className="border border-border/60 bg-card shadow-sm rounded-2xl">
      <CardHeader className="pb-2 pt-6 px-6 md:px-8">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <div className="p-1.5 rounded-lg bg-muted"><Receipt className="h-4 w-4 text-muted-foreground" /></div>
            {t("title")}
          </CardTitle>
          <Link href="/payments" className="text-sm font-medium text-primary hover:underline">{t("viewAll")}</Link>
        </div>
      </CardHeader>
      <CardContent className="px-6 md:px-8 pb-4">
        {error && <p className="py-3 text-sm text-destructive">{t("error")}</p>}
        {!items && !error && <div className="space-y-2 py-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>}
        {items && items.length === 0 && <p className="py-4 text-sm text-muted-foreground">{t("empty")}</p>}
        {items && items.length > 0 && (
          <ul className="divide-y divide-border">{items.map((p) => <PaymentRow key={p.id} payment={p} compact />)}</ul>
        )}
      </CardContent>
    </Card>
  );
}
