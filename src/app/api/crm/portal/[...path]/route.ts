/**
 * The Orders tab's JSON calls, forwarded to the CRM as the signed-in translator.
 *
 * `/api/crm/portal/<path>` → `api.suliko.ge/api/v1/portal/<path>`. Everything
 * about identity and signing lives in `@/lib/crm/server`.
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
  return proxyToCrm(request, `/portal/${path}`);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
