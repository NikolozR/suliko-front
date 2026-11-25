import { requireAdminPage } from "@/features/admin/access";
import RevenueView from "./revenue-view";

/**
 * Revenue: the trend of confirmed card money and every payment behind it.
 * Our own accounts are left out unless asked for with ?internal=show, as on the dashboard.
 */
export default async function AdminRevenuePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPage("/admin/revenue");
  const query = await searchParams;
  return <RevenueView includeInternal={query.internal === "show"} />;
}
