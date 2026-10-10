import { NextRequest } from "next/server";
import { isResponse, portalGet, requirePortalUser } from "@/lib/office/portal";

/** The orders bureaus have assigned to this translator. */
export async function GET(request: NextRequest) {
  const outcome = await requirePortalUser(request);
  if (isResponse(outcome)) return outcome;
  return portalGet(outcome, "/assignments");
}
