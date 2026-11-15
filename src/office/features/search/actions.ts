"use server";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { listClients } from "@office/features/clients/api";
import { listOrders } from "@office/features/orders/api";
import { getSession } from "@office/shared/auth/session";
import { tolerate } from "@office/shared/lib/tolerate";

const PER_GROUP = 5;

export interface QuickSearchOrder {
  id: number;
  number: number;
  clientName: string;
  status: string | null;
  orderDate: string;
}

export interface QuickSearchClient {
  id: number;
  name: string;
  detail: string | null;
}

export interface QuickSearchResult {
  orders: QuickSearchOrder[];
  clients: QuickSearchClient[];
}

/**
 * The Ctrl+K box: orders and clients matching what was typed.
 *
 * Both lists use the same search their screens do, so an order number,
 * a client's name, email or phone, or a translator's name all find the
 * order. Each group is asked for only when the person may read it, and a
 * group that fails comes back empty rather than failing the other.
 */
export async function quickSearchAction(query: string): Promise<QuickSearchResult> {
  const search = query.trim().replace(/^#/, "").slice(0, 255);
  const session = await getSession();
  if (!session || search.length === 0) return { orders: [], clients: [] };

  const canOrders = session.permissions.includes("orders.read");
  const canClients = session.permissions.includes("clients.read");

  const [orders, clients] = await Promise.all([
    canOrders ? tolerate(listOrders({ search, sort: "-id", limit: PER_GROUP })) : null,
    canClients ? tolerate(listClients({ search, limit: PER_GROUP })) : null,
  ]);

  return {
    orders: (orders?.data?.items ?? []).map((order) => ({
      id: order.id,
      number: order.number,
      clientName: order.client_name,
      status: order.status,
      orderDate: order.order_date,
    })),
    clients: (clients?.data?.items ?? []).map((client) => ({
      id: client.id,
      name: client.name,
      detail: client.phone || client.email,
    })),
  };
}
