"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { useAuthStore } from "@/features/auth/store/authStore";
import { OFFICE_ORIGINS, officeAddress } from "../lib/officeLinks";

/**
 * The second half of signing out of Suliko Office: Office has ended its own
 * session and sends the browser here, so suliko.ge — the sign-in both share —
 * forgets the person too. Then on to `return_to`, if it is an Office address.
 *
 * Done at once only when Office sent them (the referrer says so). A link from
 * anywhere else asks first, so no other site can sign people out by linking here.
 */
export default function OfficeSignOut() {
  const t = useTranslations("OfficeSso");
  const locale = useLocale();
  const params = useSearchParams();
  const [confirming, setConfirming] = useState(false);
  const started = useRef(false);

  const next = officeAddress(params.get("return_to")) ?? `/${locale}/sign-in`;

  const signOut = useCallback(() => {
    useAuthStore.getState().reset();
    window.location.replace(next);
  }, [next]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let fromOffice = false;
    try {
      fromOffice = OFFICE_ORIGINS.includes(new URL(document.referrer).origin);
    } catch {
      fromOffice = false;
    }
    if (fromOffice || !useAuthStore.getState().token) {
      signOut();
    } else {
      setConfirming(true);
    }
  }, [signOut]);

  return (
    <div className="z-[2] w-[92%] max-w-[420px] rounded-2xl border border-white/60 bg-white/65 px-6 py-8 text-center shadow-2xl backdrop-blur-xl dark:border-white/[0.12] dark:bg-white/[0.06] sm:px-8">
      {confirming ? (
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-lg font-semibold">{t("signOutTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("signOutBody")}</p>
          <button
            type="button"
            onClick={signOut}
            className="mt-2 w-full cursor-pointer rounded-lg bg-suliko-default-color px-4 py-2 text-sm font-medium text-white"
          >
            {t("signOut")}
          </button>
          <a href={`/${locale}/document`} className="text-sm text-muted-foreground hover:underline">
            {t("stay")}
          </a>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
          <Loader2 className="h-6 w-6 animate-spin text-suliko-default-color" aria-hidden />
          <p className="text-sm text-muted-foreground">{t("signingOut")}</p>
        </div>
      )}
    </div>
  );
}
