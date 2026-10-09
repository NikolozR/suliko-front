import { NextRequest } from "next/server";
import { isResponse, portalGet, requirePortalUser } from "@/lib/office/portal";

/** Is this suliko.ge user a translator for any bureau? Drives the Orders tab. */
export async function GET(request: NextRequest) {
  const outcome = await requirePortalUser(request);
  if (isResponse(outcome)) return outcome;
  return portalGet(outcome, "/me");
}
