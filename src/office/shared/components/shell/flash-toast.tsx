"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

import { usePathname, useRouter } from "@office/i18n/navigation";
import { DENIED_PARAM, FLASH_PARAM, isFlashKey } from "@office/shared/lib/flash";

/**
 * Shows the toast an action asked for with `withFlash`, or the reason a page
 * was refused (`?denied=plan|role`), then drops the flag from the address, so
 * a reload or a shared link does not say it again.
 */
export function FlashToast() {
  const t = useTranslations("flash");
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const key = params.get(FLASH_PARAM);
  const denied = params.get(DENIED_PARAM);

  useEffect(() => {
    const done = isFlashKey(key);
    const refused = denied === "plan" || denied === "role";
    if (!done && !refused) return;
    // A fixed id: a remount in development, or a second render with the flag
    // still in the address, replaces the toast instead of stacking a copy.
    if (done) toast.success(t(key), { id: `flash-${key}` });
    if (refused) {
      toast.warning(t(denied === "plan" ? "deniedPlan" : "deniedRole"), {
        id: `denied-${denied}`,
        duration: 8000,
      });
    }

    const rest = new URLSearchParams(params.toString());
    rest.delete(FLASH_PARAM);
    rest.delete(DENIED_PARAM);
    const query = rest.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}${window.location.hash}`, {
      scroll: false,
    });
  }, [key, denied, params, pathname, router, t]);

  return null;
}
