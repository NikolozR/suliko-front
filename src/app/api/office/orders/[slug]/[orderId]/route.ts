import { NextRequest, NextResponse } from "next/server";
import { isResponse, portalGet, requirePortalUser } from "@/lib/office/portal";

type Params = { params: Promise<{ slug: string; orderId: string }> };

/** One assigned order, with this translator's documents and their files. */
export async function GET(request: NextRequest, { params }: Params) {
  const { slug, orderId } = await params;
  // The Office API validates these too; refusing odd values here keeps them out of its URL.
  if (!/^[a-z0-9][a-z0-9-]{1,62}$/.test(slug) || !/^\d{1,18}$/.test(orderId)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const outcome = await requirePortalUser(request);
  if (isResponse(outcome)) return outcome;
  return portalGet(outcome, `/organizations/${slug}/orders/${orderId}`);
}
