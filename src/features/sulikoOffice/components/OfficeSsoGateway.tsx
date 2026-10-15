"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import SulikoForm from "@/shared/components/SulikoForm";
import { useAuthStore } from "@/features/auth/store/authStore";
import { requestOfficeCode } from "../services/officeSsoService";
import { OFFICE_URL } from "../lib/officeLinks";

type Phase = "checking" | "signIn" | "redirecting" | "invalid" | "error";

/**
 * suliko.ge as the one sign-in for Suliko Office.
 *
 * Office sends the browser here with `redirect_uri`, `state` and a PKCE
 * `code_challenge`. Someone already signed in goes straight back with a
 * one-time code and sees nothing but "Opening Suliko Office…"; anyone else
 * signs in (or registers) with the usual form first — Google included, which
 * Office's own password form never could. `prompt=login` shows the form even
 * to someone signed in, for "use another account".
 *
 * The browser only ever goes to the address the backend issued the code for,
 * which it checks against its own list, never to `redirect_uri` as given.
 */
export default function OfficeSsoGateway() {
  const t = useTranslations("OfficeSso");
  const params = useSearchParams();
  const [phase, setPhase] = useState<Phase>("checking");
  const started = useRef(false);

  const redirectUri = params.get("redirect_uri") ?? "";
  const state = params.get("state") ?? "";
  const codeChallenge = params.get("code_challenge") ?? "";
  const method = params.get("code_challenge_method");
  const forceSignIn = params.get("prompt") === "login";
  const wellFormed =
    redirectUri.length > 0 &&
    state.length > 0 &&
    state.length <= 200 &&
    codeChallenge.length > 0 &&
    (!method || method === "S256");

  const continueToOffice = useCallback(async () => {
    setPhase("redirecting");
    const result = await requestOfficeCode(redirectUri, codeChallenge);
    if (result.ok) {
      const target = new URL(result.redirectUri);
      target.searchParams.set("code", result.code);
      target.searchParams.set("state", state);
      window.location.replace(target.toString());
      return;
    }
    setPhase(
      result.reason === "signed_out" ? "signIn" : result.reason === "invalid_request" ? "invalid" : "error",
    );
  }, [redirectUri, codeChallenge, state]);

  useEffect(() => {
    // Once: a second code (React's dev double-run) would only race the first.
    if (started.current) return;
    started.current = true;

    if (!wellFormed) {
      setPhase("invalid");
      return;
    }
    const begin = () => {
      if (useAuthStore.getState().token && !forceSignIn) {
        void continueToOffice();
      } else {
        setPhase("signIn");
      }
    };
    if (useAuthStore.persist.hasHydrated()) {
      begin();
      return;
    }
    return useAuthStore.persist.onFinishHydration(begin);
  }, [wellFormed, forceSignIn, continueToOffice]);

  if (phase === "signIn") {
    return (
      <SulikoForm
        onSignedIn={continueToOffice}
        subtitle={t("signInSubtitle")}
        registerSubtitle={t("registerSubtitle")}
      />
    );
  }

  return (
    <div className="z-[2] w-[92%] max-w-[420px] rounded-2xl border border-white/60 bg-white/65 px-6 py-8 text-center shadow-2xl backdrop-blur-xl dark:border-white/[0.12] dark:bg-white/[0.06] sm:px-8">
      {phase === "checking" || phase === "redirecting" ? (
        <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
          <Loader2 className="h-6 w-6 animate-spin text-suliko-default-color" aria-hidden />
          <p className="text-sm text-muted-foreground">{t("redirecting")}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-lg font-semibold">
            {phase === "invalid" ? t("invalidTitle") : t("errorTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {phase === "invalid" ? t("invalidBody") : t("errorBody")}
          </p>
          {phase === "error" ? (
            <button
              type="button"
              onClick={() => void continueToOffice()}
              className="mt-2 cursor-pointer rounded-lg bg-suliko-default-color px-4 py-2 text-sm font-medium text-white"
            >
              {t("retry")}
            </button>
          ) : (
            <a
              href={OFFICE_URL}
              className="mt-2 rounded-lg bg-suliko-default-color px-4 py-2 text-sm font-medium text-white"
            >
              {t("openOffice")}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
