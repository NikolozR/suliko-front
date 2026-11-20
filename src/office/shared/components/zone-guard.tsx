"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { useEffect } from "react";

/**
 * Suliko Office's screens are being moved into suliko.ge's own app, one module
 * at a time. Until the last one has moved, some of /app/... is answered by this
 * deployment and some by suliko.ge's. A client-side navigation between the two
 * asks the other build for its page data, which this build cannot use: the page
 * crashes ("Application error"). So such a navigation becomes a full page load.
 *
 * It works on the page-data requests themselves, so it covers <Link>,
 * router.push and prefetching alike: a prefetch of the other side's page is
 * refused (Next shrugs that off), a navigation is turned into a page load.
 *
 * `owns` says which modules this build answers: `{ only: [...] }` or
 * `{ except: [...] }` (module = the segment after the locale: "calculator").
 * With nothing listed on either side it does nothing.
 */
export type ZoneOwnership = { only: string[] } | { except: string[] };

const OFFICE_PATH = /^\/app\/(?:ka|en|hy)\/([^/?#]+)/;

function isOwned(pathname: string, owns: ZoneOwnership): boolean {
  const match = OFFICE_PATH.exec(pathname);
  if (!match) return true; // not an Office module address: leave it alone
  const name = match[1];
  return "only" in owns ? owns.only.includes(name) : !owns.except.includes(name);
}

function requestInfo(input: RequestInfo | URL, init?: RequestInit): { url: URL; headers: Headers } | null {
  try {
    const url = new URL(input instanceof Request ? input.url : input.toString(), window.location.href);
    const headers = new Headers(input instanceof Request ? input.headers : init?.headers);
    if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v));
    return { url, headers };
  } catch {
    return null;
  }
}

export function ZoneGuard({ owns }: { owns: ZoneOwnership }) {
  const listed = "only" in owns ? owns.only : owns.except;
  const active = "only" in owns || listed.length > 0;
  const key = JSON.stringify(owns);

  useEffect(() => {
    if (!active) return;
    const original = window.fetch;
    window.fetch = (input, init) => {
      const info = requestInfo(input, init);
      if (
        info &&
        info.url.origin === window.location.origin &&
        info.headers.get("rsc") === "1" &&
        !isOwned(info.url.pathname, owns)
      ) {
        if (info.headers.get("next-router-prefetch") === "1") {
          return Promise.reject(new Error("other zone"));
        }
        // Drop Next's own query (_rsc) so the address bar shows the real one.
        info.url.searchParams.delete("_rsc");
        window.location.assign(info.url.toString());
        return new Promise<Response>(() => {});
      }
      return original(input, init);
    };
    return () => {
      window.fetch = original;
    };
    // `owns` is compared through `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, key]);

  return null;
}
