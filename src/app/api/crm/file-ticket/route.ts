/**
 * Hands the browser a short-lived URL for one order-file upload or download.
 * See `mintFileTicket` in `@/lib/crm/server` for why files skip this server.
 */

import { NextRequest } from "next/server";
import { mintFileTicket } from "@/lib/crm/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return mintFileTicket(request);
}
