"use client";

import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { useRouter } from "@/i18n/navigation";
import { Card } from "@/features/ui/components/ui/card";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { createPersonalOrder, uploadOrderFile } from "@/features/orders";
import { BackToOrders, OrdersGate } from "@/features/orders/components/OrdersGate";
import { PersonalOrderForm } from "@/features/orders/components/PersonalOrderForm";

export default function NewOrderPage() {
  const t = useTranslations("Orders");
  const router = useRouter();
  useDocumentTitle(t("createTitle"));

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <BackToOrders />
      <h1 className="text-2xl font-semibold text-foreground mb-6">{t("createTitle")}</h1>
      <OrdersGate>
        <Card className="p-6 border border-border/60">
          <PersonalOrderForm
            allowFiles
            submitLabel={t("createSubmit")}
            submittingLabel={t("creating")}
            onCancel={() => router.push("/orders")}
            onSubmit={async (input, files) => {
              const order = await createPersonalOrder(input);
              try {
                for (const file of files) {
                  await uploadOrderFile({ type: "personal", orderId: order.id }, file, "source");
                }
              } catch (uploadError) {
                // The order exists either way; the files can be retried from its page.
                toast.error(t("uploadFailed", { message: (uploadError as Error).message }));
              }
              toast.success(t("created"));
              router.push(`/orders/personal/${order.id}`);
            }}
          />
        </Card>
      </OrdersGate>
    </div>
  );
}
