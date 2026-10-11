import { NextRequest, NextResponse } from "next/server";
import { isResponse, portalPost, requirePortalUser } from "@/lib/office/portal";

type Params = {
  params: Promise<{ slug: string; orderId: string; documentId: string; fileId: string }>;
};

// The Office API hands the file to suliko.ge's translator before it answers,
// which takes a while for a long scan.
export const maxDuration = 60;

/**
 * Start Suliko Translate on a file the bureau sent, with the translator's own
 * notes and name spellings. The pages come out of the caller's suliko.ge
 * balance; the Office API says so (402) when it does not cover them.
 */
export async function POST(request: NextRequest, { params }: Params) {
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

  // Only what the Office API takes; it validates the values itself.
  const sent = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const body = {
    instructions: typeof sent.instructions === "string" ? sent.instructions : null,
    names: Array.isArray(sent.names) ? sent.names : [],
  };
  return portalPost(
    outcome,
    `/organizations/${slug}/orders/${orderId}/documents/${documentId}/files/${fileId}/translate`,
    body,
  );
}
