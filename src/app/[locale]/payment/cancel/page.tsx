"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent } from "@/features/ui";
import { Button } from "@/features/ui";
import LandingHeader from "@/shared/components/LandingHeader";
import LandingFooter from "@/shared/components/LandingFooter";
import { useAuthStore } from "@/features/auth";
import { BilingualText } from "@/features/pricing/components/BilingualText";
import { getBogPaymentStatus, readLastBogOrder } from "@/features/pricing/services/paymentService";
import {
  Bilingual,
  commonDeclineReasons,
  declineText,
  explainDecline,
} from "@/features/pricing/utils/paymentResultText";

// The customer usually lands here before the bank's callback reaches our API, so
// the order's status is asked for a few times before settling on general advice.
const POLL_ATTEMPTS = 8;
const POLL_INTERVAL_MS = 1500;
const FINAL_STATUSES = ["failed", "succeeded", "refunded"];

type Outcome =
  | { kind: "checking" }
  | { kind: "declined"; reason: Bilingual | null; code: string | null }
  | { kind: "notCompleted" };

export default function PaymentCancelPage() {
  const router = useRouter();
  // The poll below runs once per visit; a router that changes identity between
  // renders must not restart it.
  const routerRef = useRef(router);
  routerRef.current = router;
  const [outcome, setOutcome] = useState<Outcome>({ kind: "checking" });
  // Set after mount: the server render cannot know the domain, and guessing would
  // make the page change under the reader during hydration.
  const [supportEmail, setSupportEmail] = useState("info@suliko.ge");

  useEffect(() => {
    if (window.location.hostname.endsWith("suliko.io")) setSupportEmail("info@suliko.io");
  }, []);

  useEffect(() => {
    // Read once: the persisted sign-in is already restored by the time effects run.
    const orderId = readLastBogOrder();
    if (!orderId || !useAuthStore.getState().token) {
      setOutcome({ kind: "notCompleted" });
      return;
    }

    let cancelled = false;

    (async () => {
      for (let attempt = 0; attempt < POLL_ATTEMPTS && !cancelled; attempt++) {
        try {
          const status = await getBogPaymentStatus(orderId);
          if (cancelled) return;

          if (status.status === "succeeded") {
            // The bank sent the customer back the wrong way, but the money arrived.
            routerRef.current.replace("/payment/success");
            return;
          }

          if (FINAL_STATUSES.includes(status.status)) {
            setOutcome({
              kind: "declined",
              reason: explainDecline(status.declineCode, status.rejectReason),
              code: status.declineCode ?? null,
            });
            return;
          }
        } catch {
          // Unknown order or a network blip: keep trying, then fall back.
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }

      if (!cancelled) setOutcome({ kind: "notCompleted" });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const specificReason = outcome.kind === "declined" ? outcome.reason : null;
  const bankCode = outcome.kind === "declined" ? outcome.code : null;

  return (
    <div className="min-h-screen relative">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-linear-to-br from-orange-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-orange-900" />

      {/* Main content */}
      <div className="relative z-10">
        {/* Header */}
        <LandingHeader />

        {/* Main Content */}
        <main className="pt-20 sm:pt-24 pb-16 flex flex-col items-center justify-center min-h-screen">
          <div className="container mx-auto px-4 py-4 sm:py-8 max-w-md">
            <Card className="overflow-hidden">
              <CardContent className="p-6 sm:p-8 overflow-hidden">
                {/* Cancel Icon */}
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>

                {/* Cancel Message */}
                <div className="text-center mb-6">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                    <BilingualText text={declineText.title} secondClassName="text-lg sm:text-xl font-semibold opacity-80" />
                  </h1>
                  <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                    <BilingualText text={declineText.notCharged} />
                  </p>
                </div>

                {/* Why it failed */}
                <div className="mb-8 p-4 rounded-lg border border-orange-200 dark:border-orange-800 bg-white/60 dark:bg-gray-900/40 text-sm text-foreground" aria-live="polite">
                  {outcome.kind === "checking" && (
                    <div className="flex items-start gap-3 text-muted-foreground">
                      <span className="mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
                      <div>
                        <BilingualText text={declineText.checking} />
                      </div>
                    </div>
                  )}

                  {specificReason && (
                    <div className="leading-relaxed">
                      <BilingualText text={specificReason} secondClassName="mt-2 opacity-80" />
                    </div>
                  )}

                  {outcome.kind !== "checking" && !specificReason && (
                    <div className="leading-relaxed">
                      {outcome.kind === "notCompleted" && (
                        <div className="mb-3">
                          <BilingualText text={declineText.notCompleted} secondClassName="mt-2 opacity-80" />
                        </div>
                      )}
                      <h2 className="font-semibold mb-2">
                        <BilingualText text={declineText.commonReasonsTitle} secondClassName="mt-0 font-normal text-xs opacity-80" />
                      </h2>
                      <ul className="list-disc ps-5 space-y-2">
                        {commonDeclineReasons.map((reason) => (
                          <li key={reason.en}>
                            <BilingualText text={reason} secondClassName="mt-0 text-xs opacity-80" />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {bankCode && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {declineText.bankCode.ka} / {declineText.bankCode.en}: <span className="font-mono">{bankCode}</span>
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <Button
                    className="w-full sm:w-1/2 h-auto min-h-12 sm:min-h-14 py-2 flex-col gap-0 whitespace-normal text-sm sm:text-base bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                    onClick={() => router.push('/price')}
                  >
                    <BilingualText text={declineText.tryAgain} secondClassName="mt-0 text-xs opacity-80" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full sm:w-1/2 h-auto min-h-12 sm:min-h-14 py-2 flex-col gap-0 whitespace-normal text-sm sm:text-base border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-medium"
                    onClick={() => router.push('/')}
                  >
                    <BilingualText text={declineText.goHome} secondClassName="mt-0 text-xs opacity-80" />
                  </Button>
                </div>

                {/* Additional Info */}
                <div className="mt-8 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-orange-100 dark:bg-orange-800 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-1">
                        <BilingualText text={declineText.helpTitle} secondClassName="mt-0 opacity-80" />
                      </h3>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        <BilingualText text={bankCode ? declineText.helpWithCode : declineText.help} />
                        <a href={`mailto:${supportEmail}`} className="mt-2 inline-block font-medium underline underline-offset-2">
                          {supportEmail}
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Footer */}
        <LandingFooter />
      </div>
    </div>
  );
}
