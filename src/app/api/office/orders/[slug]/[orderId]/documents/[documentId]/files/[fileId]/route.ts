import { NextRequest, NextResponse } from "next/server";
import { fileTicketUrl, isResponse, portalDelete, requirePortalUser } from "@/lib/office/portal";

type Params = {
  params: Promise<{ slug: string; orderId: string; documentId: string; fileId: string }>;
};

/** The file's path on the Office API's portal, or null if the address is not one. */
async function portalPath({ params }: Params): Promise<string | null> {
  const { slug, orderId, documentId, fileId } = await params;
  if (
    !/^[a-z0-9][a-z0-9-]{1,62}$/.test(slug) ||
    !/^\d{1,18}$/.test(orderId) ||
    !/^\d{1,18}$/.test(documentId) ||
    !/^[A-Za-z0-9_-]{8,100}$/.test(fileId)
  ) {
    return null;
  }
  return `/organizations/${slug}/orders/${orderId}/documents/${documentId}/files/${fileId}`;
}

/**
 * Download one file: check who is asking, then send the browser to the Office
 * API with a ticket for exactly this file. The file itself never passes through
 * this server.
 */
export async function GET(request: NextRequest, context: Params) {
  const path = await portalPath(context);
  if (!path) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const outcome = await requirePortalUser(request);
  if (isResponse(outcome)) return outcome;

  return NextResponse.redirect(fileTicketUrl(outcome, path), 302);
}

/**
 * Remove one file. The Office API decides whether it may go: only a
 * translation the person asking added themselves; what the bureau sent or
 * added is the bureau's.
 */
export async function DELETE(request: NextRequest, context: Params) {
  const path = await portalPath(context);
  if (!path) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const outcome = await requirePortalUser(request);
  if (isResponse(outcome)) return outcome;

  return portalDelete(outcome, path);
}
