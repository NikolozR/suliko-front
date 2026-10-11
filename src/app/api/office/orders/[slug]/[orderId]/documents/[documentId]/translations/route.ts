import { NextRequest, NextResponse } from "next/server";
import { isResponse, portalGet, requirePortalUser } from "@/lib/office/portal";

type Params = { params: Promise<{ slug: string; orderId: string; documentId: string }> };

/**
 * The Suliko Translate jobs this translator started on one document. Asking is
 * what moves a running job along: the Office API files the result the first
 * time it is asked after the job has finished.
 */
export async function GET(request: NextRequest, { params }: Params) {
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
  return portalGet(
    outcome,
    `/organizations/${slug}/orders/${orderId}/documents/${documentId}/translations`,
  );
}
