"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/features/ui/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/features/ui/components/ui/tabs";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import {
  getAssignments,
  getPersonalOrders,
  usePortalMe,
  type AssignedOrder,
  type PersonalOrderSummary,
} from "@/features/orders";
import { AssignedOrderCard, PersonalOrderCard } from "@/features/orders/components/OrderCards";
import { OrdersGate, OrdersNotice, OrdersSkeleton } from "@/features/orders/components/OrdersGate";

type Tab = "assigned" | "personal";

export default function OrdersPage() {
  const tTitles = useTranslations("PageTitles");
  useDocumentTitle(tTitles("orders"));

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <OrdersGate>
        <OrdersOverview />
      </OrdersGate>
    </div>
  );
}

function OrdersOverview() {
  const t = useTranslations("Orders");
  const { me } = usePortalMe();
  const [tab, setTab] = useState<Tab>("assigned");
  const [assigned, setAssigned] = useState<AssignedOrder[] | null>(null);
  const [personal, setPersonal] = useState<PersonalOrderSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [assignedOrders, personalOrders] = await Promise.all([
        getAssignments(),
        getPersonalOrders(),
      ]);
      setAssigned(assignedOrders);
      setPersonal(personalOrders);
      setError(null);
    } catch (loadError) {
      setError((loadError as Error).message);
    }
  }, []);

  useEffect(() => {
    void load();
    // New assignments made in the CRM show up when the translator comes back.
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  const noOrganizations = (me?.organizations.length ?? 0) === 0;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Button asChild size="sm" className="suliko-default-bg text-primary-foreground dark:text-white">
          <Link href="/orders/new">
            <Plus />
            {t("newOrder")}
          </Link>
        </Button>
      </div>

      {error && (
        <div className="mb-4">
          <OrdersNotice tone="error">
            <p>{t("loadError")}</p>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              {t("retry")}
            </Button>
          </OrdersNotice>
        </div>
      )}

      <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
        <TabsList className="mb-4">
          <TabsTrigger value="assigned">
            {t("tabAssigned")}
            {assigned && assigned.length > 0 && ` (${assigned.length})`}
          </TabsTrigger>
          <TabsTrigger value="personal">
            {t("tabPersonal")}
            {personal && personal.length > 0 && ` (${personal.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assigned">
          {assigned === null ? (
            !error && <OrdersSkeleton />
          ) : assigned.length === 0 ? (
            <OrdersNotice>
              <p>{noOrganizations ? t("noAssignedNoOrganizations") : t("noAssigned")}</p>
            </OrdersNotice>
          ) : (
            <div className="space-y-3">
              {assigned.map((order) => (
                <AssignedOrderCard
                  key={`${order.organization.slug}-${order.order_id}`}
                  order={order}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="personal">
          {personal === null ? (
            !error && <OrdersSkeleton />
          ) : personal.length === 0 ? (
            <OrdersNotice>
              <p>{t("noPersonal")}</p>
            </OrdersNotice>
          ) : (
            <div className="space-y-3">
              {personal.map((order) => (
                <PersonalOrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
