import { reaccessToken, useAuthStore } from "@/features/auth";
import { API_BASE_URL } from "@/shared";

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: "success" | "pending" | "failed" | "refunded";
  description: string;
  pages?: number;
  cardLast4?: string;
}

// Backend contract assumed: GET /Payment/history -> array (or { items: [] }).
// Field names are mapped tolerantly in normalize().
const STATUS_MAP: Record<string, PaymentRecord["status"]> = {
  approved: "success", success: "success", paid: "success", completed: "success",
  created: "pending", pending: "pending", processing: "pending",
  declined: "failed", failed: "failed", expired: "failed", reversed: "failed",
  refunded: "refunded",
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function normalize(r: any): PaymentRecord {
  const raw = String(r.status ?? r.orderStatus ?? "").toLowerCase();
  return {
    id: String(r.id ?? r.orderId ?? r.paymentId ?? ""),
    date: r.createdAt ?? r.date ?? r.created ?? "",
    amount: Number(r.amount ?? 0),
    currency: r.currency ?? "GEL",
    status: STATUS_MAP[raw] ?? "pending",
    description: r.description ?? r.orderDescription ?? r.planName ?? "",
    pages: r.pages ?? r.pagesAdded ?? undefined,
    cardLast4: r.cardLast4 ?? r.last4 ?? undefined,
  };
}

export async function getPaymentHistory(): Promise<PaymentRecord[]> {
  const call = (token: string) =>
    fetch(`${API_BASE_URL}/Payment/history`, { headers: { Authorization: `Bearer ${token}` } });

  const { token, refreshToken } = useAuthStore.getState();
  if (!token) throw new Error("No token found");
  let res = await call(token);

  if (res.status === 401 && refreshToken) {
    const t = (await reaccessToken(refreshToken)) as { token: string; refreshToken: string };
    const s = useAuthStore.getState();
    s.setToken(t.token);
    s.setRefreshToken(t.refreshToken);
    res = await call(t.token);
  }
  if (!res.ok) throw new Error("Failed to load payment history");

  const data = await res.json();
  const list: any[] = Array.isArray(data) ? data : data.items ?? [];
  return list
    .map(normalize)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
