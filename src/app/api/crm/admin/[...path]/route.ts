/**
 * Admin → Translators / Organizations, forwarded to the CRM's portal-admin API.
 *
 * `/api/crm/admin/<path>` → `api.suliko.ge/api/v1/portal-admin/<path>`, only for
 * users in SULIKO_PORTAL_ADMIN_USER_IDS. The CRM checks the admin flag again.
 */

import { NextRequest, NextResponse } from "next/server";
import { joinSegments, proxyToCrm } from "@/lib/crm/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const path = joinSegments((await context.params).path);
  if (!path) return NextResponse.json({ status: 404, detail: "Not found." }, { status: 404 });
  return proxyToCrm(request, `/portal-admin/${path}`, { requireAdmin: true });
}

export const GET = handle;
export const PUT = handle;
export const DELETE = handle;
