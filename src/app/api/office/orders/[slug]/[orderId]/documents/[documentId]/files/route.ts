import { NextRequest, NextResponse } from "next/server";
import { fileTicketUrl, isResponse, requirePortalUser } from "@/lib/office/portal";

type Params = {
  params: Promise<{ slug: string; orderId: string; documentId: string }>;
};

/**
 * Where to send a translation of this document: check who is asking, then
 * answer with an address on the Office API that takes ONE upload from them,
 * for five minutes. The file itself never passes through this server (a
 * Word file with a few scans in it is already past Vercel's body cap).
 *
 * The Office API decides whether the document is theirs to add to.
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { slug, orderId, documentId } = await params;
  if (
    !/^[a-z0-9][a-z0-9-]{1,62}$/.test(slug) ||
    !/^\d{1,18}$/.test(orderId) ||
    !/^\d{1,18}$/.test(documentId)
  ) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const outcome = await requirePortalUser(request);
  if (isResponse(outcome)) return outcome;

  const path = `/organizations/${slug}/orders/${orderId}/documents/${documentId}/files`;
  return NextResponse.json({ url: fileTicketUrl(outcome, path, "POST") });
}
