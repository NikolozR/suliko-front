import { NextRequest, NextResponse } from "next/server";
import { fileTicketUrl, isResponse, requirePortalUser } from "@/lib/office/portal";

type Params = {
  params: Promise<{ slug: string; orderId: string; documentId: string; fileId: string }>;
};

/**
 * Download one file: check who is asking, then send the browser to the Office
 * API with a ticket for exactly this file. The file itself never passes through
 * this server.
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { slug, orderId, documentId, fileId } = await params;
  if (
    !/^[a-z0-9][a-z0-9-]{1,62}$/.test(slug) ||
    !/^\d{1,18}$/.test(orderId) ||
    !/^\d{1,18}$/.test(documentId) ||
    !/^[A-Za-z0-9_-]{8,100}$/.test(fileId)
  ) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const outcome = await requirePortalUser(request);
  if (isResponse(outcome)) return outcome;

  const path = `/organizations/${slug}/orders/${orderId}/documents/${documentId}/files/${fileId}`;
  return NextResponse.redirect(fileTicketUrl(outcome, path), 302);
}
