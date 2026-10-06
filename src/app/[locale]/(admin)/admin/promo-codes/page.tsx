import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import PromoCodesManager from "./PromoCodesManager";

export default async function AdminPromoCodesPage() {
  const cookieStore = await cookies();
  const adminAllowed = cookieStore.get("adminAllowed")?.value === "1";
  if (!adminAllowed) redirect("/en/admin/login");

  return <PromoCodesManager />;
}
